import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = session.user as any
  if (user.role !== "platform_owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      totalCompanies,
      activeCompanies,
      suspendedCompanies,
      newThisMonth,
    ] = await Promise.all([
      prisma.company.count(),
      prisma.company.count({ where: { isActive: true } }),
      prisma.company.count({ where: { isActive: false } }),
      prisma.company.count({ where: { createdAt: { gte: startOfMonth } } }),
    ])

    const recentActivity = await prisma.auditLog.findMany({
      where: {
        resource: { in: ["COMPANY", "USER", "SUBSCRIPTION", "SETTINGS"] },
      },
      include: {
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    })

    const revenueAgg = await prisma.transfer.aggregate({
      where: { status: "COMPLETED" },
      _sum: { commission: true },
    })

    const totalRevenue = revenueAgg._sum.commission || 0

    return NextResponse.json({
      totalCompanies,
      activeCompanies,
      suspendedCompanies,
      deletedCompanies: 0,
      newThisMonth,
      totalRevenue,
      mrr: 0,
      recentActivity: recentActivity.map((log) => ({
        id: log.id,
        action: log.action,
        targetCompany: log.details || log.resource,
        timestamp: log.createdAt.toISOString(),
        actor: log.user?.name || "System",
      })),
      systemHealth: "healthy",
    })
  } catch (error) {
    console.error("Admin analytics error:", error)
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 })
  }
}
