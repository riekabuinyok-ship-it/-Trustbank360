import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any
  if (user.role !== "platform_owner") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      totalCompanies,
      activeCompanies,
      suspendedCompanies,
      trialCompanies,
      deletedCompanies,
      newThisMonth,
      totalUsers,
      activeUsers,
      subRevenueAgg,
      transferCommissionAgg,
      activeSubscriptions,
      monthlyData,
    ] = await Promise.all([
      prisma.company.count(),
      prisma.company.count({ where: { isActive: true } }),
      prisma.company.count({ where: { isActive: false, status: { not: "DELETED" } } }),
      prisma.subscription.count({ where: { status: "TRIALING" } }),
      prisma.company.count({ where: { status: "DELETED" } }),
      prisma.company.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.user.count(),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.payment.aggregate({
        where: { status: "VERIFIED" },
        _sum: { amount: true },
      }),
      prisma.transfer.aggregate({
        where: { status: "COMPLETED" },
        _sum: { commission: true },
      }),
      prisma.subscription.findMany({
        where: { status: "ACTIVE" },
        include: { plan: true },
      }),
      Promise.all(
        Array.from({ length: 12 }, (_, i) => {
          const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
          return Promise.all([
            prisma.payment.aggregate({
              where: { status: "VERIFIED", createdAt: { gte: monthStart, lt: monthEnd } },
              _sum: { amount: true },
            }),
            prisma.company.count({
              where: { createdAt: { gte: monthStart, lt: monthEnd } },
            }),
          ]).then(([pay, comp]) => ({
            month: monthStart.toLocaleString("default", { month: "short", year: "numeric" }),
            revenue: pay._sum.amount || 0,
            companies: comp,
          }))
        })
      ),
    ])

    const subscriptionRevenue = subRevenueAgg._sum.amount || 0
    const commissionRevenue = transferCommissionAgg._sum.commission || 0
    const totalRevenue = subscriptionRevenue + commissionRevenue

    const mrr = activeSubscriptions.reduce((sum, sub) => {
      const monthlyRate = sub.plan.durationDays > 0
        ? (sub.plan.price / sub.plan.durationDays) * 30
        : 0
      return sum + monthlyRate
    }, 0)

    const recentActivity = await prisma.auditLog.findMany({
      where: { resource: { in: ["COMPANY", "USER", "SUBSCRIPTION", "SETTINGS"] } },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    })

    return NextResponse.json({
      totalCompanies,
      activeCompanies,
      suspendedCompanies,
      trialCompanies,
      deletedCompanies,
      newThisMonth,
      totalRevenue,
      subscriptionRevenue,
      commissionRevenue,
      mrr,
      totalUsers,
      activeUsers,
      monthlyRevenue: monthlyData.reverse(),
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
