import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

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

  if (user.role !== "COMPANY_OWNER" && user.role !== "company_owner" && user.role !== "COMPANY_ADMIN" && user.role !== "company_admin") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  try {
    const body = await request.json()

    const updateData: any = {}
    const auditDetails: string[] = []

    if (body.role) { updateData.role = body.role; auditDetails.push(`role changed to ${body.role}`) }
    if (body.branchId !== undefined) { updateData.branchId = body.branchId || null; auditDetails.push(`branch changed`) }
    if (body.phone !== undefined) { updateData.phone = body.phone; auditDetails.push(`phone updated`) }
    if (body.email !== undefined) { updateData.email = body.email; auditDetails.push(`email updated`) }
    if (body.name !== undefined) { updateData.name = body.name; auditDetails.push(`name updated`) }
    if (body.position !== undefined) { updateData.position = body.position; auditDetails.push(`position updated`) }
    if (body.status) { updateData.status = body.status; auditDetails.push(`status changed to ${body.status}`) }
    if (body.password) {
      updateData.password = await bcrypt.hash(body.password, 12)
      auditDetails.push(`password reset`)
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
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
    if (error?.code === "P2002") return NextResponse.json({ error: "Email already in use" }, { status: 409 })
    return NextResponse.json({ error: "Failed to update staff" }, { status: 500 })
  }
}
