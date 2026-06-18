import { prisma } from "./prisma"
import {
  getPlanByName,
  getLimit,
  getFeature,
  getApiAccess,
  ERROR_CODES,
  type FeatureName,
  type BooleanFeature,
  type ApiAccessLevel,
  type PlanName,
} from "./plan-config"
import { formatPlanError, formatApiError, type ApiErrorResponse } from "./api-error"

export interface PlanLimitCheckParams {
  companyId: string
  feature: FeatureName
  currentUsage?: number
  requiredApiLevel?: ApiAccessLevel
}

export class PlanEnforcementError extends Error {
  public readonly apiError: ApiErrorResponse

  constructor(error: ApiErrorResponse) {
    super(error.message)
    this.name = "PlanEnforcementError"
    this.apiError = error
  }

  toJSON(): ApiErrorResponse {
    return this.apiError
  }
}

async function getCompanyPlan(companyId: string): Promise<{ planName: string; planId: string }> {
  const sub = await prisma.subscription.findUnique({
    where: { companyId },
    select: { plan: { select: { name: true } }, planId: true },
  })

  if (!sub) {
    throw new PlanEnforcementError(formatApiError("NO_SUBSCRIPTION"))
  }

  const planDef = getPlanByName(sub.plan.name)
  if (!planDef) {
    throw new PlanEnforcementError(formatApiError("UNKNOWN_PLAN", { plan: sub.plan.name }))
  }

  return { planName: sub.plan.name, planId: sub.planId }
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
        throw new PlanEnforcementError(formatPlanError("BRANCH_LIMIT_REACHED", planName, count, limit))
      }
      return
    }

    case "staff": {
      const limit = getLimit(planName, "staff")
      if (limit === Infinity) return
      const count = params.currentUsage ?? (await prisma.user.count({ where: { companyId } }))
      if (count >= limit) {
        throw new PlanEnforcementError(formatPlanError("STAFF_LIMIT_REACHED", planName, count, limit))
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
      if (count >= limit) {
        throw new PlanEnforcementError(formatPlanError("CURRENCY_LIMIT_REACHED", planName, count, limit))
      }
      return
    }

    case "auditLogs": {
      const allowed = getFeature(planName, "auditLogs")
      if (!allowed) {
        throw new PlanEnforcementError(formatApiError("AUDIT_LOGS_NOT_AVAILABLE", {
          plan: planName,
          upgradeRequired: true,
          suggestedPlan: "Medium Company",
        }))
      }
      return
    }

    case "customBranding": {
      const allowed = getFeature(planName, "customBranding")
      if (!allowed) {
        throw new PlanEnforcementError(formatApiError("CUSTOM_BRANDING_NOT_AVAILABLE", {
          plan: planName,
          upgradeRequired: true,
          suggestedPlan: "Medium Company",
        }))
      }
      return
    }

    case "advancedAnalytics":
    case "customReports":
    case "dedicatedSupport": {
      const allowed = getFeature(planName, feature as BooleanFeature)
      if (!allowed) {
        const code = feature === "advancedAnalytics" ? "ANALYTICS_NOT_AVAILABLE"
          : feature === "customReports" ? "CUSTOM_REPORTS_NOT_AVAILABLE"
          : "DEDICATED_SUPPORT_NOT_AVAILABLE"
        throw new PlanEnforcementError(formatApiError(code, {
          plan: planName,
          upgradeRequired: true,
          suggestedPlan: feature === "dedicatedSupport" ? "Enterprise" : "Medium Company",
        }))
      }
      return
    }

    case "apiAccess": {
      const required = params.requiredApiLevel || "basic"
      const current = getApiAccess(planName)
      const levels: Record<ApiAccessLevel, number> = { none: 0, basic: 1, full: 2 }
      if (levels[current] < levels[required]) {
        throw new PlanEnforcementError(formatApiError("API_ACCESS_NOT_AVAILABLE", {
          plan: planName,
          upgradeRequired: true,
          suggestedPlan: required === "full" ? "Enterprise" : "Medium Company",
        }))
      }
      return
    }
  }
}

export async function updateOverLimit(companyId: string): Promise<boolean> {
  try {
    const { planName } = await getCompanyPlan(companyId)
    const branchCount = await prisma.branch.count({ where: { companyId } })
    const staffCount = await prisma.user.count({ where: { companyId } })
    const walletCurrencies = await prisma.wallet.groupBy({
      by: ["currency"], where: { companyId },
    })
    const currencyCount = walletCurrencies.length

    const branchLimit = getLimit(planName, "branches")
    const staffLimit = getLimit(planName, "staff")
    const currencyLimit = getLimit(planName, "currencies")

    const over =
      (branchLimit !== Infinity && branchCount > branchLimit) ||
      (staffLimit !== Infinity && staffCount > staffLimit) ||
      (currencyLimit !== Infinity && currencyCount > currencyLimit)

    await prisma.company.update({ where: { id: companyId }, data: { overLimit: over } })
    return over
  } catch {
    return false
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
