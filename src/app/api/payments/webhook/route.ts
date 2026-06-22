import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

const processedEventIds = new Set<string>()

function log(level: "INFO" | "WARN" | "ERROR", message: string, data?: any) {
  const timestamp = new Date().toISOString()
  if (data) {
    console.log(`[WEBHOOK ${timestamp}] [${level}] ${message}`, JSON.stringify(data))
  } else {
    console.log(`[WEBHOOK ${timestamp}] [${level}] ${message}`)
  }
}

let stripeInstance: any = null
function getStripeInstance() {
  if (!stripeInstance) {
    const Stripe = require("stripe")
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!)
  }
  return stripeInstance
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Stripe webhook endpoint",
    required_events: [
      "checkout.session.completed",
      "customer.subscription.created",
      "customer.subscription.updated",
      "customer.subscription.deleted",
      "invoice.paid",
      "invoice.payment_failed",
    ],
  })
}

export async function POST(req: Request) {
  const requestId = crypto.randomUUID().slice(0, 8)

  try {
    const chunks: Uint8Array[] = []
    const reader = req.body?.getReader()
    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
      }
    }
    const rawBody = Buffer.concat(chunks)

    const signature = req.headers.get("stripe-signature")
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 })
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
    }

    let event: any
    try {
      event = getStripeInstance().webhooks.constructEvent(rawBody, signature, webhookSecret)
      log("INFO", `[${requestId}] Verified: ${event.type}`, { id: event.id })
    } catch (sigErr: any) {
      log("ERROR", `[${requestId}] Signature failed`, { message: sigErr.message })
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    if (processedEventIds.has(event.id)) {
      return NextResponse.json({ received: true, idempotent: true })
    }

    const eventData = event.data.object as any

    switch (event.type) {
      case "checkout.session.completed": {
        log("INFO", `[${requestId}] Processing checkout.session.completed`)
        const companyId = eventData.metadata?.companyId
        const planId = eventData.metadata?.planId

        if (!companyId || !planId) {
          log("ERROR", `[${requestId}] Missing metadata`)
          return NextResponse.json({ error: "Missing metadata" }, { status: 400 })
        }

        if (eventData.payment_status !== "paid") {
          log("INFO", `[${requestId}] Payment not yet paid, status: ${eventData.payment_status}`)
          return NextResponse.json({ received: true, pending: true })
        }

        const now = new Date()
        const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } })
        const trialEndsAt = plan ? new Date(now.getTime() + plan.trialDays * 86400000) : null

        const previousSub = await prisma.subscription.findUnique({
          where: { companyId },
          select: { plan: { select: { name: true } } },
        })

        await prisma.subscription.upsert({
          where: { companyId },
          update: {
            planId,
            status: "TRIALING",
            stripeSessionId: eventData.id,
            stripeSubscriptionId: eventData.subscription,
            startDate: now,
            trialEndsAt,
            endDate: trialEndsAt,
          },
          create: {
            companyId,
            planId,
            status: "TRIALING",
            stripeCustomerId: eventData.customer,
            stripeSubscriptionId: eventData.subscription,
            stripeSessionId: eventData.id,
            startDate: now,
            trialEndsAt,
            endDate: trialEndsAt,
          },
        })

        if (plan && previousSub?.plan?.name !== plan.name) {
          try {
            await prisma.planAuditLog.create({
              data: {
                companyId,
                fromPlan: previousSub?.plan?.name ?? "None",
                toPlan: plan.name,
                reason: "Stripe checkout.session.completed",
                triggeredBy: null,
              },
            })
          } catch (auditErr) {
            log("WARN", `[${requestId}] Failed to write plan audit log: ${auditErr instanceof Error ? auditErr.message : String(auditErr)}`)
          }
        }

        const { ensureEnterprisePlan } = await import("@/lib/migrate-to-enterprise")
        await ensureEnterprisePlan(companyId)

        if (eventData.amount_total) {
          const subRecord = await prisma.subscription.findFirst({
            where: { stripeSubscriptionId: eventData.subscription },
          })

          await prisma.payment.create({
            data: {
              companyId,
              subscriptionId: subRecord?.id || "pending",
              method: "STRIPE",
              status: "VERIFIED",
              amount: eventData.amount_total / 100,
              currency: "USD",
              stripeSessionId: eventData.id,
              stripePaymentIntentId: eventData.payment_intent,
            },
          }).catch(() => log("WARN", `[${requestId}] Payment record creation failed`))
        }

        log("INFO", `[${requestId}] Subscription activated for company ${companyId}`)
        processedEventIds.add(event.id)
        return NextResponse.json({ received: true })
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subId = eventData.id
        const companyId = eventData.metadata?.companyId
        const stripeStatus = eventData.status

        log("INFO", `[${requestId}] Processing ${event.type}`, { subId, stripeStatus })

        if (!companyId) break

        const sub = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: subId },
        })

        if (!sub) break

        const dbStatus = stripeStatus === "active" ? "ACTIVE"
          : stripeStatus === "trialing" ? "TRIALING"
          : stripeStatus === "past_due" ? "PENDING"
          : stripeStatus === "canceled" ? "CANCELLED"
          : stripeStatus === "incomplete" ? "PENDING"
          : "PENDING"

        await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            status: dbStatus as any,
            trialEndsAt: eventData.trial_end ? new Date(eventData.trial_end * 1000) : undefined,
            endDate: eventData.current_period_end ? new Date(eventData.current_period_end * 1000) : undefined,
          },
        })

        log("INFO", `[${requestId}] Subscription ${sub.id} status -> ${dbStatus}`)
        break
      }

      case "customer.subscription.deleted": {
        const stripeSubId = eventData.id
        log("INFO", `[${requestId}] Processing subscription.deleted`, { subId: stripeSubId })

        const sub = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: stripeSubId },
        })

        if (sub) {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: "CANCELLED", endDate: new Date() },
          })
          log("INFO", `[${requestId}] Subscription ${sub.id} cancelled`)
        }
        break
      }

      case "invoice.paid": {
        const invoiceSubId = eventData.subscription
        log("INFO", `[${requestId}] Processing invoice.paid`, { subscription: invoiceSubId, amount: eventData.amount_paid })

        const sub = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: invoiceSubId },
        })

        if (sub) {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: "ACTIVE" },
          })

          await prisma.payment.create({
            data: {
              companyId: sub.companyId,
              subscriptionId: sub.id,
              method: "STRIPE",
              status: "VERIFIED",
              amount: eventData.amount_paid ? eventData.amount_paid / 100 : 0,
              currency: "USD",
              transactionId: eventData.id,
            },
          }).catch(() => {})
        }
        break
      }

      case "invoice.payment_failed": {
        const failedSubId = eventData.subscription
        log("WARN", `[${requestId}] Processing invoice.payment_failed`, { subscription: failedSubId })

        const sub = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: failedSubId },
        })

        if (sub) {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: "PENDING" },
          })

          await prisma.payment.create({
            data: {
              companyId: sub.companyId,
              subscriptionId: sub.id,
              method: "STRIPE",
              status: "FAILED",
              amount: eventData.amount_due ? eventData.amount_due / 100 : 0,
              transactionId: eventData.id,
            },
          }).catch(() => {})
        }
        break
      }
    }

    processedEventIds.add(event.id)
    return NextResponse.json({ received: true })
  } catch (error: any) {
    log("ERROR", `[${requestId}] Unhandled error`, { message: error.message, stack: error.stack })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
