import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { checkPlanLimit, PlanEnforcementError } from "@/lib/plan-enforcement"
import { getPlanByName, getAllowedCurrencies } from "@/lib/plan-config"

function getTimeRanges() {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(startOfDay)
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  return { now, startOfDay, startOfWeek, startOfMonth }
}

function computeFlow(transfers: { amount: number; commission: number; status?: string; createdAt: Date }[]) {
  const active = transfers.filter((t) => t.status !== "CANCELLED" && t.status !== "REVERSED")
  const { startOfDay, startOfWeek, startOfMonth } = getTimeRanges()
  const byRange = (from: Date) => {
    const filtered = active.filter((t) => t.createdAt >= from)
    return {
      amount: filtered.reduce((s, t) => s + t.amount, 0),
      commission: filtered.reduce((s, t) => s + t.commission, 0),
    }
  }
  return {
    today: byRange(startOfDay),
    week: byRange(startOfWeek),
    month: byRange(startOfMonth),
    all: {
      amount: active.reduce((s, t) => s + t.amount, 0),
      commission: active.reduce((s, t) => s + t.commission, 0),
    },
  }
}

function buildPerCurrencyData(allTransfers: any[], planCurrencies: string[], walletMap: Record<string, number>) {
  const byCurrency: Record<string, any> = {}
  for (const currency of planCurrencies) {
    const currTransfers = allTransfers.filter((t) => t.currency === currency)
    const activeTransfers = currTransfers.filter((t: any) => t.status !== "CANCELLED" && t.status !== "REVERSED")
    const currCount = activeTransfers.length
    const flow = computeFlow(currTransfers)
    const statusCounts: Record<string, number> = { PENDING: 0, COMPLETED: 0, CANCELLED: 0, REVERSED: 0 }
    for (const t of currTransfers) {
      if (statusCounts[t.status] !== undefined) statusCounts[t.status]++
    }

    // Take top 10 recent transactions for this currency
    const recent = [...currTransfers]
      .sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10)
      .map((t: any) => ({
        id: t.id,
        transactionNumber: t.transactionNumber,
        amount: t.amount,
        currency: t.currency,
        commission: t.commission,
        status: t.status,
        createdAt: t.createdAt,
        issuedBy: t.issuedBy,
        sender: t.sender,
        receiver: t.receiver,
      }))

    byCurrency[currency] = {
      count: currCount,
      volume: flow.all.amount,
      commission: flow.all.commission,
      balance: walletMap[currency] || 0,
      moneyFlow: {
        today: flow.today.amount,
        week: flow.week.amount,
        month: flow.month.amount,
        all: flow.all.amount,
      },
      commissionFlow: {
        today: flow.today.commission,
        week: flow.week.commission,
        month: flow.month.commission,
        all: flow.all.commission,
      },
      counts: {
        total: currTransfers.length,
        completed: statusCounts.COMPLETED,
        pending: statusCounts.PENDING,
        cancelled: statusCounts.CANCELLED,
        reversed: statusCounts.REVERSED,
      },
      recentTransactions: recent,
    }
  }
  return byCurrency
}

async function getBasicDashboard(user: any, whereBase: any, isOperational: boolean) {
  const [customerCount, walletGroup, allTransfers] = await Promise.all([
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
    }),
  ])

  const walletMap: Record<string, number> = {}
  for (const w of walletGroup) walletMap[w.currency] = w._sum.balance || 0

  const flow = computeFlow(allTransfers)
  const statusCounts: Record<string, number> = { PENDING: 0, COMPLETED: 0, CANCELLED: 0, REVERSED: 0 }
  for (const t of allTransfers) {
    if (statusCounts[t.status] !== undefined) statusCounts[t.status]++
  }
  const activeCount = allTransfers.filter((t) => t.status !== "CANCELLED" && t.status !== "REVERSED").length
  const totalAll = allTransfers.length

  const companyCurrencies = ["SSP"]
  const walletKeys = Object.keys(walletMap)
  const planCurrencies = walletKeys.length > 0 ? walletKeys : ["SSP"]
  const byCurrency = buildPerCurrencyData(allTransfers, planCurrencies, walletMap)

  // Top 10 most recent overall
  const recentTransactions = allTransfers.slice(0, 10)

  return NextResponse.json({
    basic: true,
    totalBalance: walletGroup.reduce((s, w) => s + (w._sum.balance || 0), 0),
    transferCount: totalAll,
    customerCount,
    walletBalances: walletGroup.map(w => ({ currency: w.currency, balance: w._sum.balance || 0 })),
    recentTransactions,
    counts: { total: totalAll, ...statusCounts },
    moneyFlow: {
      today: flow.today.amount,
      week: flow.week.amount,
      month: flow.month.amount,
      all: flow.all.amount,
    },
    commissionFlow: {
      today: flow.today.commission,
      week: flow.week.commission,
      month: flow.month.commission,
      all: flow.all.commission,
    },
    byCurrency,
    companyCurrencies: planCurrencies,
    topBranches: [],
    dailyVolume: [],
    insights: {
      topBranch: null,
      topTeller: null,
      avgTransactionSize: totalAll > 0 ? flow.all.amount / totalAll : 0,
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

    // Fetch all transfers once — compute aggregates in memory
    const allTransfers = await prisma.transfer.findMany({
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
    })

    const allFlow = computeFlow(allTransfers)
    const today = allFlow.today
    const week = allFlow.week
    const month = allFlow.month
    const allTime = allFlow.all

    const countsMap: Record<string, number> = { PENDING: 0, COMPLETED: 0, CANCELLED: 0, REVERSED: 0 }
    let totalAll = 0
    for (const t of allTransfers) {
      if (countsMap[t.status] !== undefined) countsMap[t.status]++
      totalAll++
    }

    const recentTransactions = allTransfers.slice(0, 10)

    const walletGroup = await prisma.wallet.groupBy({
      by: ["currency"],
      where: { companyId: user.companyId },
      _sum: { balance: true },
    })
    const walletMap: Record<string, number> = {}
    for (const w of walletGroup) walletMap[w.currency] = w._sum.balance || 0

    const byCurrency = buildPerCurrencyData(allTransfers, planCurrencies, walletMap)

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

    const avgTransactionSize = totalAll > 0 ? allTime.amount / totalAll : 0

    return NextResponse.json({
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
      counts: {
        total: totalAll,
        completed: countsMap["COMPLETED"] || 0,
        pending: countsMap["PENDING"] || 0,
        cancelled: countsMap["CANCELLED"] || 0,
        reversed: countsMap["REVERSED"] || 0,
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
