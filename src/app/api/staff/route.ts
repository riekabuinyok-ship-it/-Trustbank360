import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { PlanEnforcementError, updateOverLimit } from "@/lib/plan-enforcement"
import { formatApiError, formatPlanError } from "@/lib/api-error"
import { getLimit, getPlanByName } from "@/lib/plan-config"

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

    const tempPassword = Math.random().toString(36).slice(-10)
    const hashedPassword = await bcrypt.hash(tempPassword, 12)

    const staff = await prisma.$transaction(async (tx) => {
      const staffCount = await tx.user.count({ where: { companyId: user.companyId } })
      const limit = getLimit(planName, "staff")
      if (limit !== Infinity && staffCount >= limit) {
        throw new PlanEnforcementError(formatPlanError("STAFF_LIMIT_REACHED", planName, staffCount, limit))
      }

      return tx.user.create({
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
    })

    updateOverLimit(user.companyId).catch(() => {})

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
    return NextResponse.json(formatApiError("STAFF_LIMIT_REACHED", { upgradeRequired: false, title: "Staff invitation failed", message: "We couldn't invite this team member. Please try again or contact support if the issue persists." }), { status: 500 })
  }
}
