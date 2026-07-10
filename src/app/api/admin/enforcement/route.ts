import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/log-event"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  if (user.role !== "platform_owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const violations = await prisma.violationLog.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      company: { select: { name: true } },
      createdBy: { select: { name: true } },
    },
  })

    const companies = await prisma.company.findMany({
    where: { status: { not: "DELETED" } },
    select: {
      id: true,
      name: true,
      isActive: true,
      status: true,
      _count: { select: { violationLogs: true } },
    },
    orderBy: { name: "asc" },
  })

  const companyStatuses = companies.map((c) => ({
    id: c.id,
    name: c.name,
    isActive: c.isActive,
    status: c.status,
    violationCount: c._count.violationLogs,
  }))

  return NextResponse.json({ violations, companyStatuses })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  if (user.role !== "platform_owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const { companyId, action, reason } = body

  if (!companyId || !action || !reason) {
    return NextResponse.json({ error: "Missing required fields: companyId, action, reason" }, { status: 400 })
  }

  if (!["suspend", "reactivate", "warn"].includes(action)) {
    return NextResponse.json({ error: "Invalid action. Must be suspend, reactivate, or warn" }, { status: 400 })
  }

  const company = await prisma.company.findUnique({ where: { id: companyId } })
  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 })
  }

  if (action === "suspend") {
    await prisma.company.update({
      where: { id: companyId },
      data: { isActive: false, status: "SUSPENDED" },
    })
  } else if (action === "reactivate") {
    await prisma.company.update({
      where: { id: companyId },
      data: { isActive: true, status: "ACTIVE" },
    })
  }

  const violation = await prisma.violationLog.create({
    data: {
      companyId,
      action,
      reason,
      createdById: user.id,
    },
    include: {
      company: { select: { name: true } },
      createdBy: { select: { name: true } },
    },
  })

  await createAuditLog({
    userId: user.id,
    action: `ENFORCEMENT_${action.toUpperCase()}`,
    resource: "COMPANY",
    details: `${action} company "${company.name}" — ${reason}`,
    companyId,
  })

  const companyUsers = await prisma.user.findMany({
    where: { companyId, status: "ACTIVE" },
    select: { id: true },
  })

  if (companyUsers.length > 0) {
    await prisma.notification.createMany({
      data: companyUsers.map((u) => ({
        userId: u.id,
        companyId,
        title: action === "warn" ? "Warning Received" : action === "suspend" ? "Company Suspended" : "Company Reactivated",
        message: reason,
        type: "ENFORCEMENT",
        link: "/company/dashboard",
      })),
    })
  }

  return NextResponse.json({ violation })
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  if (user.role !== "platform_owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const { violationId } = body

  if (!violationId) {
    return NextResponse.json({ error: "violationId is required" }, { status: 400 })
  }

  const violation = await prisma.violationLog.findUnique({
    where: { id: violationId },
    include: { company: { select: { name: true } } },
  })
  if (!violation) {
    return NextResponse.json({ error: "Violation not found" }, { status: 404 })
  }

  await prisma.violationLog.delete({ where: { id: violationId } })

  await createAuditLog({
    userId: user.id,
    action: "ENFORCEMENT_RESOLVED",
    resource: "COMPANY",
    details: `Resolved ${violation.action} for company "${violation.company.name}" — ${violation.reason}`,
    companyId: violation.companyId,
  })

  const companyUsers = await prisma.user.findMany({
    where: { companyId: violation.companyId, status: "ACTIVE" },
    select: { id: true },
  })

  if (companyUsers.length > 0) {
    await prisma.notification.createMany({
      data: companyUsers.map((u) => ({
        userId: u.id,
        companyId: violation.companyId,
        title: "Warning Resolved",
        message: `The warning has been resolved: ${violation.reason}`,
        type: "ENFORCEMENT",
        link: "/company/dashboard",
      })),
    })
  }

  return NextResponse.json({ success: true })
}
