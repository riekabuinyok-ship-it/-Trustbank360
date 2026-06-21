import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { checkPlanLimit, PlanEnforcementError } from "@/lib/plan-enforcement"
import { getPlanByName, getAllowedCurrencies } from "@/lib/plan-config"

async function getBasicDashboard(user: any, whereBase: any, isOperational: boolean) {
  const [transferCount, statusCounts, customerCount, walletGroup, recentTransfers] = await Promise.all([
    prisma.transfer.count({ where: whereBase }),
    prisma.transfer.groupBy({
      by: ["status"],
      where: whereBase,
      _count: true,
    }),
    prisma.customer.count({ where: { companyId: user.companyId } }),
    prisma.wallet.groupBy({
      by: ["currency"],
      where: { companyId: user.companyId },
      _sum: { balance: true },
    }),
    prisma.transfer.findMany({
      where: whereBase,
      select: {
        id: true, transactionNumber: true, amount: true, currency: true,
        status: true, createdAt: true,
        commission: true,
        issuedBy: { select: { name: true } },
        sender: { select: { fullName: true } },
        receiver: { select: { fullName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ])

  const totalBalance = walletGroup.reduce((s, w) => s + (w._sum.balance || 0), 0)

  const countsMap: Record<string, number> = { PENDING: 0, COMPLETED: 0, CANCELLED: 0 }
  let totalAll = 0
  for (const s of statusCounts) {
    countsMap[s.status] = s._count
    totalAll += s._count
  }

  // Simple money flow — all statuses
  const allTransfers = await prisma.transfer.findMany({
    where: whereBase,
    select: { amount: true, commission: true, createdAt: true },
  })

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(startOfDay)
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const sumByRange = (from: Date) => {
    const filtered = allTransfers.filter((t) => t.createdAt >= from)
    return {
      amount: filtered.reduce((s, t) => s + t.amount, 0),
      commission: filtered.reduce((s, t) => s + t.commission, 0),
    }
  }

  const today = sumByRange(startOfDay)
  const week = sumByRange(startOfWeek)
  const month = sumByRange(startOfMonth)
  const allTime = {
    amount: allTransfers.reduce((s, t) => s + t.amount, 0),
    commission: allTransfers.reduce((s, t) => s + t.commission, 0),
  }

  return NextResponse.json({
    basic: true,
    totalBalance,
    transferCount: totalAll,
    customerCount,
    walletBalances: walletGroup.map(w => ({ currency: w.currency, balance: w._sum.balance || 0 })),
    recentTransactions: recentTransfers,
    counts: countsMap,
    moneyFlow: {
      today: today.amount,
      week: week.amount,
      month: month.amount,
      all: allTime.amount,
    },
    commissionFlow: {
      today: today.commission,
      week: week.commission,
      month: month.commission,
      all: allTime.commission,
    },
    byCurrency: { SSP: { count: totalAll, volume: allTime.amount, commission: allTime.commission, balance: totalBalance } },
    companyCurrencies: ["SSP"],
    topBranches: [],
    dailyVolume: [],
    insights: {
      topBranch: null,
      topTeller: null,
      avgTransactionSize: totalAll > 0 ? allTime.amount / totalAll : 0,
      branchRanking: [],
      tellerRanking: [],
      activeBranches: 0,
    },
  })
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = session.user as any
  const isSupervisory = user.role === "COMPANY_OWNER" || user.role === "company_owner" || user.role === "COMPANY_ADMIN" || user.role === "company_admin"
  const isOperational = user.role === "BRANCH_MANAGER" || user.role === "branch_manager" || user.role === "TELLER" || user.role === "teller"

  try {
    // Gate advanced analytics behind plan check
    try {
      await checkPlanLimit({ companyId: user.companyId, feature: "advancedAnalytics" })
    } catch (err) {
      if (err instanceof PlanEnforcementError) {
        return getBasicDashboard(user, { companyId: user.companyId }, isOperational)
      }
      throw err
    }

    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(startOfDay)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    let whereBase: any = { companyId: user.companyId }

    if (isOperational && user.branchId) {
      whereBase.branchLink = {
        OR: [
          { senderBranchId: user.branchId },
          { receiverBranchId: user.branchId },
        ],
      }
    }

    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: { mainCurrency: true, additionalCurrencies: true },
    })
    const companyCurrencies = company
      ? [company.mainCurrency, ...company.additionalCurrencies]
      : ["SSP"]

    // Filter currencies by plan
    let planCurrencies = companyCurrencies
    try {
      const sub = await prisma.subscription.findUnique({
        where: { companyId: user.companyId },
        select: { plan: { select: { name: true } } },
      })
      if (sub) {
        const allowed = getAllowedCurrencies(sub.plan.name)
        planCurrencies = companyCurrencies.filter((c) => allowed.includes(c))
      }
    } catch {
      // fall back to company currencies
    }

    const aggregate = async (where: any) => {
      const [totals, commissions] = await Promise.all([
        prisma.transfer.aggregate({
          where,
          _sum: { amount: true },
          _count: true,
        }),
        prisma.transfer.aggregate({
          where,
          _sum: { commission: true },
        }),
      ])
      return {
        totalAmount: totals._sum.amount || 0,
        totalCommission: commissions._sum.commission || 0,
        count: totals._count,
      }
    }

    const [today, week, month, allTime] = await Promise.all([
      aggregate({ ...whereBase, createdAt: { gte: startOfDay } }),
      aggregate({ ...whereBase, createdAt: { gte: startOfWeek } }),
      aggregate({ ...whereBase, createdAt: { gte: startOfMonth } }),
      aggregate(whereBase),
    ])

    const statusCounts = await prisma.transfer.groupBy({
      by: ["status"],
      where: whereBase,
      _count: true,
    })
    const countsMap: Record<string, number> = {}
    let totalAll = 0
    for (const s of statusCounts) {
      countsMap[s.status] = s._count
      totalAll += s._count
    }

    const currencyGroup = await prisma.transfer.groupBy({
      by: ["currency"],
      where: whereBase,
      _sum: { amount: true, commission: true },
      _count: true,
    })

    const walletGroup = await prisma.wallet.groupBy({
      by: ["currency"],
      where: { companyId: user.companyId },
      _sum: { balance: true },
    })
    const walletMap: Record<string, number> = {}
    for (const w of walletGroup) {
      walletMap[w.currency] = w._sum.balance || 0
    }

    const byCurrency: Record<string, any> = {}
    for (const currency of planCurrencies) {
      const found = currencyGroup.find((c) => c.currency === currency)
      byCurrency[currency] = {
        count: found?._count || 0,
        volume: found?._sum.amount || 0,
        commission: found?._sum.commission || 0,
        balance: walletMap[currency] || 0,
      }
    }

    const branchBalances = await prisma.wallet.findMany({
      where: { companyId: user.companyId, balance: { gt: 0 } },
      select: { currency: true, balance: true },
      orderBy: { balance: "desc" },
    })

    const branchStats = await prisma.branch.findMany({
      where: { companyId: user.companyId, isActive: true },
      select: {
        id: true,
        name: true,
        transfersFrom: {
          where: { transfer: { status: "COMPLETED" } },
          select: { transfer: { select: { amount: true, commission: true } } },
        },
      },
    })

    const topBranches = branchStats
      .map((b) => {
        const volume = b.transfersFrom.reduce((s, t) => s + t.transfer.amount, 0)
        const commission = b.transfersFrom.reduce((s, t) => s + t.transfer.commission, 0)
        return { id: b.id, name: b.name, count: b.transfersFrom.length, volume, commission }
      })
      .sort((a, b) => b.volume - a.volume)

    const dailyTransfers = await prisma.transfer.findMany({
      where: { ...whereBase, status: "COMPLETED", createdAt: { gte: startOfMonth } },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    })

    const dailyVolumeMap = new Map<string, number>()
    for (const t of dailyTransfers) {
      const key = t.createdAt.toISOString().slice(0, 10)
      dailyVolumeMap.set(key, (dailyVolumeMap.get(key) || 0) + t.amount)
    }
    const dailyVolume = Array.from(dailyVolumeMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const recentTransactions = await prisma.transfer.findMany({
      where: { ...whereBase },
      select: {
        id: true,
        transactionNumber: true,
        amount: true,
        currency: true,
        commission: true,
        status: true,
        createdAt: true,
        issuedBy: { select: { name: true } },
        sender: { select: { fullName: true } },
        receiver: { select: { fullName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    })

    const branchInsights = branchStats
      .map((b) => {
        const total = b.transfersFrom.reduce((s, t) => s + t.transfer.amount, 0)
        const comm = b.transfersFrom.reduce((s, t) => s + t.transfer.commission, 0)
        const count = b.transfersFrom.length
        return { id: b.id, name: b.name, totalAmount: total, totalCommission: comm, count }
      })
      .sort((a, b) => b.totalCommission - a.totalCommission)

    const tellerStats = await prisma.user.findMany({
      where: { companyId: user.companyId, status: "ACTIVE", role: { in: ["BRANCH_MANAGER", "branch_manager", "TELLER", "teller"] } },
      select: {
        id: true,
        name: true,
        issuedTransfers: {
          where: { status: "COMPLETED" },
          select: { amount: true, commission: true },
        },
      },
    })

    const tellerInsights = tellerStats
      .map((u) => {
        const total = u.issuedTransfers.reduce((s, t) => s + t.amount, 0)
        const comm = u.issuedTransfers.reduce((s, t) => s + t.commission, 0)
        const count = u.issuedTransfers.length
        return { id: u.id, name: u.name, totalAmount: total, totalCommission: comm, count }
      })
      .sort((a, b) => b.totalCommission - a.totalCommission)

    const avgTransactionSize = allTime.count > 0 ? allTime.totalAmount / allTime.count : 0

    return NextResponse.json({
      moneyFlow: {
        today: today.totalAmount,
        week: week.totalAmount,
        month: month.totalAmount,
        all: allTime.totalAmount,
      },
      commissionFlow: {
        today: today.totalCommission,
        week: week.totalCommission,
        month: month.totalCommission,
        all: allTime.totalCommission,
      },
      counts: {
        total: totalAll,
        completed: countsMap["COMPLETED"] || 0,
        pending: countsMap["PENDING"] || 0,
        cancelled: countsMap["CANCELLED"] || 0,
      },
      byCurrency,
      companyCurrencies: planCurrencies,
      branchBalances,
      topBranches,
      dailyVolume,
      recentTransactions,
      insights: {
        topBranch: branchInsights[0] || null,
        topTeller: tellerInsights[0] || null,
        avgTransactionSize,
        branchRanking: branchInsights,
        tellerRanking: tellerInsights,
        activeBranches: branchInsights.length,
      },
    })
  } catch (error) {
    console.error("Dashboard error:", error)
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 })
  }
}
