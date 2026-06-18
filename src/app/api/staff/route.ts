import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { checkPlanLimit, PlanEnforcementError } from "@/lib/plan-enforcement"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  const staff = await prisma.user.findMany({
    where: { companyId: user.companyId },
    include: { branch: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(staff)
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

    await checkPlanLimit({ companyId: user.companyId, feature: "staff" })

    const tempPassword = Math.random().toString(36).slice(-10)
    const hashedPassword = await bcrypt.hash(tempPassword, 12)

    const staff = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        position: body.position,
        role: body.role,
        branchId: body.branchId,
        companyId: user.companyId,
        password: hashedPassword,
        status: "INVITED",
        mustChangePassword: true,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "INVITE_STAFF",
        resource: "USER",
        details: `${staff.name} invited as ${body.role}`,
        branchId: body.branchId,
        companyId: user.companyId,
      },
    })

    return NextResponse.json({ ...staff, tempPassword })
  } catch (error) {
    if (error instanceof PlanEnforcementError) {
      return NextResponse.json(error.toJSON(), { status: 403 })
    }
    return NextResponse.json({ error: "Failed to invite staff" }, { status: 500 })
  }
}
