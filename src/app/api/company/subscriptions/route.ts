import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = session.user as any
  if (!user.companyId) return NextResponse.json({ error: "No company" }, { status: 400 })

  const role = user.role
  if (role !== "company_owner" && role !== "company_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { companyId, planId, paymentMethod } = await request.json()

    if (!companyId || !planId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify company ownership
    if (companyId !== user.companyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check plan exists
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } })
    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: "Plan not found or inactive" }, { status: 404 })
    }

    // If switching to a different plan, validate current usage against target plan limits
    const currentSub = await prisma.subscription.findUnique({ where: { companyId } })
    if (currentSub && currentSub.planId !== planId) {
      const targetPlan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } })
      if (targetPlan) {
        const [branchCount, staffCount, transferCurrencies] = await Promise.all([
          prisma.branch.count({ where: { companyId } }),
          prisma.user.count({ where: { companyId } }),
          prisma.transfer.findMany({
            where: { companyId, status: { notIn: ["CANCELLED", "REVERSED"] } },
            select: { currency: true },
            distinct: ["currency"],
          }),
        ])
        const currencyCount = transferCurrencies.length

        const errors: string[] = []
        if (targetPlan.maxBranches < 999999 && branchCount > targetPlan.maxBranches) {
          errors.push(`${branchCount} branches (limit: ${targetPlan.maxBranches})`)
        }
        if (targetPlan.maxStaff < 999999 && staffCount > targetPlan.maxStaff) {
          errors.push(`${staffCount} staff (limit: ${targetPlan.maxStaff})`)
        }
        if (targetPlan.maxCurrencies < 999999 && currencyCount > targetPlan.maxCurrencies) {
          errors.push(`${currencyCount} currencies (limit: ${targetPlan.maxCurrencies})`)
        }

        if (errors.length > 0) {
          return NextResponse.json({
            success: false, errorCode: "PLAN_DOWNGRADE_BLOCKED", title: "Cannot switch plan",
            message: `Your current usage exceeds the ${targetPlan.name} plan limits: ${errors.join(", ")}. Remove some resources or upgrade to a larger plan.`,
            upgradeRequired: true,
          }, { status: 403 })
        }
      }
    }

    // Check if company already has a subscription
    let subscription: any

    if (currentSub) {
      // Update existing subscription
      subscription = await prisma.subscription.update({
        where: { id: currentSub.id },
        data: {
          planId,
          paymentMethod: paymentMethod || null,
          status: "PENDING",
        },
      })
    } else {
      // Create new subscription
      subscription = await prisma.subscription.create({
        data: {
          companyId,
          planId,
          paymentMethod: paymentMethod || null,
          status: "PENDING",
        },
      })
    }

    return NextResponse.json({ success: true, subscription })
  } catch (error) {
    console.error("Subscription creation error:", error)
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 })
  }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = session.user as any
  if (!user.companyId) return NextResponse.json({ error: "No company" }, { status: 400 })

  const [plans, subscription, payments, settings] = await Promise.all([
    prisma.subscriptionPlan.findMany({ orderBy: { price: "asc" } }),
    prisma.subscription.findUnique({
      where: { companyId: user.companyId },
      include: { plan: true, payments: { orderBy: { createdAt: "desc" }, take: 50 } },
    }),
    prisma.payment.findMany({
      where: { companyId: user.companyId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.platformSetting.findFirst(),
  ])

  return NextResponse.json({
    plans,
    subscription,
    payments,
    bankInfo: settings
      ? {
          bankName: settings.bankName,
          bankAccountName: settings.bankAccountName,
          bankAccountNumber: settings.bankAccountNumber,
          bankInstructions: settings.bankInstructions,
        }
      : null,
  })
}