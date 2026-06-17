import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = session.user as any
  const companyId = user.companyId
  const userId = user.id
  if (!companyId) return NextResponse.json({ error: "No company" }, { status: 400 })

  const [company, violations, adminMessages, notifications] = await Promise.all([
    prisma.company.findUnique({
      where: { id: companyId },
      select: { isActive: true, name: true },
    }),
    prisma.violationLog.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { createdBy: { select: { name: true } } },
    }),
    prisma.adminMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { createdBy: { select: { name: true } } },
    }),
    prisma.notification.findMany({
      where: { userId, readAt: null },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ])

  return NextResponse.json({
    isActive: company?.isActive ?? true,
    companyName: company?.name ?? "",
    warnings: violations.filter((v) => v.action === "warn"),
    suspensions: violations.filter((v) => v.action === "suspend" || v.action === "reactivate"),
    announcements: adminMessages,
    unreadNotifications: notifications,
  })
}