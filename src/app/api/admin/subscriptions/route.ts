import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/log-event"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const role = (session.user as any).role
  if (role !== "platform_owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const plans = await prisma.subscriptionPlan.findMany({
    include: { _count: { select: { subscriptions: true } } },
    orderBy: { price: "asc" },
  })

  const payments = await prisma.payment.findMany({
    include: {
      company: { select: { name: true } },
      subscription: { include: { plan: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [totalRevenueAgg, thisMonthAgg] = await Promise.all([
    prisma.payment.aggregate({
      where: { status: "VERIFIED" },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { status: "VERIFIED", createdAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
  ])

  const total = totalRevenueAgg._sum.amount ?? 0
  const thisMonth = thisMonthAgg._sum.amount ?? 0

  const activeSubscriptions = await prisma.subscription.findMany({
    where: { status: "ACTIVE" },
    include: { plan: true },
  })
  const mrr = activeSubscriptions.reduce((sum, sub) => {
    const monthlyRate = sub.plan.durationDays > 0 ? (sub.plan.price / sub.plan.durationDays) * 30 : 0
    return sum + monthlyRate
  }, 0)

  return NextResponse.json({
    plans,
    payments: payments.map((p) => ({
      id: p.id,
      company: p.company,
      method: p.method,
      status: p.status,
      amount: p.amount,
      currency: p.currency,
      createdAt: p.createdAt,
      proofUrl: p.proofUrl,
      subscription: { plan: { name: p.subscription.plan.name } },
    })),
    revenue: { total, mrr, thisMonth },
    currencyManagement: await (async () => {
      const exchangeRates = await prisma.exchangeRate.findMany({
        where: { isActive: true },
        include: { company: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
      const byCompany: Record<string, string[]> = {}
      for (const r of exchangeRates) {
        if (!byCompany[r.companyId]) byCompany[r.companyId] = []
        byCompany[r.companyId].push(`${r.fromCurrency}/${r.toCurrency}`)
      }
      return {
        activeCurrencies: exchangeRates.map((r) => ({
          id: r.id,
          pair: `${r.fromCurrency}/${r.toCurrency}`,
          buyRate: r.buyRate,
          sellRate: r.sellRate,
          companyId: r.companyId,
          companyName: r.company?.name || "Unknown",
          isActive: r.isActive,
        })),
        stats: {
          total: exchangeRates.length,
          byCompany,
        },
      }
    })(),
  })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const role = (session.user as any).role
  if (role !== "platform_owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { action, id, name, description, price, currency, durationDays, features, isActive } = body

    if (action === "create") {
      const plan = await prisma.subscriptionPlan.create({
        data: {
          name,
          description,
          price: parseFloat(price),
          currency: currency || "USD",
          durationDays: parseInt(durationDays),
          features: features || [],
        },
      })
      return NextResponse.json({ plan })
    }

    if (action === "update") {
      if (!id) return NextResponse.json({ error: "Plan ID required" }, { status: 400 })
      const plan = await prisma.subscriptionPlan.update({
        where: { id },
        data: {
          name,
          description,
          price: price !== undefined ? parseFloat(price) : undefined,
          currency,
          durationDays: durationDays !== undefined ? parseInt(durationDays) : undefined,
          features,
          isActive,
        },
      })
      return NextResponse.json({ plan })
    }

    if (action === "delete") {
      if (!id) return NextResponse.json({ error: "Plan ID required" }, { status: 400 })
      await prisma.subscriptionPlan.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const role = (session.user as any).role
  if (role !== "platform_owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { action, exchangeRateId, fromCurrency, toCurrency, buyRate, sellRate, companyId } = body

    if (action === "updateExchangeRate") {
      if (!exchangeRateId || !fromCurrency || !toCurrency || buyRate === undefined || sellRate === undefined || !companyId) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
      }

      const exchangeRate = await prisma.exchangeRate.update({
        where: { id: exchangeRateId },
        data: {
          buyRate: parseFloat(buyRate),
          sellRate: parseFloat(sellRate),
          isActive: true,
        },
      })

      await createAuditLog({
        userId: (session.user as any).id,
        action: "UPDATE_EXCHANGE_RATE",
        resource: "CURRENCY_MANAGEMENT",
        details: `Exchange rate updated for ${fromCurrency}/${toCurrency} at company: ${companyId}`,
        companyId: companyId,
      })

      return NextResponse.json({ exchangeRate })
    }

    if (action === "toggleCurrencyStatus") {
      if (!exchangeRateId || !companyId) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
      }

      let exchangeRate = await prisma.exchangeRate.findUnique({
        where: { id: exchangeRateId },
      })

      if (!exchangeRate) {
        return NextResponse.json({ error: "Exchange rate not found" }, { status: 404 })
      }

      exchangeRate = await prisma.exchangeRate.update({
        where: { id: exchangeRateId },
        data: {
          isActive: !exchangeRate.isActive,
        },
      })

      await createAuditLog({
        userId: (session.user as any).id,
        action: exchangeRate.isActive ? "ACTIVATE_CURRENCY" : "DEACTIVATE_CURRENCY",
        resource: "CURRENCY_MANAGEMENT",
        details: `Currency ${exchangeRate.fromCurrency}/${exchangeRate.toCurrency} ${exchangeRate.isActive ? 'activated' : 'deactivated'} for company: ${companyId}`,
        companyId: companyId,
      })

      return NextResponse.json({ exchangeRate })
    }

    if (action === "addCurrency") {
      if (!fromCurrency || !toCurrency || buyRate === undefined || sellRate === undefined || !companyId) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
      }

      const existingRate = await prisma.exchangeRate.findFirst({
        where: {
          fromCurrency,
          toCurrency,
          companyId,
        },
      })

      if (existingRate) {
        return NextResponse.json({ error: "Exchange rate already exists" }, { status: 400 })
      }

      const exchangeRate = await prisma.exchangeRate.create({
        data: {
          fromCurrency,
          toCurrency,
          buyRate: parseFloat(buyRate),
          sellRate: parseFloat(sellRate),
          company: { connect: { id: companyId } },
          createdBy: { connect: { id: (session.user as any).id } },
          isActive: true,
        },
      })

      await createAuditLog({
        userId: (session.user as any).id,
        action: "ADD_CURRENCY",
        resource: "CURRENCY_MANAGEMENT",
        details: `Currency ${fromCurrency}/${toCurrency} added for company: ${companyId}`,
        companyId: companyId,
      })

      return NextResponse.json({ exchangeRate })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
