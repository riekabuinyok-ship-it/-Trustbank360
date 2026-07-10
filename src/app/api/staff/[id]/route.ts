import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { roleHierarchy } from "@/lib/permissions"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any
  const { id } = await params

  const staff = await prisma.user.findFirst({
    where: { id, companyId: user.companyId },
    include: { branch: { select: { id: true, name: true } } },
  })
  if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 })

  return NextResponse.json(staff)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any
  const { id } = await params

  const isSupervisor = user.role === "COMPANY_OWNER" || user.role === "company_owner" ||
    user.role === "COMPANY_ADMIN" || user.role === "company_admin"
  const isBranchManager = user.role === "BRANCH_MANAGER" || user.role === "branch_manager"

  if (!isSupervisor && !isBranchManager) {
    return NextResponse.json({ error: "You do not have sufficient permissions to perform this action." }, { status: 403 })
  }

  try {
    const body = await request.json()

    // Verify staff belongs to same company
    const target = await prisma.user.findFirst({
      where: { id, companyId: user.companyId },
      select: { id: true, branchId: true, role: true },
    })
    if (!target) {
      return NextResponse.json({ error: "Staff member not found in your organization." }, { status: 404 })
    }

    // Cannot modify self
    if (id === user.id) {
      return NextResponse.json({ error: "You cannot modify your own account." }, { status: 403 })
    }

    // Branch Manager restrictions
    if (isBranchManager) {
      if (!user.branchId) {
        return NextResponse.json({ error: "You are not assigned to a branch. Contact your company owner." }, { status: 403 })
      }
      if (target.branchId !== user.branchId) {
        return NextResponse.json({ error: "You can only manage staff within your own branch." }, { status: 403 })
      }
      // Branch Manager cannot modify users with equal or higher role (OWNER, ADMIN, other BRANCH_MANAGER)
      const targetLevel = roleHierarchy[target.role as keyof typeof roleHierarchy] ?? 0
      const bmLevel = roleHierarchy["branch_manager"]
      if (targetLevel >= bmLevel) {
        return NextResponse.json({ error: "You do not have permission to modify this staff member." }, { status: 403 })
      }
    }

    const updateData: any = {}
    const auditDetails: string[] = []

    if (body.role) { updateData.role = body.role; auditDetails.push(`role changed to ${body.role}`) }
    if (body.branchId !== undefined) { updateData.branchId = body.branchId || null; auditDetails.push(`branch changed`) }
    if (body.phone !== undefined) { updateData.phone = body.phone; auditDetails.push(`phone updated`) }
    if (body.email !== undefined) { updateData.email = body.email; auditDetails.push(`email updated`) }
    if (body.name !== undefined) { updateData.name = body.name; auditDetails.push(`name updated`) }
    if (body.position !== undefined) { updateData.position = body.position; auditDetails.push(`position updated`) }
    if (body.status) { updateData.status = body.status; auditDetails.push(`status changed to ${body.status}`) }
    if (body.image !== undefined) { updateData.image = body.image; auditDetails.push(`image updated`) }
    if (body.password) {
      updateData.password = await bcrypt.hash(body.password, 12)
      updateData.mustChangePassword = true
      auditDetails.push(`password reset`)
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields were provided to update." }, { status: 400 })
    }

    await prisma.user.update({
      where: { id },
      data: updateData,
    })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: body.status === "ACTIVE" ? "ACTIVATE_STAFF" : body.status === "SUSPENDED" ? "SUSPEND_STAFF" : body.role ? "CHANGE_STAFF_ROLE" : "UPDATE_STAFF",
        resource: "USER",
        details: auditDetails.join(", "),
        branchId: user.branchId,
        companyId: user.companyId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error?.code === "P2002") return NextResponse.json({ error: "This email address is already in use by another staff member." }, { status: 409 })
    return NextResponse.json({
      error: "Staff update failed",
      message: "An unexpected error occurred while updating the staff member. Please try again.",
    }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any
  const { id } = await params

  const isSupervisor = user.role === "COMPANY_OWNER" || user.role === "company_owner" ||
    user.role === "COMPANY_ADMIN" || user.role === "company_admin"

  if (!isSupervisor) {
    return NextResponse.json({ error: "Only Company Owners and Administrators can delete staff members." }, { status: 403 })
  }

  try {
    const target = await prisma.user.findFirst({
      where: { id, companyId: user.companyId },
      select: { id: true },
    })
    if (!target) {
      return NextResponse.json({ error: "Staff member not found in your organization." }, { status: 404 })
    }
    if (id === user.id) {
      return NextResponse.json({ error: "You cannot delete your own account." }, { status: 403 })
    }

    await prisma.user.update({
      where: { id },
      data: { status: "INACTIVE" },
    })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "DELETE_STAFF",
        resource: "USER",
        details: `Staff member removed (deactivated)`,
        branchId: user.branchId,
        companyId: user.companyId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({
      error: "Staff deletion failed",
      message: "An unexpected error occurred. The staff member may have active records in the system.",
    }, { status: 500 })
  }
}
