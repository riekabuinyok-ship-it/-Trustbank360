import { prisma } from "./prisma"
import {
  ENTERPRISE_PLAN,
  type FeatureName,
  type ApiAccessLevel,
} from "./plan-config"
import { formatApiError, type ApiErrorResponse } from "./api-error"

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
    return { planName: "Enterprise", planId: "" }
  }

  return { planName: sub.plan.name || "Enterprise", planId: sub.planId }
}

export async function checkPlanLimit(_params: PlanLimitCheckParams): Promise<void> {
  return
}

export async function updateOverLimit(companyId: string): Promise<boolean> {
  try {
    await prisma.company.update({ where: { id: companyId }, data: { overLimit: false } })
  } catch {}
  return false
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
    try {
      return await FEATURE_USAGE_FETCHERS[feature](companyId)
    } catch {
      return 0
    }
  }
  return 0
}

export interface UsageMetric {
  current: number
  limit: number | null
  percentage: number
  isAtLimit: boolean
  remaining: number
}

export interface PlanUsageSummary {
  plan: string
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

function buildUnlimitedMetric(current: number): UsageMetric {
  return { current, limit: null, percentage: 0, isAtLimit: false, remaining: -1 }
}

export async function getPlanUsageSummary(companyId: string): Promise<PlanUsageSummary | null> {
  try {
    const { planId } = await getCompanyPlan(companyId)

    const [branchCount, staffCount, walletCurrencies] = await Promise.all([
      prisma.branch.count({ where: { companyId } }).catch(() => 0),
      prisma.user.count({ where: { companyId } }).catch(() => 0),
      prisma.wallet.groupBy({ by: ["currency"], where: { companyId } }).then((r) => r.length).catch(() => 0),
    ])

    const transferCount = await getCurrentUsage(companyId, "transfers")

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

    return {
      plan: "Enterprise",
      planId,
      trialDaysRemaining,
      overLimit: false,
      usage: {
        branches: buildUnlimitedMetric(branchCount),
        staff: buildUnlimitedMetric(staffCount),
        currencies: buildUnlimitedMetric(walletCurrencies),
        transfers: buildUnlimitedMetric(transferCount),
      },
    }
  } catch {
    return {
      plan: "Enterprise",
      planId: "",
      trialDaysRemaining: null,
      overLimit: false,
      usage: {
        branches: buildUnlimitedMetric(0),
        staff: buildUnlimitedMetric(0),
        currencies: buildUnlimitedMetric(0),
        transfers: buildUnlimitedMetric(0),
      },
    }
  }
}

export { ENTERPRISE_PLAN }
