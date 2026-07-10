import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateBranchCode } from "@/lib/utils"
import { ensureEnterprisePlan } from "@/lib/migrate-to-enterprise"
import { formatApiError } from "@/lib/api-error"
import { validatePhone } from "@/lib/phone-validation"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  await ensureEnterprisePlan(user.companyId)

  const branches = await prisma.branch.findMany({
    where: { companyId: user.companyId },
    include: { _count: { select: { users: true } } },
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

    let normalizedPhone = body.contactPhone
    if (body.contactPhone) {
      const phoneResult = validatePhone(body.contactPhone)
      if (!phoneResult.valid) {
        return NextResponse.json({ error: phoneResult.error }, { status: 400 })
      }
      normalizedPhone = phoneResult.normalized!
    }

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
        contactPhone: normalizedPhone,
        contactEmail: body.contactEmail,
        companyId: user.companyId,
      },
    })

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
