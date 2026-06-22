import { prisma } from "./prisma"
import { ENTERPRISE_PLAN } from "./plan-config"

let cachedEnterprisePlanId: string | null = null

async function getOrCreateEnterprisePlan(): Promise<string> {
  if (cachedEnterprisePlanId) return cachedEnterprisePlanId

  const existing = await prisma.subscriptionPlan.findFirst({
    where: { name: "Enterprise" },
  })

  if (existing) {
    cachedEnterprisePlanId = existing.id
    return existing.id
  }

  const created = await prisma.subscriptionPlan.create({
    data: {
      name: "Enterprise",
      description: "All features included. Unlimited branches, staff, and currencies.",
      price: ENTERPRISE_PLAN.monthlyPrice,
      currency: "USD",
      durationDays: 30,
      trialDays: ENTERPRISE_PLAN.trialDays,
      maxBranches: 999999,
      maxStaff: 999999,
      maxCurrencies: 999999,
      features: [
        "Unlimited Branches",
        "Unlimited Staff Users",
        "Unlimited Currencies",
        "Unlimited Transfers",
        "Branch Wallets",
        "Advanced KYC/AML",
        "Advanced Analytics",
        "Custom Reports",
        "24/7 Dedicated Support",
        "Dedicated Account Manager",
        "Priority Processing",
        "Full API Access",
        "Custom Integrations",
        "Custom Branding & Domain",
        "Enterprise Security Features",
      ],
      isActive: true,
    },
  })

  cachedEnterprisePlanId = created.id
  return created.id
}

export async function ensureEnterprisePlan(companyId: string): Promise<void> {
  try {
    const enterprisePlanId = await getOrCreateEnterprisePlan()

    const sub = await prisma.subscription.findUnique({
      where: { companyId },
      select: { planId: true, plan: { select: { name: true } } },
    })

    if (!sub) {
      const now = new Date()
      const trialEndsAt = new Date(now.getTime() + ENTERPRISE_PLAN.trialDays * 86400000)
      await prisma.subscription.create({
        data: {
          companyId,
          planId: enterprisePlanId,
          status: "TRIALING",
          startDate: now,
          trialEndsAt,
          endDate: trialEndsAt,
        },
      })
      console.log(`[migrate] Created Enterprise subscription for company ${companyId}`)
    } else if (sub.planId !== enterprisePlanId || sub.plan?.name !== "Enterprise") {
      await prisma.subscription.update({
        where: { companyId },
        data: { planId: enterprisePlanId },
      })
      console.log(`[migrate] Migrated company ${companyId} to Enterprise plan`)
    }

    await prisma.company.update({
      where: { id: companyId },
      data: { overLimit: false },
    }).catch(() => {})
  } catch (err) {
    console.error("[migrate] ensureEnterprisePlan failed:", err)
  }
}
