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

  const payments = await prisma.payment.findMany({
    where: { method: "BANK_TRANSFER", status: "PENDING" },
    include: {
      company: { select: { id: true, name: true } },
      subscription: { include: { plan: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(payments)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = session.user as any

  if (user.role !== "platform_owner" && user.role !== "company_owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { companyId, subscriptionId, amount, proofUrl } = await req.json()

    if (!companyId || !subscriptionId || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const company = await prisma.company.findUnique({ where: { id: companyId } })
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    const subscription = await prisma.subscription.findUnique({ where: { id: subscriptionId } })
    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
    }

    const payment = await prisma.payment.create({
      data: {
        companyId,
        subscriptionId,
        method: "BANK_TRANSFER",
        status: "PENDING",
        amount,
        proofUrl: proofUrl || null,
      },
    })

    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { paymentMethod: "BANK_TRANSFER" },
    })

    return NextResponse.json({ success: true, payment })
  } catch (error) {
    console.error("Bank payment error:", error)
    return NextResponse.json({ error: "Failed to create bank payment" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = session.user as any

  if (user.role !== "platform_owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { paymentId, action, notes } = await req.json()

    if (!paymentId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (action !== "verify" && action !== "reject") {
      return NextResponse.json({ error: "Action must be 'verify' or 'reject'" }, { status: 400 })
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { subscription: true },
    })
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    if (payment.method !== "BANK_TRANSFER") {
      return NextResponse.json({ error: "Payment is not a bank transfer" }, { status: 400 })
    }

    if (payment.status !== "PENDING") {
      return NextResponse.json({ error: "Payment is already processed" }, { status: 400 })
    }

    if (action === "verify") {
      const now = new Date()
      const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: payment.subscription.planId },
      })
      const endDate = plan ? new Date(now.getTime() + plan.durationDays * 86400000) : null

      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: "VERIFIED",
          verifiedById: user.id,
          verifiedAt: now,
          notes: notes || null,
        },
      })

      await prisma.subscription.update({
        where: { id: payment.subscriptionId },
        data: {
          status: "ACTIVE",
          startDate: now,
          endDate,
        },
      })

      await createAuditLog({
        userId: user.id,
        action: "VERIFY_BANK_PAYMENT",
        resource: "Payment",
        details: `Verified bank transfer payment ${paymentId} for company ${payment.companyId}`,
        companyId: payment.companyId,
      })
    } else {
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: "FAILED",
          notes: notes || null,
        },
      })
    }

    const updated = await prisma.payment.findUnique({ where: { id: paymentId } })
    return NextResponse.json({ success: true, payment: updated })
  } catch (error) {
    console.error("Bank payment verification error:", error)
    return NextResponse.json({ error: "Failed to process payment" }, { status: 500 })
  }
}
