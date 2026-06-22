import { prisma } from "./prisma"
import {
  getPlanByName,
  getLimit,
  getFeature,
  getApiAccess,
  getMonthlyTransferLimit,
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

function hashStringToInt(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) % 2147483647
}

export async function withPlanLimitLock<T>(
  companyId: string,
  fn: (tx: import("@prisma/client").Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    const lockId = hashStringToInt(companyId)
    await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${lockId})`)
    return fn(tx)
  })
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

    case "transfers": {
      const limit = getMonthlyTransferLimit(planName)
      if (limit === null) return
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)
      const count = params.currentUsage ?? (await prisma.transfer.count({
        where: { companyId, createdAt: { gte: startOfMonth } },
      }))
      if (count >= limit) {
        throw new PlanEnforcementError(
          formatApiError("MONTHLY_TRANSFER_LIMIT_REACHED", {
            plan: planName,
            usage: { used: count, limit },
            upgradeRequired: true,
            suggestedPlan: "Medium Company",
          })
        )
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

    case "branchWallets": {
      const allowed = getFeature(planName, "branchWallets")
      if (!allowed) {
        throw new PlanEnforcementError(formatApiError("BRANCH_WALLETS_NOT_AVAILABLE", {
          plan: planName,
          upgradeRequired: true,
          suggestedPlan: "Medium Company",
        }))
      }
      return
    }

    case "kycCompliance": {
      const allowed = getFeature(planName, "kycCompliance")
      if (!allowed) {
        throw new PlanEnforcementError(formatApiError("KYC_COMPLIANCE_NOT_AVAILABLE", {
          plan: planName,
          upgradeRequired: true,
          suggestedPlan: "Medium Company",
        }))
      }
      return
    }

    case "advancedKycAml": {
      const allowed = getFeature(planName, "advancedKycAml")
      if (!allowed) {
        throw new PlanEnforcementError(formatApiError("ADVANCED_KYC_AML_NOT_AVAILABLE", {
          plan: planName,
          upgradeRequired: true,
          suggestedPlan: "Enterprise",
        }))
      }
      return
    }

    case "customDomain": {
      const allowed = getFeature(planName, "customDomain")
      if (!allowed) {
        throw new PlanEnforcementError(formatApiError("CUSTOM_DOMAIN_NOT_AVAILABLE", {
          plan: planName,
          upgradeRequired: true,
          suggestedPlan: "Enterprise",
        }))
      }
      return
    }

    case "customIntegrations": {
      const allowed = getFeature(planName, "customIntegrations")
      if (!allowed) {
        throw new PlanEnforcementError(formatApiError("CUSTOM_INTEGRATIONS_NOT_AVAILABLE", {
          plan: planName,
          upgradeRequired: true,
          suggestedPlan: "Enterprise",
        }))
      }
      return
    }

    case "dedicatedAccountManager": {
      const allowed = getFeature(planName, "dedicatedAccountManager")
      if (!allowed) {
        throw new PlanEnforcementError(formatApiError("DEDICATED_ACCOUNT_MANAGER_NOT_AVAILABLE", {
          plan: planName,
          upgradeRequired: true,
          suggestedPlan: "Enterprise",
        }))
      }
      return
    }

    case "prioritySupport": {
      const allowed = getFeature(planName, "prioritySupport")
      if (!allowed) {
        throw new PlanEnforcementError(formatApiError("PRIORITY_SUPPORT_NOT_AVAILABLE", {
          plan: planName,
          upgradeRequired: true,
          suggestedPlan: "Enterprise",
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
  currencies: async (cid) => {
    const wc = await prisma.wallet.groupBy({ by: ["currency"], where: { companyId: cid } })
    return wc.length
  },
  transfers: async (cid) => {
    const start = new Date()
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
    return prisma.transfer.count({ where: { companyId: cid, createdAt: { gte: start } } })
  },
}

export async function getCurrentUsage(companyId: string, feature: FeatureName): Promise<number> {
  if (feature in FEATURE_USAGE_FETCHERS) {
    return FEATURE_USAGE_FETCHERS[feature](companyId)
  }
  return 0
}

export interface PlanUsageSummary {
  plan: PlanName
  planId: string
  trialDaysRemaining: number | null
  overLimit: boolean
  usage: {
    branches: UsageMetric
    staff: UsageMetric
    currencies: UsageMetric
    transfers: UsageMetric
  }
}

export interface UsageMetric {
  current: number
  limit: number | null
  percentage: number
  isAtLimit: boolean
  remaining: number
}

export async function getPlanUsageSummary(companyId: string): Promise<PlanUsageSummary | null> {
  try {
    const { planName, planId } = await getCompanyPlan(companyId)
    const planDef = getPlanByName(planName)
    if (!planDef) return null

    const [branchCount, staffCount, walletCurrencies, monthStart] = await Promise.all([
      prisma.branch.count({ where: { companyId } }),
      prisma.user.count({ where: { companyId } }),
      prisma.wallet.groupBy({ by: ["currency"], where: { companyId } }),
      (() => {
        const d = new Date()
        d.setDate(1)
        d.setHours(0, 0, 0, 0)
        return d
      })(),
    ])

    const transferCount = await prisma.transfer.count({
      where: { companyId, createdAt: { gte: monthStart } },
    })

    const branchLimit = getLimit(planName, "branches")
    const staffLimit = getLimit(planName, "staff")
    const currencyLimit = getLimit(planName, "currencies")
    const transferLimit = getMonthlyTransferLimit(planName)

    const buildMetric = (current: number, limit: number | null): UsageMetric => {
      if (limit === null) {
        return { current, limit: null, percentage: 0, isAtLimit: false, remaining: -1 }
      }
      const remaining = Math.max(0, limit - current)
      return {
        current,
        limit,
        percentage: Math.min(100, Math.round((current / limit) * 100)),
        isAtLimit: current >= limit,
        remaining,
      }
    }

    let trialDaysRemaining: number | null = null
    try {
      const sub = await prisma.subscription.findUnique({
        where: { companyId },
        select: { trialEndsAt: true, status: true },
      })
      if (sub?.trialEndsAt && sub.status === "TRIALING") {
        const ms = sub.trialEndsAt.getTime() - Date.now()
        trialDaysRemaining = Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)))
      }
    } catch {}

    let overLimit = false
    try {
      const c = await prisma.company.findUnique({ where: { id: companyId }, select: { overLimit: true } })
      overLimit = c?.overLimit ?? false
    } catch {}

    return {
      plan: planName as PlanName,
      planId,
      trialDaysRemaining,
      overLimit,
      usage: {
        branches: buildMetric(branchCount, branchLimit === Infinity ? null : branchLimit),
        staff: buildMetric(staffCount, staffLimit === Infinity ? null : staffLimit),
        currencies: buildMetric(walletCurrencies.length, currencyLimit === Infinity ? null : currencyLimit),
        transfers: buildMetric(transferCount, transferLimit),
      },
    }
  } catch {
    return null
  }
}
