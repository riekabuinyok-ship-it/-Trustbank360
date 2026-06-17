import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/log-event"

async function checkAuth() {
  const session = await getServerSession(authOptions)
  if (!session) return { error: "Unauthorized", status: 401 }
  const user = session.user as any
  if (user.role !== "platform_owner") {
    return { error: "Forbidden", status: 403 }
  }
  return { user }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAuth()
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      _count: { select: { users: true, branches: true } },
      users: {
        where: { role: { in: ["COMPANY_OWNER", "company_owner"] } },
        select: { id: true, name: true, email: true, role: true },
        take: 1,
      },
      auditLogs: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { user: { select: { name: true } } },
      },
    },
  })

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 })
  }

  return NextResponse.json(company)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAuth()
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const user = auth.user
  const { id } = await params

  try {
    const body = await request.json()
    const { action } = body

    const company = await prisma.company.findUnique({ where: { id } })
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    let data: any = {}
    let auditAction = ""
    let auditDetails = ""

    switch (action) {
      case "activate":
        data = { isActive: true }
        auditAction = "ACTIVATE_COMPANY"
        auditDetails = `Company ${company.name} activated`
        break
      case "suspend":
        data = { isActive: false }
        auditAction = "SUSPEND_COMPANY"
        auditDetails = `Company ${company.name} suspended`
        break
      case "deactivate":
        data = { isActive: false }
        auditAction = "DEACTIVATE_COMPANY"
        auditDetails = `Company ${company.name} deactivated`
        break
      case "delete":
        data = { isActive: false }
        auditAction = "DELETE_COMPANY"
        auditDetails = `Company ${company.name} deleted`
        break
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const updated = await prisma.company.update({
      where: { id },
      data,
    })

    await createAuditLog({
      userId: user.id,
      action: auditAction,
      resource: "COMPANY",
      details: auditDetails,
      companyId: id,
    })

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update company" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAuth()
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const user = auth.user
  const { id } = await params

  const company = await prisma.company.findUnique({
    where: { id },
    include: { _count: { select: { transfers: true } } },
  })

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 })
  }

  if (company._count.transfers > 0) {
    return NextResponse.json({ error: "Cannot delete company with active transactions" }, { status: 409 })
  }

  await prisma.company.update({
    where: { id },
    data: { isActive: false },
  })

  await createAuditLog({
    userId: user.id,
    action: "DELETE_COMPANY",
    resource: "COMPANY",
    details: `Company ${company.name} soft deleted`,
    companyId: id,
  })

  return NextResponse.json({ success: true })
}
