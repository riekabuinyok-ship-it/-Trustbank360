import { NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const signature = req.headers.get("stripe-signature")

    if (!signature) {
      return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
    }

    const event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any
        const companyId = session.metadata.companyId
        const planId = session.metadata.planId

        if (!companyId || !planId) {
          return NextResponse.json({ error: "Missing metadata" }, { status: 400 })
        }

        const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } })
        if (!plan) {
          return NextResponse.json({ error: "Plan not found" }, { status: 404 })
        }

        const now = new Date()
        const endDate = new Date(now.getTime() + plan.durationDays * 86400000)

        const subRecord = await prisma.subscription.upsert({
          where: { companyId },
          update: {
            planId,
            status: "ACTIVE",
            stripeSubscriptionId: session.subscription,
            stripeSessionId: session.id,
            startDate: now,
            endDate,
          },
          create: {
            companyId,
            planId,
            status: "ACTIVE",
            stripeSubscriptionId: session.subscription,
            stripeSessionId: session.id,
            startDate: now,
            endDate,
          },
        })

        await prisma.payment.create({
          data: {
            companyId,
            subscriptionId: subRecord.id,
            method: "STRIPE",
            status: "VERIFIED",
            amount: session.amount_total ? session.amount_total / 100 : 0,
            transactionId: session.payment_intent,
            stripeSessionId: session.id,
            stripePaymentIntentId: session.payment_intent,
            verifiedAt: now,
          },
        })

        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any
        const stripeSubscriptionId = invoice.subscription

        const subscription = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId },
        })
        if (!subscription) {
          return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
        }

        await prisma.payment.create({
          data: {
            companyId: subscription.companyId,
            subscriptionId: subscription.id,
            method: "STRIPE",
            status: "FAILED",
            amount: invoice.amount_due ? invoice.amount_due / 100 : 0,
            transactionId: invoice.id,
          },
        })

        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Stripe webhook error:", error)
    return NextResponse.json({ error: "Webhook error" }, { status: 500 })
  }
}
