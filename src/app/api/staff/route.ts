import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { ensureEnterprisePlan } from "@/lib/migrate-to-enterprise"
import { formatApiError } from "@/lib/api-error"
import { sendWelcomeEmail } from "@/lib/email"
import { validatePhone } from "@/lib/phone-validation"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  await ensureEnterprisePlan(user.companyId)

  const staff = await prisma.user.findMany({
    where: {
      companyId: user.companyId,
      role: { notIn: ["platform_owner", "PLATFORM_ADMIN", "SUPER_ADMIN"] },
      status: { notIn: ["INACTIVE"] },
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

    if (isBranchManager) {
      if (!user.branchId) {
        return NextResponse.json({ error: "You are not assigned to a branch. Contact your company owner." }, { status: 403 })
      }
      if (body.branchId !== user.branchId) {
        return NextResponse.json({ error: "Branch Managers can only invite staff to their own branch." }, { status: 403 })
      }
      if (body.role && (body.role === "COMPANY_ADMIN" || body.role === "company_admin")) {
        return NextResponse.json({ error: "Branch Managers cannot invite Company Administrators." }, { status: 403 })
      }
    }

    await ensureEnterprisePlan(user.companyId)

    let normalizedPhone = body.phone
    if (body.phone) {
      const phoneResult = validatePhone(body.phone)
      if (!phoneResult.valid) {
        return NextResponse.json({ error: phoneResult.error }, { status: 400 })
      }
      normalizedPhone = phoneResult.normalized!
    }

    const tempPassword = Math.random().toString(36).slice(-10)
    const hashedPassword = await bcrypt.hash(tempPassword, 12)

    const staff = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        phone: normalizedPhone,
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

    try {
      await sendWelcomeEmail(staff.email, staff.name, tempPassword)
    } catch (emailErr) {
      console.error("[POST /api/staff] Welcome email failed:", emailErr)
    }

    return NextResponse.json({ ...staff, tempPassword })
  } catch (error) {
    if ((error as any)?.code === "P2002") {
      const target = ((error as any)?.meta?.target as string[]) || []
      if (target.includes("email")) {
        return NextResponse.json({
          error: "This email address is already registered.",
          message: "A staff member with this email already exists in the system. Please use a different email address.",
        }, { status: 409 })
      }
    }

    console.error("[POST /api/staff] Failed:", error)
    const realMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      formatApiError("STAFF_CREATION_FAILED", {
        title: "Staff invitation failed",
        message: `We couldn't invite this staff member. ${realMessage}`,
        upgradeRequired: false,
      }),
      { status: 500 }
    )
  }
}
