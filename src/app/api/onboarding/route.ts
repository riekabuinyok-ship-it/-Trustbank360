import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { checkPlanLimit, PlanEnforcementError } from "@/lib/plan-enforcement"
import { formatApiError } from "@/lib/api-error"
import { getPlanByName } from "@/lib/plan-config"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = session.user as any
  const body = await request.json()

  try {
    const requestedBranches = parseInt(body.numberOfBranches) || 1
    const requestedStaff = parseInt(body.numberOfStaff) || 1
    const allCurrencies = [body.mainCurrency, ...(body.additionalCurrencies || [])].filter(Boolean)

    const sub = await prisma.subscription.findUnique({
      where: { companyId: user.companyId },
      select: { plan: { select: { name: true, maxBranches: true, maxStaff: true, maxCurrencies: true } } },
    })
    if (!sub) {
      return NextResponse.json(formatApiError("NO_SUBSCRIPTION"), { status: 403 })
    }

    const planDef = getPlanByName(sub.plan.name)
    if (!planDef) {
      return NextResponse.json(formatApiError("UNKNOWN_PLAN", { plan: sub.plan.name }), { status: 403 })
    }

    if (planDef.limits.branches !== Infinity && requestedBranches > planDef.limits.branches) {
      return NextResponse.json({
        success: false, errorCode: "BRANCH_LIMIT_REACHED", title: "Branch limit exceeded",
        message: `Your ${planDef.name} plan allows up to ${planDef.limits.branches} branches.`,
        upgradeRequired: true, plan: planDef.name,
        usage: { used: requestedBranches, limit: planDef.limits.branches },
        suggestedPlan: planDef.name === "Small Company" ? "Medium Company" : "Enterprise",
      }, { status: 403 })
    }

    if (planDef.limits.staff !== Infinity && requestedStaff > planDef.limits.staff) {
      return NextResponse.json({
        success: false, errorCode: "STAFF_LIMIT_REACHED", title: "Staff limit exceeded",
        message: `Your ${planDef.name} plan allows up to ${planDef.limits.staff} staff.`,
        upgradeRequired: true, plan: planDef.name,
        usage: { used: requestedStaff, limit: planDef.limits.staff },
        suggestedPlan: planDef.name === "Small Company" ? "Medium Company" : "Enterprise",
      }, { status: 403 })
    }

    if (planDef.limits.currencies !== Infinity && allCurrencies.length > planDef.limits.currencies) {
      return NextResponse.json({
        success: false, errorCode: "CURRENCY_LIMIT_REACHED", title: "Currency limit exceeded",
        message: `Your ${planDef.name} plan allows up to ${planDef.limits.currencies} currencies.`,
        upgradeRequired: true, plan: planDef.name,
        usage: { used: allCurrencies.length, limit: planDef.limits.currencies },
        suggestedPlan: planDef.name === "Small Company" ? "Medium Company" : "Enterprise",
      }, { status: 403 })
    }

    await prisma.company.update({
      where: { id: user.companyId },
      data: {
        numberOfBranches: requestedBranches,
        numberOfStaff: requestedStaff,
        mainCurrency: body.mainCurrency,
        additionalCurrencies: body.additionalCurrencies,
        address: body.address,
        phone: body.phone,
        website: body.website,
        onboardingComplete: true,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof PlanEnforcementError) {
      return NextResponse.json(error.toJSON(), { status: 403 })
    }
    return NextResponse.json({ error: "Failed to complete onboarding" }, { status: 500 })
  }
}
