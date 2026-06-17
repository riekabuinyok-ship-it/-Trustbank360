import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { planId, companyId, paymentMethod } = body

    if (!planId || !companyId || !paymentMethod) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    })

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
    })

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    // For non-Stripe payments, create a PENDING subscription only.
    // Activation happens via Stripe webhook or admin bank payment verification.
    const paymentRecord = await prisma.payment.create({
      data: {
        company: { connect: { id: companyId } },
        subscription: {
          create: {
            company: { connect: { id: companyId } },
            plan: { connect: { id: planId } },
            status: "PENDING",
            paymentMethod: paymentMethod.toUpperCase() as any,
          }
        },
        method: paymentMethod.toUpperCase(),
        status: "PENDING",
        amount: plan.price,
        currency: plan.currency,
      },
    })

    return NextResponse.json({
      success: true,
      payment: paymentRecord,
      message: "Subscription created with PENDING status. Payment required to activate.",
    })
  } catch (error) {
    console.error("Payment process error:", error)
    return NextResponse.json({ error: "Failed to process payment" }, { status: 500 })
  }
}
