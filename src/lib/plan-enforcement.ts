import { prisma } from "./prisma"
import { getCompanySubscription, getPlanLimits, getPlanFeatures, type PlanFeatures } from "./subscription"

export class PlanEnforcementError extends Error {
  constructor(message: string, public statusCode: number = 403) {
    super(message)
    this.name = "PlanEnforcementError"
  }
}

export async function enforceBranchLimit(companyId: string): Promise<void> {
  const sub = await getCompanySubscription(companyId)
  if (!sub) throw new PlanEnforcementError("No active subscription")

  const limits = getPlanLimits(sub.plan.name)

  const branchCount = await prisma.branch.count({ where: { companyId } })
  if (branchCount >= limits.maxBranches) {
    throw new PlanEnforcementError(`Branch limit reached (${limits.maxBranches}). Upgrade your plan.`)
  }
}

export async function enforceStaffLimit(companyId: string): Promise<void> {
  const sub = await getCompanySubscription(companyId)
  if (!sub) throw new PlanEnforcementError("No active subscription")

  const limits = getPlanLimits(sub.plan.name)

  const staffCount = await prisma.user.count({ where: { companyId } })
  if (staffCount >= limits.maxStaff) {
    throw new PlanEnforcementError(`Staff limit reached (${limits.maxStaff}). Upgrade your plan.`)
  }
}

export async function enforceCurrencyLimit(companyId: string, newCurrencies: string[]): Promise<void> {
  const sub = await getCompanySubscription(companyId)
  if (!sub) throw new PlanEnforcementError("No active subscription")

  const limits = getPlanLimits(sub.plan.name)

  if (newCurrencies.length > limits.maxCurrencies) {
    throw new PlanEnforcementError(`Currency limit reached (${limits.maxCurrencies}). Upgrade your plan.`)
  }
}

export async function enforceFeatureAccess(companyId: string, feature: keyof PlanFeatures): Promise<void> {
  const sub = await getCompanySubscription(companyId)
  if (!sub) throw new PlanEnforcementError("No active subscription")

  const features = getPlanFeatures(sub.plan.name)
  const allowed = features[feature]

  if (!allowed) {
    throw new PlanEnforcementError(`Feature "${feature}" is not available on your ${sub.plan.name} plan. Upgrade to access.`)
  }
}

export async function enforceApiAccess(companyId: string, requiredLevel: "basic" | "full"): Promise<void> {
  const sub = await getCompanySubscription(companyId)
  if (!sub) throw new PlanEnforcementError("No active subscription")

  const features = getPlanFeatures(sub.plan.name)

  const levels = { none: 0, basic: 1, full: 2 }
  if (levels[features.apiAccess] < levels[requiredLevel]) {
    throw new PlanEnforcementError("API access is not available on your current plan. Upgrade to access.")
  }
}
