import { NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

// In-memory set for idempotency (resets on redeploy — acceptable for debugging)
const processedEventIds = new Set<string>()

function log(level: "INFO" | "WARN" | "ERROR", message: string, data?: any) {
  const timestamp = new Date().toISOString()
  const prefix = `[WEBHOOK ${timestamp}] [${level}]`
  if (data) {
    console.log(`${prefix} ${message}`, JSON.stringify(data, null, 2))
  } else {
    console.log(`${prefix} ${message}`)
  }
}

// GET handler for diagnostics — visit /api/payments/webhook in browser
export async function GET() {
  const hasStripeKey = !!process.env.STRIPE_SECRET_KEY
  const hasWebhookSecret = !!process.env.STRIPE_WEBHOOK_SECRET
  const webhookSecretPrefix = process.env.STRIPE_WEBHOOK_SECRET
    ? process.env.STRIPE_WEBHOOK_SECRET.startsWith("whsec_")
      ? "whsec_... (valid prefix)"
      : "INVALID — does not start with whsec_"
    : "MISSING"
  const hasDbUrl = !!process.env.DATABASE_URL
  const hasNextAuthSecret = !!process.env.NEXTAUTH_SECRET

  return NextResponse.json({
    status: "diagnostic",
    env: {
      STRIPE_SECRET_KEY: hasStripeKey ? "set" : "MISSING",
      STRIPE_WEBHOOK_SECRET: webhookSecretPrefix,
      DATABASE_URL: hasDbUrl ? "set" : "MISSING",
      NEXTAUTH_SECRET: hasNextAuthSecret ? "set" : "MISSING",
    },
    required_actions: [
      ...(!hasStripeKey ? ["Set STRIPE_SECRET_KEY"] : []),
      ...(!hasWebhookSecret ? ["Set STRIPE_WEBHOOK_SECRET"] : []),
      ...(hasWebhookSecret && !process.env.STRIPE_WEBHOOK_SECRET!.startsWith("whsec_")
        ? ["STRIPE_WEBHOOK_SECRET should start with whsec_"]
        : []),
      ...(!hasDbUrl ? ["Set DATABASE_URL"] : []),
      ...(!hasNextAuthSecret ? ["Set NEXTAUTH_SECRET"] : []),
    ],
  })
}

export async function POST(req: Request) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const startTime = Date.now()

  try {
    // ─── 1. Read raw body via ReadableStream (preserves exact bytes) ────
    let rawBody: Buffer
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
      rawBody = Buffer.concat(chunks)
    } catch (err) {
      log("ERROR", `[${requestId}] Failed to read request body`, err)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    if (!rawBody || rawBody.length === 0) {
      log("ERROR", `[${requestId}] Empty request body`)
      return NextResponse.json({ error: "Empty request body" }, { status: 400 })
    }

    log("INFO", `[${requestId}] Webhook received, body length: ${rawBody.length}`)

    // ─── 2. Extract and log signature header ──────────────────────────────
    const signature = req.headers.get("stripe-signature")
    if (!signature) {
      log("ERROR", `[${requestId}] Missing stripe-signature header`)
      return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
    }
    log("INFO", `[${requestId}] stripe-signature header present, length: ${signature.length}`)

    // ─── 3. Check and log webhook secret ─────────────────────────────────
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      log("ERROR", `[${requestId}] STRIPE_WEBHOOK_SECRET is not configured in environment`)
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
    }
    const maskedSecret = webhookSecret.length > 8
      ? webhookSecret.slice(0, 4) + "****" + webhookSecret.slice(-4)
      : "(too short)"
    log("INFO", `[${requestId}] STRIPE_WEBHOOK_SECRET exists, length: ${webhookSecret.length}, masked: ${maskedSecret}`)

    // ─── 4. Manual HMAC verification for debugging ────────────────────────
    // Parse the stripe-signature header to extract timestamp and signatures
    const sigParts = signature.split(",").map((p) => p.trim())
    let sigTimestamp = ""
    const sigValues: string[] = []
    for (const part of sigParts) {
      if (part.startsWith("t=")) sigTimestamp = part.slice(2)
      if (part.startsWith("v1=")) sigValues.push(part.slice(3))
    }

    // Compute expected HMAC manually
    const payloadToSign = `${sigTimestamp}.${rawBody.toString("utf8")}`
    const expectedSig = crypto
      .createHmac("sha256", webhookSecret)
      .update(payloadToSign)
      .digest("hex")

    const sigMatch = sigValues.some((s) => crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expectedSig)))

    log("INFO", `[${requestId}] Manual HMAC diagnostics`, {
      bodyLength: rawBody.length,
      bodyFirstChars: rawBody.slice(0, 200).toString("utf8"),
      bodyHexPrefix: rawBody.slice(0, 32).toString("hex"),
      timestamp: sigTimestamp,
      signatureCount: sigValues.length,
      firstSignaturePrefix: sigValues[0]?.slice(0, 16) || "(none)",
      expectedSigPrefix: expectedSig.slice(0, 16),
      sigMatch,
    })

    // ─── 5. Construct event via Stripe library ───────────────────────────
    let event: any
    try {
      event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret)
      log("INFO", `[${requestId}] Signature verified successfully, event type: ${event.type}, event id: ${event.id}`)
    } catch (sigErr: any) {
      log("ERROR", `[${requestId}] Signature verification failed`, {
        message: sigErr.message,
        type: sigErr.type,
        header: sigErr.header,
        code: sigErr.code,
        bodyLength: rawBody.length,
        expectedSigPrefix: expectedSig.slice(0, 16),
        receivedSigPrefix: sigValues[0]?.slice(0, 16),
        sigMatch,
        stack: sigErr.stack,
      })
      // Try to parse body as JSON for debugging even if sig fails
      try {
        const parsed = JSON.parse(rawBody.toString("utf8"))
        log("ERROR", `[${requestId}] Parsed body event type for debugging`, { type: parsed.type, id: parsed.id, evtId: parsed.id })
      } catch {
        log("ERROR", `[${requestId}] Could not parse body as JSON for debugging`)
      }
      return NextResponse.json({
        error: "Invalid signature",
        requestId,
        diagnostics: {
          bodyLength: rawBody.length,
          timestamp: sigTimestamp,
          sigCount: sigValues.length,
          expectedPrefix: expectedSig.slice(0, 16),
          receivedPrefix: sigValues[0]?.slice(0, 16) || "(none)",
          sigMatch,
        },
      }, { status: 400 })
    }

    // ─── 5. Idempotency check ──────────────────────────────────────────────
    if (processedEventIds.has(event.id)) {
      log("INFO", `[${requestId}] Event ${event.id} already processed, skipping`)
      return NextResponse.json({ received: true, idempotent: true })
    }

    // ─── 4. Route event type ──────────────────────────────────────────────
    switch (event.type) {
      // ── 4a. checkout.session.completed ─────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as any
        const sessionId = session.id || "unknown"

        log("INFO", `[${requestId}] Processing checkout.session.completed`, {
          sessionId,
          customer: session.customer,
          subscription: session.subscription,
          amount_total: session.amount_total,
          payment_status: session.payment_status,
          status: session.status,
          mode: session.mode,
        })

        // Confirm payment actually succeeded — don't trust event alone
        if (session.payment_status !== "paid") {
          log("WARN", `[${requestId}] Payment not yet paid, status: ${session.payment_status} — skipping activation`)
          processedEventIds.add(event.id)
          return NextResponse.json({ received: true, pending: true })
        }

        // ── 4a-i. Extract and validate metadata ────────────────────────────
        const metadata = session.metadata || {}
        const companyId: string | undefined = metadata.companyId
        const planId: string | undefined = metadata.planId

        if (!companyId || typeof companyId !== "string") {
          log("ERROR", `[${requestId}] Missing or invalid companyId in metadata`, { metadata })
          return NextResponse.json({ error: "Missing companyId in session metadata" }, { status: 400 })
        }

        if (!planId || typeof planId !== "string") {
          log("ERROR", `[${requestId}] Missing or invalid planId in metadata`, { metadata })
          return NextResponse.json({ error: "Missing planId in session metadata" }, { status: 400 })
        }

        log("INFO", `[${requestId}] Metadata validated`, { companyId, planId })

        // ── 4a-ii. Validate plan exists in database ──────────────────────
        let plan: any
        try {
          plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } })
        } catch (dbErr: any) {
          log("ERROR", `[${requestId}] Database error fetching plan`, {
            planId,
            error: dbErr.message,
            code: dbErr.code,
            stack: dbErr.stack,
          })
          return NextResponse.json({ error: "Database error fetching plan" }, { status: 500 })
        }

        if (!plan) {
          log("ERROR", `[${requestId}] Plan not found in database`, { planId })
          return NextResponse.json({ error: `Plan ${planId} not found` }, { status: 404 })
        }

        log("INFO", `[${requestId}] Plan found`, { planId: plan.id, name: plan.name, price: plan.price })

        // ── 4a-iii. Validate company exists ─────────────────────────────
        let company: any
        try {
          company = await prisma.company.findUnique({ where: { id: companyId } })
        } catch (dbErr: any) {
          log("ERROR", `[${requestId}] Database error fetching company`, {
            companyId,
            error: dbErr.message,
            code: dbErr.code,
            stack: dbErr.stack,
          })
          return NextResponse.json({ error: "Database error fetching company" }, { status: 500 })
        }

        if (!company) {
          log("ERROR", `[${requestId}] Company not found in database`, { companyId })
          return NextResponse.json({ error: `Company ${companyId} not found` }, { status: 404 })
        }

        log("INFO", `[${requestId}] Company found`, { companyId: company.id, name: company.name })

        // ── 4a-iv. Sanitize Stripe payload fields ──────────────────────
        const stripeSubscriptionId: string | null = session.subscription || null
        const stripeSessionIdSafe: string | null = session.id || null
        const amountTotal: number = typeof session.amount_total === "number" ? session.amount_total / 100 : 0
        const paymentIntent: string | null = session.payment_intent || null
        const now = new Date()
        const endDate = new Date(now.getTime() + plan.durationDays * 86400000)

        log("INFO", `[${requestId}] Computed subscription dates`, {
          startDate: now.toISOString(),
          endDate: endDate.toISOString(),
          durationDays: plan.durationDays,
        })

        // ── 4a-v. Upsert subscription ──────────────────────────────────
        let subRecord: any
        try {
          log("INFO", `[${requestId}] Upserting subscription...`)
          subRecord = await prisma.subscription.upsert({
            where: { companyId },
            update: {
              planId,
              status: "ACTIVE",
              paymentMethod: "STRIPE",
              stripeSubscriptionId,
              stripeSessionId: stripeSessionIdSafe,
              startDate: now,
              endDate,
            },
            create: {
              companyId,
              planId,
              status: "ACTIVE",
              paymentMethod: "STRIPE",
              stripeSubscriptionId,
              stripeSessionId: stripeSessionIdSafe,
              startDate: now,
              endDate,
            },
          })
          log("INFO", `[${requestId}] Subscription upsert successful`, {
            subscriptionId: subRecord.id,
            status: subRecord.status,
            planId: subRecord.planId,
          })
        } catch (dbErr: any) {
          log("ERROR", `[${requestId}] Database error upserting subscription`, {
            companyId,
            planId,
            error: dbErr.message,
            code: dbErr.code,
            stack: dbErr.stack,
            meta: dbErr.meta,
          })
          return NextResponse.json({ error: "Failed to create/update subscription" }, { status: 500 })
        }

        // ── 4a-vi. Create payment record ────────────────────────────────
        try {
          log("INFO", `[${requestId}] Creating payment record...`)
          await prisma.payment.create({
            data: {
              companyId,
              subscriptionId: subRecord.id,
              method: "STRIPE",
              status: "VERIFIED",
              amount: amountTotal,
              currency: "USD",
              transactionId: paymentIntent,
              stripeSessionId: stripeSessionIdSafe,
              stripePaymentIntentId: paymentIntent,
              verifiedAt: now,
            },
          })
          log("INFO", `[${requestId}] Payment record created`, {
            amount: amountTotal,
            paymentIntent,
          })
        } catch (dbErr: any) {
          log("ERROR", `[${requestId}] Database error creating payment record`, {
            companyId,
            subscriptionId: subRecord.id,
            error: dbErr.message,
            code: dbErr.code,
            stack: dbErr.stack,
          })
          // Subscription was already created — still return 200 so Stripe
          // doesn't keep retrying; log for manual inspection
          log("WARN", `[${requestId}] Payment record creation failed but subscription was updated — continuing`)
        }

        // ── 4a-vii. Mark event as processed ─────────────────────────────
        processedEventIds.add(event.id)
        log("INFO", `[${requestId}] checkout.session.completed processed successfully`, {
          duration_ms: Date.now() - startTime,
        })

        return NextResponse.json({
          received: true,
          subscriptionId: subRecord.id,
          status: "ACTIVE",
        })
      }

      // ── 4b. invoice.payment_failed ───────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as any
        log("INFO", `[${requestId}] Processing invoice.payment_failed`, {
          invoiceId: invoice.id,
          subscription: invoice.subscription,
          amount_due: invoice.amount_due,
        })

        const stripeSubscriptionId: string | null = invoice.subscription || null
        if (!stripeSubscriptionId) {
          log("ERROR", `[${requestId}] invoice has no subscription id`, { invoiceId: invoice.id })
          return NextResponse.json({ error: "Invoice missing subscription ID" }, { status: 400 })
        }

        let subscription: any
        try {
          subscription = await prisma.subscription.findFirst({
            where: { stripeSubscriptionId },
          })
        } catch (dbErr: any) {
          log("ERROR", `[${requestId}] Database error finding subscription`, {
            stripeSubscriptionId,
            error: dbErr.message,
            code: dbErr.code,
            stack: dbErr.stack,
          })
          return NextResponse.json({ error: "Database error finding subscription" }, { status: 500 })
        }

        if (!subscription) {
          log("ERROR", `[${requestId}] Subscription not found for stripe id`, { stripeSubscriptionId })
          return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
        }

        log("INFO", `[${requestId}] Found subscription`, { subscriptionId: subscription.id })

        try {
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
          log("INFO", `[${requestId}] Failed payment recorded`)
        } catch (dbErr: any) {
          log("ERROR", `[${requestId}] Database error recording failed payment`, {
            error: dbErr.message,
            code: dbErr.code,
            stack: dbErr.stack,
          })
          return NextResponse.json({ error: "Failed to record payment failure" }, { status: 500 })
        }

        processedEventIds.add(event.id)
        return NextResponse.json({ received: true })
      }

      // ── 4c. payment_intent.succeeded (backup for checkout flow) ─────
      case "payment_intent.succeeded": {
        const pi = event.data.object as any
        const piMetadata = pi.metadata || {}

        // Payment intents from checkout sessions inherit checkout metadata
        if (piMetadata.companyId && piMetadata.planId) {
          log("INFO", `[${requestId}] payment_intent.succeeded with metadata — forwarding to activation`, {
            paymentIntent: pi.id,
            companyId: piMetadata.companyId,
            planId: piMetadata.planId,
          })
          // Re-process same way as checkout.session.completed by using metadata
          // to avoid code duplication, just acknowledge it; the primary handler
          // is checkout.session.completed which fires simultaneously
        } else {
          log("INFO", `[${requestId}] payment_intent.succeeded (no metadata) — acknowledging`)
        }

        processedEventIds.add(event.id)
        return NextResponse.json({ received: true })
      }

      // ── 4d. Unhandled event types ───────────────────────────────────
      default: {
        log("INFO", `[${requestId}] Unhandled event type: ${event.type} — acknowledging`)
        return NextResponse.json({ received: true })
      }
    }
  } catch (error: any) {
    log("ERROR", `Webhook catch-all error`, {
      message: error.message,
      name: error.name,
      stack: error.stack,
      type: error.type,
      code: error.code,
    })
    return NextResponse.json({
      error: "Internal server error processing webhook",
      requestId,
    }, { status: 500 })
  }
}
