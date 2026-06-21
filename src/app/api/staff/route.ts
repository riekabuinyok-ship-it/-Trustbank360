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
    where: {
      companyId: user.companyId,
      role: { notIn: ["platform_owner", "PLATFORM_ADMIN", "SUPER_ADMIN"] },
    },
    include: { branch: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(staff)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  const isSupervisor = user.role === "COMPANY_OWNER" || user.role === "company_owner" ||
    user.role === "COMPANY_ADMIN" || user.role === "company_admin"
  const isBranchManager = user.role === "BRANCH_MANAGER" || user.role === "branch_manager"

  if (!isSupervisor && !isBranchManager) {
    return NextResponse.json({ error: "You do not have sufficient permissions to perform this action." }, { status: 403 })
  }

  try {
    const body = await request.json()

    // Branch Manager can only create staff in their own branch
    if (isBranchManager) {
      if (!user.branchId) {
        return NextResponse.json({ error: "You are not assigned to a branch. Contact your company owner." }, { status: 403 })
      }
      if (body.branchId !== user.branchId) {
        return NextResponse.json({ error: "Branch Managers can only invite staff to their own branch." }, { status: 403 })
      }
    }

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

    // Handle Prisma unique constraint violation (duplicate email)
    if ((error as any)?.code === "P2002") {
      const target = ((error as any)?.meta?.target as string[]) || []
      if (target.includes("email")) {
        return NextResponse.json({
          error: "This email address is already registered.",
          message: "A staff member with this email already exists in the system. Please use a different email address.",
        }, { status: 409 })
      }
    }

    const errorMsg = error instanceof Error ? error.message : "Staff invitation failed"
    console.error("Staff creation error:", errorMsg)

    return NextResponse.json({
      error: "Staff invitation failed",
      message: errorMsg,
    }, { status: 500 })
  }
}
