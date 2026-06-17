import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getStripe } from "@/lib/stripe"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = session.user as any

  if (user.role !== "platform_owner" && user.role !== "company_owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { companyId, planId, successUrl, cancelUrl } = await req.json()

    if (!companyId || !planId || !successUrl || !cancelUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Server-side security: ensure the user owns this company
    if (companyId !== user.companyId) {
      return NextResponse.json({ error: "Company mismatch" }, { status: 403 })
    }

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } })
    if (!plan) {
      return NextResponse.json({ error: "Subscription plan not found" }, { status: 404 })
    }

    const company = await prisma.company.findUnique({ where: { id: companyId } })
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    const checkoutSession = await getStripe().checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: plan.currency.toLowerCase(),
            product_data: {
              name: plan.name,
              description: plan.description || undefined,
            },
            unit_amount: Math.round(plan.price * 100),
            recurring: {
              interval: "month",
              interval_count: Math.ceil(plan.durationDays / 30),
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        companyId,
        planId,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error("Stripe checkout error:", error)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
