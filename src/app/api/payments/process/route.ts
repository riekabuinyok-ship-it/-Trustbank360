import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/log-event"

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { planId, companyId, paymentMethod, bankDetails } = body

    if (!planId || !companyId || !paymentMethod) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (paymentMethod === "bank" && (!bankDetails?.bankName || !bankDetails?.accountName || !bankDetails?.accountNumber)) {
      return NextResponse.json({ error: "Bank details are required for bank transfer" }, { status: 400 })
    }

    // Get the plan details
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    })

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    // Verify the company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    })

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    // For test Stripe, we'll simulate a payment
    // In a real implementation, you would integrate with Stripe API
    const paymentRecord = await prisma.payment.create({
      data: {
        company: { connect: { id: companyId } },
        subscription: {
          create: {
            company: { connect: { id: companyId } },
            plan: { connect: { id: planId } },
            status: paymentMethod === "bank" ? "TRIALING" : "ACTIVE",
            paymentMethod: paymentMethod.toUpperCase() as any,
          }
        },
        method: paymentMethod.toUpperCase(),
        status: paymentMethod === "bank" ? "PENDING" : "VERIFIED",
        amount: plan.price,
        currency: plan.currency,
        notes: paymentMethod === "bank" 
          ? `Bank transfer to ${bankDetails?.bankName} - Account: ${bankDetails?.accountName} (${bankDetails?.accountNumber})`
          : "Card payment via Stripe test environment",
      },
    })

    return NextResponse.json({
      success: true,
      payment: paymentRecord,
      message: paymentMethod === "bank"
        ? "Bank transfer initiated. Please contact support to complete the transfer."
        : "Payment processed successfully!",
    })
  } catch (error) {
    console.error("Payment process error:", error)
    return NextResponse.json({ error: "Failed to process payment" }, { status: 500 })
  }
}
