import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any
  const { searchParams } = new URL(request.url)

  const where: any = { companyId: user.companyId, isActive: true }
  const publicOnly = searchParams.get("public")
  if (publicOnly === "true") where.isPublic = true
  if (publicOnly === "false") where.isPublic = false

  const rates = await prisma.exchangeRate.findMany({
    where,
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(rates)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  if (user.role !== "COMPANY_OWNER" && user.role !== "company_owner" && user.role !== "COMPANY_ADMIN" && user.role !== "company_admin") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  try {
    const body = await request.json()

    // Deactivate existing rate
    await prisma.exchangeRate.updateMany({
      where: { fromCurrency: body.fromCurrency, toCurrency: body.toCurrency, companyId: user.companyId },
      data: { isActive: false },
    })

    const rate = await prisma.exchangeRate.create({
      data: {
        fromCurrency: body.fromCurrency,
        toCurrency: body.toCurrency,
        buyRate: body.buyRate,
        sellRate: body.sellRate,
        companyId: user.companyId,
        createdById: user.id,
        isPublic: body.isPublic !== undefined ? body.isPublic : true,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "EXCHANGE_RATE_UPDATED",
        resource: "ExchangeRate",
        details: `Rate updated: ${body.fromCurrency}→${body.toCurrency} Buy:${body.buyRate} Sell:${body.sellRate}`,
        companyId: user.companyId,
      },
    })

    return NextResponse.json(rate)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create rate" }, { status: 500 })
  }
}
