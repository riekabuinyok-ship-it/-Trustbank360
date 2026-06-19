import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any
  const { id } = await params

  const rate = await prisma.exchangeRate.findFirst({
    where: { id, companyId: user.companyId },
  })
  if (!rate) return NextResponse.json({ error: "Exchange rate not found" }, { status: 404 })

  return NextResponse.json(rate)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any
  const { id } = await params

  if (user.role !== "COMPANY_OWNER" && user.role !== "company_owner" && user.role !== "COMPANY_ADMIN" && user.role !== "company_admin") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  const existing = await prisma.exchangeRate.findFirst({
    where: { id, companyId: user.companyId },
  })
  if (!existing) return NextResponse.json({ error: "Exchange rate not found" }, { status: 404 })

  try {
    const body = await request.json()
    const rate = await prisma.exchangeRate.update({
      where: { id },
      data: {
        buyRate: body.buyRate !== undefined ? body.buyRate : undefined,
        sellRate: body.sellRate !== undefined ? body.sellRate : undefined,
        isActive: body.isActive !== undefined ? body.isActive : undefined,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: body.isActive === false ? "DEACTIVATE_EXCHANGE_RATE" : body.isActive === true ? "ACTIVATE_EXCHANGE_RATE" : "UPDATE_EXCHANGE_RATE",
        resource: "ExchangeRate",
        details: `Rate ${rate.fromCurrency}→${rate.toCurrency} updated`,
        companyId: user.companyId,
      },
    })

    return NextResponse.json(rate)
  } catch {
    return NextResponse.json({ error: "Unable to update exchange rate. Please try again." }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any
  const { id } = await params

  if (user.role !== "COMPANY_OWNER" && user.role !== "company_owner") {
    return NextResponse.json({ error: "Only the company owner can delete exchange rates" }, { status: 403 })
  }

  const rate = await prisma.exchangeRate.findFirst({
    where: { id, companyId: user.companyId },
  })
  if (!rate) return NextResponse.json({ error: "Exchange rate not found" }, { status: 404 })

  try {
    await prisma.exchangeRate.delete({ where: { id } })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "DELETE_EXCHANGE_RATE",
        resource: "ExchangeRate",
        details: `Rate ${rate.fromCurrency}→${rate.toCurrency} deleted`,
        companyId: user.companyId,
      },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Unable to delete exchange rate. Please try again." }, { status: 500 })
  }
}
