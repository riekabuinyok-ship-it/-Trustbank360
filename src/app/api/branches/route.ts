import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateBranchCode } from "@/lib/utils"
import { checkPlanLimit, PlanEnforcementError } from "@/lib/plan-enforcement"

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
      return NextResponse.json({
        success: false,
        errorCode: "COMPANY_OVER_LIMIT",
        message: "Your company has exceeded its plan limits. Please upgrade your plan to continue creating resources.",
        usage: 0,
        limit: "N/A",
        plan: "Current",
        upgradeRequired: true,
        suggestedPlan: null,
      }, { status: 403 })
    }

    await checkPlanLimit({ companyId: user.companyId, feature: "branches" })

    const existingBranches = await prisma.branch.findMany({ where: { companyId: user.companyId }, select: { id: true } })

    const branch = await prisma.branch.create({
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

    // Create wallets for the new branch
    const currencies = ["SSP", "USD", "KES", "UGX"]
    await checkPlanLimit({ companyId: user.companyId, feature: "currencies" })
    await prisma.wallet.createMany({
      data: currencies.map((currency) => ({
        currency: currency as any,
        balance: 0,
        openingBalance: 0,
        branchId: branch.id,
        companyId: user.companyId,
      })),
    })

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
    return NextResponse.json({ error: "Failed to create branch" }, { status: 500 })
  }
}
