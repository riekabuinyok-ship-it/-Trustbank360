import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateBranchCode } from "@/lib/utils"
import { ensureEnterprisePlan } from "@/lib/migrate-to-enterprise"
import { formatApiError } from "@/lib/api-error"
import { getAllowedCurrencies } from "@/lib/plan-config"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  await ensureEnterprisePlan(user.companyId)

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

    await ensureEnterprisePlan(user.companyId)

    const existingBranches = await prisma.branch.findMany({
      where: { companyId: user.companyId },
      select: { id: true },
    })

    const created = await prisma.branch.create({
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

    const allowedCurrencies = getAllowedCurrencies()
    const walletCurrencies = await prisma.wallet.groupBy({
      by: ["currency"],
      where: { companyId: user.companyId },
    })
    const existingSet = new Set(walletCurrencies.map((w) => w.currency))
    const addedCurrencies = allowedCurrencies.filter((c) => !existingSet.has(c as any))

    if (addedCurrencies.length > 0) {
      await prisma.wallet.createMany({
        data: addedCurrencies.map((currency) => ({
          currency: currency as any,
          balance: 0,
          openingBalance: 0,
          branchId: created.id,
          companyId: user.companyId,
        })),
      })
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "CREATE_BRANCH",
        resource: "BRANCH",
        details: `Branch ${created.name} created`,
        branchId: created.id,
        companyId: user.companyId,
      },
    })

    return NextResponse.json(created)
  } catch (error) {
    console.error("[POST /api/branches] Failed:", error)
    const realMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      formatApiError("BRANCH_CREATION_FAILED", {
        title: "Branch creation failed",
        message: `We couldn't create this branch. ${realMessage}`,
        upgradeRequired: false,
      }),
      { status: 500 }
    )
  }
}
