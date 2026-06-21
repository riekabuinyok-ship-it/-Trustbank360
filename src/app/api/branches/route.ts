import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateBranchCode } from "@/lib/utils"
import { PlanEnforcementError, updateOverLimit } from "@/lib/plan-enforcement"
import { formatApiError, formatPlanError } from "@/lib/api-error"
import { getLimit, getPlanByName, getAllowedCurrencies } from "@/lib/plan-config"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  const branches = await prisma.branch.findMany({
    where: { companyId: user.companyId },
    include: { _count: { select: { users: true, wallets: true } } },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(branches)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  if (user.role !== "COMPANY_OWNER" && user.role !== "company_owner" && user.role !== "COMPANY_ADMIN" && user.role !== "company_admin") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  try {
    const body = await request.json()

    const company = await prisma.company.findUnique({ where: { id: user.companyId }, select: { overLimit: true } })
    if (company?.overLimit) {
      return NextResponse.json(formatApiError("COMPANY_OVER_LIMIT"), { status: 403 })
    }

    const sub = await prisma.subscription.findUnique({
      where: { companyId: user.companyId },
      select: { plan: { select: { name: true } } },
    })
    if (!sub || !getPlanByName(sub.plan.name)) {
      return NextResponse.json(formatApiError("NO_SUBSCRIPTION"), { status: 403 })
    }
    const planName = sub.plan.name

    const branch = await prisma.$transaction(async (tx) => {
      const branchCount = await tx.branch.count({ where: { companyId: user.companyId } })
      const limit = getLimit(planName, "branches")
      if (limit !== Infinity && branchCount >= limit) {
        throw new PlanEnforcementError(formatPlanError("BRANCH_LIMIT_REACHED", planName, branchCount, limit))
      }

      const existingBranches = await tx.branch.findMany({ where: { companyId: user.companyId }, select: { id: true } })

      const created = await tx.branch.create({
        data: {
          name: body.name,
          code: generateBranchCode(body.name, existingBranches.length),
          country: body.country,
          state: body.state,
          city: body.city,
          address: body.address,
          contactPhone: body.contactPhone,
          contactEmail: body.contactEmail,
          companyId: user.companyId,
        },
      })

      const newCurrencies = getAllowedCurrencies(planName)
      const walletCurrencies = await tx.wallet.groupBy({
        by: ["currency"],
        where: { companyId: user.companyId },
      })
      const existingSet = new Set(walletCurrencies.map((w) => w.currency))
      const addedCurrencies = newCurrencies.filter((c) => !existingSet.has(c as any))

      await tx.wallet.createMany({
        data: addedCurrencies.map((currency) => ({
          currency: currency as any,
          balance: 0,
          openingBalance: 0,
          branchId: created.id,
          companyId: user.companyId,
        })),
      })

      return created
    })

    updateOverLimit(user.companyId).catch(() => {})

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "CREATE_BRANCH",
        resource: "BRANCH",
        details: `Branch ${branch.name} created`,
        branchId: branch.id,
        companyId: user.companyId,
      },
    })

    return NextResponse.json(branch)
  } catch (error) {
    if (error instanceof PlanEnforcementError) {
      return NextResponse.json(error.toJSON(), { status: 403 })
    }
    return NextResponse.json(formatApiError("BRANCH_LIMIT_REACHED", { upgradeRequired: false, title: "Branch creation failed", message: "We couldn't create this branch. Please try again or contact support if the issue persists." }), { status: 500 })
  }
}
