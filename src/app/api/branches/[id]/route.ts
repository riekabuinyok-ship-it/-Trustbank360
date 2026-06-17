import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any
  const { id } = await params

  const branch = await prisma.branch.findFirst({
    where: { id, companyId: user.companyId },
    include: { _count: { select: { users: true, wallets: true } } },
  })
  if (!branch) return NextResponse.json({ error: "Branch not found" }, { status: 404 })

  return NextResponse.json(branch)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any
  const { id } = await params

  if (user.role !== "COMPANY_OWNER" && user.role !== "company_owner" && user.role !== "COMPANY_ADMIN" && user.role !== "company_admin") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  const existing = await prisma.branch.findFirst({
    where: { id, companyId: user.companyId },
  })
  if (!existing) return NextResponse.json({ error: "Branch not found" }, { status: 404 })

  try {
    const body = await request.json()
    const branch = await prisma.branch.update({
      where: { id },
      data: {
        name: body.name,
        country: body.country,
        state: body.state,
        city: body.city,
        address: body.address,
        contactPhone: body.contactPhone,
        contactEmail: body.contactEmail,
        managerId: body.managerId !== undefined ? body.managerId || null : undefined,
        isActive: body.isActive !== undefined ? body.isActive : undefined,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: body.isActive === false ? "SUSPEND_BRANCH" : body.isActive === true ? "ACTIVATE_BRANCH" : "UPDATE_BRANCH",
        resource: "BRANCH",
        details: `Branch ${branch.name} updated`,
        branchId: branch.id,
        companyId: user.companyId,
      },
    })

    return NextResponse.json(branch)
  } catch {
    return NextResponse.json({ error: "Failed to update branch" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any
  const { id } = await params

  if (user.role !== "COMPANY_OWNER" && user.role !== "company_owner") {
    return NextResponse.json({ error: "Only the company owner can delete branches" }, { status: 403 })
  }

  const branch = await prisma.branch.findFirst({
    where: { id, companyId: user.companyId },
    include: { _count: { select: { users: true } } },
  })
  if (!branch) return NextResponse.json({ error: "Branch not found" }, { status: 404 })
  if (branch._count.users > 0) {
    return NextResponse.json({ error: "Cannot delete a branch that has staff assigned" }, { status: 400 })
  }

  try {
    await prisma.wallet.deleteMany({ where: { branchId: id } })
    await prisma.branch.delete({ where: { id } })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "DELETE_BRANCH",
        resource: "BRANCH",
        details: `Branch ${branch.name} deleted`,
        companyId: user.companyId,
      },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete branch" }, { status: 500 })
  }
}
