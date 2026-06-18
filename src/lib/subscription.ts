import { prisma } from "./prisma"
import { getStripe } from "./stripe"

export interface PlanLimits {
  maxBranches: number
  maxStaff: number
  maxCurrencies: number
}

export interface PlanFeatures {
  auditLogs: boolean
  apiAccess: "none" | "basic" | "full"
  customBranding: boolean
  advancedAnalytics: boolean
  customReports: boolean
  dedicatedSupport: boolean
}

const PLAN_FEATURES: Record<string, PlanFeatures> = {
  "Small Company": {
    auditLogs: false,
    apiAccess: "none",
    customBranding: false,
    advancedAnalytics: false,
    customReports: false,
    dedicatedSupport: false,
  },
  "Medium Company": {
    auditLogs: true,
    apiAccess: "basic",
    customBranding: true,
    advancedAnalytics: true,
    customReports: true,
    dedicatedSupport: false,
  },
  Enterprise: {
    auditLogs: true,
    apiAccess: "full",
    customBranding: true,
    advancedAnalytics: true,
    customReports: true,
    dedicatedSupport: true,
  },
}

export function getPlanFeatures(planName: string): PlanFeatures {
  return PLAN_FEATURES[planName] || PLAN_FEATURES["Small Company"]
}

export function getPlanLimits(planName: string): PlanLimits {
  switch (planName) {
    case "Small Company":
      return { maxBranches: 2, maxStaff: 5, maxCurrencies: 2 }
    case "Medium Company":
      return { maxBranches: 10, maxStaff: 25, maxCurrencies: 6 }
    case "Enterprise":
      return { maxBranches: Infinity, maxStaff: Infinity, maxCurrencies: Infinity }
    default:
      return { maxBranches: 2, maxStaff: 5, maxCurrencies: 2 }
  }
}

export function getTrialDays(planName: string): number {
  switch (planName) {
    case "Small Company": return 30
    case "Medium Company": return 60
    case "Enterprise": return 90
    default: return 30
  }
}

export async function getCompanySubscription(companyId: string) {
  return prisma.subscription.findUnique({
    where: { companyId },
    include: { plan: true },
  })
}

async function getOrCreatePrice(plan: { id: string; name: string; price: number; currency: string }) {
  const existingPrices = await getStripe().prices.search({
    query: `metadata["planId"]:"${plan.id}"`,
  })

  if (existingPrices.data.length > 0) {
    return existingPrices.data[0]
  }

  const existingProducts = await getStripe().products.search({
    query: `metadata["planId"]:"${plan.id}"`,
  })

  let productId: string
  if (existingProducts.data.length > 0) {
    productId = existingProducts.data[0].id
  } else {
    const product = await getStripe().products.create({
      name: plan.name,
      metadata: { planId: plan.id },
    })
    productId = product.id
  }

  const price = await getStripe().prices.create({
    product: productId,
    unit_amount: Math.round(plan.price * 100),
    currency: plan.currency.toLowerCase(),
    recurring: { interval: "month", interval_count: 1 },
    lookup_key: `plan_${plan.id}`,metadata: { planId: plan.id },
  })

  return price
}

export async function createStripeSubscription(companyId: string, planId: string, customerId: string) {
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } })
  if (!plan) throw new Error("Plan not found")

  const trialDays = getTrialDays(plan.name)
  const price = await getOrCreatePrice(plan)

  const subscription = await getStripe().subscriptions.create({
    customer: customerId,
    items: [{ price: price.id, quantity: 1 }],
    trial_period_days: trialDays,
    metadata: { companyId, planId },
    payment_behavior: "default_incomplete",
    expand: ["latest_invoice.payment_intent"],
  })

  return subscription
}

export async function createStripeCustomer(companyId: string, email: string, name: string) {
  const customer = await getStripe().customers.create({
    email,
    name,
    metadata: { companyId },
  })
  return customer
}

export async function activateSubscription(companyId: string, planId: string) {
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } })
  if (!plan) throw new Error("Plan not found")

  const now = new Date()
  const trialDays = getTrialDays(plan.name)
  const trialEndsAt = new Date(now.getTime() + trialDays * 86400000)

  const limits = getPlanLimits(plan.name)

  await prisma.company.update({
    where: { id: companyId },
    data: {
      numberOfBranches: Math.min(limits.maxBranches, Infinity),
      numberOfStaff: Math.min(limits.maxStaff, Infinity),
    },
  })

  return prisma.subscription.upsert({
    where: { companyId },
    update: {
      planId,
      status: "TRIALING",
      startDate: now,
      trialEndsAt,
      endDate: trialEndsAt,
    },
    create: {
      companyId,
      planId,
      status: "TRIALING",
      startDate: now,
      trialEndsAt,
      endDate: trialEndsAt,
    },
  })
}

export async function upgradeSubscription(companyId: string, newPlanId: string) {
  const sub = await prisma.subscription.findUnique({ where: { companyId } })
  if (!sub) throw new Error("No subscription found")

  const newPlan = await prisma.subscriptionPlan.findUnique({ where: { id: newPlanId } })
  if (!newPlan) throw new Error("Plan not found")

  if (sub.stripeSubscriptionId) {
    const stripeSub = await getStripe().subscriptions.retrieve(sub.stripeSubscriptionId)
    const subscriptionItemId = stripeSub.items.data[0].id
    const price = await getOrCreatePrice(newPlan)

    await getStripe().subscriptions.update(sub.stripeSubscriptionId, {
      items: [{ id: subscriptionItemId, price: price.id }],
      metadata: { companyId, planId: newPlanId },
    })
  }

  return prisma.subscription.update({
    where: { companyId },
    data: { planId: newPlanId },
  })
}

export async function downgradeSubscription(companyId: string, newPlanId: string) {
  const sub = await prisma.subscription.findUnique({ where: { companyId } })
  if (!sub) throw new Error("No subscription found")

  const newPlan = await prisma.subscriptionPlan.findUnique({ where: { id: newPlanId } })
  if (!newPlan) throw new Error("Plan not found")

  if (sub.stripeSubscriptionId) {
    try {
      const stripeSub = await getStripe().subscriptions.retrieve(sub.stripeSubscriptionId)
      const subscriptionItemId = stripeSub.items.data[0].id
      const price = await getOrCreatePrice(newPlan)

      await getStripe().subscriptions.update(sub.stripeSubscriptionId, {
        items: [{ id: subscriptionItemId, price: price.id }],
        metadata: { companyId, planId: newPlanId },
      })
    } catch {
      // If Stripe update fails, still update DB — user can fix payment later
    }
  }

  return prisma.subscription.update({
    where: { companyId },
    data: { planId: newPlanId },
  })
}
