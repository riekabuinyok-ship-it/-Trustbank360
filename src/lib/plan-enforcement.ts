import { prisma } from "./prisma"
import {
  getPlanByName,
  getLimit,
  getFeature,
  getApiAccess,
  getUpgradeSuggestion,
  ERROR_CODES,
  UPGRADE_PATH,
  type FeatureName,
  type LimitFeature,
  type BooleanFeature,
  type ApiAccessLevel,
  type PlanName,
} from "./plan-config"

export interface PlanLimitCheckParams {
  companyId: string
  feature: FeatureName
  currentUsage?: number
  requiredApiLevel?: ApiAccessLevel
}

export interface PlanLimitError {
  success: false
  errorCode: string
  message: string
  usage: number
  limit: number | string
  plan: string
  upgradeRequired: true
  suggestedPlan: string | null
}

export class PlanEnforcementError extends Error {
  public readonly errorCode: string
  public readonly usage: number
  public readonly limit: number | string
  public readonly planName: string
  public readonly upgradeRequired: true
  public readonly suggestedPlan: string | null

  constructor(error: PlanLimitError) {
    super(error.message)
    this.name = "PlanEnforcementError"
    this.errorCode = error.errorCode
    this.usage = error.usage
    this.limit = error.limit
    this.planName = error.plan
    this.upgradeRequired = true
    this.suggestedPlan = error.suggestedPlan
  }

  toJSON(): PlanLimitError {
    return {
      success: false,
      errorCode: this.errorCode,
      message: this.message,
      usage: this.usage,
      limit: this.limit,
      plan: this.planName,
      upgradeRequired: true,
      suggestedPlan: this.suggestedPlan,
    }
  }
}

async function getCompanyPlan(companyId: string): Promise<{ planName: string; planId: string }> {
  const sub = await prisma.subscription.findUnique({
    where: { companyId },
    select: { plan: { select: { name: true } }, planId: true },
  })

  if (!sub) {
    throw new PlanEnforcementError({
      success: false,
      errorCode: "NO_SUBSCRIPTION",
      message: "Your company does not have an active subscription. Please subscribe to a plan.",
      usage: 0,
      limit: "N/A",
      plan: "None",
      upgradeRequired: true,
      suggestedPlan: "Small Company",
    })
  }

  const planDef = getPlanByName(sub.plan.name)
  if (!planDef) {
    throw new PlanEnforcementError({
      success: false,
      errorCode: "UNKNOWN_PLAN",
      message: `Your current plan "${sub.plan.name}" is not recognized. Please contact support.`,
      usage: 0,
      limit: "N/A",
      plan: sub.plan.name,
      upgradeRequired: true,
      suggestedPlan: "Small Company",
    })
  }

  return { planName: sub.plan.name, planId: sub.planId }
}

function makeError(params: {
  feature: FeatureName
  planName: string
  usage: number
  limit: number | string
  customMessage?: string
}): PlanLimitError {
  const upgrade = getUpgradeSuggestion(params.planName)
  const nextPlan = UPGRADE_PATH[params.planName as PlanName]
  const nextPlanName = nextPlan || "Enterprise"

  const message =
    params.customMessage ||
    (typeof params.limit === "number"
      ? `You have reached the ${params.feature} limit for your ${params.planName} plan (${params.usage}/${params.limit}). ${upgrade?.message || ""}`
      : `${params.feature} is not available on your ${params.planName} plan. ${upgrade?.message || ""}`)

  return {
    success: false,
    errorCode: ERROR_CODES[params.feature],
    message: message.trim(),
    usage: params.usage,
    limit: params.limit,
    plan: params.planName,
    upgradeRequired: true,
    suggestedPlan: nextPlanName,
  }
}

export async function checkPlanLimit(params: PlanLimitCheckParams): Promise<void> {
  const { companyId, feature } = params
  const { planName } = await getCompanyPlan(companyId)

  switch (feature) {
    case "branches": {
      const limit = getLimit(planName, "branches")
      if (limit === Infinity) return
      const count = params.currentUsage ?? (await prisma.branch.count({ where: { companyId } }))
      if (count >= limit) {
        throw new PlanEnforcementError(makeError({ feature, planName, usage: count, limit }))
      }
      return
    }

    case "staff": {
      const limit = getLimit(planName, "staff")
      if (limit === Infinity) return
      const count = params.currentUsage ?? (await prisma.user.count({ where: { companyId } }))
      if (count >= limit) {
        throw new PlanEnforcementError(makeError({ feature, planName, usage: count, limit }))
      }
      return
    }

    case "currencies": {
      const limit = getLimit(planName, "currencies")
      if (limit === Infinity) return
      const walletCurrencies = await prisma.wallet.groupBy({
        by: ["currency"],
        where: { companyId },
      })
      const count = walletCurrencies.length
      if (count >= limit && !params.currentUsage) {
        throw new PlanEnforcementError(makeError({ feature, planName, usage: count, limit }))
      }
      return
    }

    case "auditLogs":
    case "customBranding":
    case "advancedAnalytics":
    case "customReports":
    case "dedicatedSupport": {
      const allowed = getFeature(planName, feature as BooleanFeature)
      if (!allowed) {
        throw new PlanEnforcementError(makeError({ feature, planName, usage: 0, limit: "Not included" }))
      }
      return
    }

    case "apiAccess": {
      const required = params.requiredApiLevel || "basic"
      const current = getApiAccess(planName)
      const levels: Record<ApiAccessLevel, number> = { none: 0, basic: 1, full: 2 }
      if (levels[current] < levels[required]) {
        throw new PlanEnforcementError(
          makeError({ feature, planName, usage: levels[current], limit: levels[required], customMessage: `API access is not available on your ${planName} plan. Upgrade to ${required === "full" ? "Enterprise" : "Medium Company or higher"} for API access.` })
        )
      }
      return
    }
  }
}

const FEATURE_USAGE_FETCHERS: Record<string, (companyId: string) => Promise<number>> = {
  branches: (cid) => prisma.branch.count({ where: { companyId: cid } }),
  staff: (cid) => prisma.user.count({ where: { companyId: cid } }),
}

export async function getCurrentUsage(companyId: string, feature: FeatureName): Promise<number> {
  if (feature in FEATURE_USAGE_FETCHERS) {
    return FEATURE_USAGE_FETCHERS[feature](companyId)
  }
  if (feature === "currencies") {
    const walletCurrencies = await prisma.wallet.groupBy({
      by: ["currency"],
      where: { companyId },
    })
    return walletCurrencies.length
  }
  return 0
}

export async function enforcePlanOrThrow(params: PlanLimitCheckParams): Promise<void> {
  await checkPlanLimit(params)
}
