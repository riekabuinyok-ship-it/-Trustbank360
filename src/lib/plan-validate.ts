import { prisma } from "./prisma"
import {
  getPlanByName,
  getLimit,
  getMonthlyTransferLimit,
  getUpgradeSuggestion,
  type LimitFeature,
  type PlanName,
} from "./plan-config"

type Resource = "branches" | "staff" | "currencies" | "transfers"

interface ValidationResponse {
  resource: Resource
  valid: boolean
  current: number
  limit: number | null
  remaining: number
  percentage: number
  isAtLimit: boolean
  message: string
  suggestedPlan: string | null
  suggestedPlanMessage: string | null
}

export async function buildValidation(
  companyId: string,
  resource: Resource,
  current: number
): Promise<ValidationResponse | null> {
  const sub = await prisma.subscription.findUnique({
    where: { companyId },
    select: { plan: { select: { name: true } } },
  })
  if (!sub) return null
  const planName = sub.plan.name
  const planDef = getPlanByName(planName)
  if (!planDef) return null

  let limit: number | null
  if (resource === "transfers") {
    limit = getMonthlyTransferLimit(planName)
  } else {
    const numeric = getLimit(planName, resource as LimitFeature)
    limit = numeric === Infinity ? null : numeric
  }

  const valid = limit === null ? true : current < limit
  const remaining = limit === null ? -1 : Math.max(0, limit - current)
  const percentage = limit === null ? 0 : Math.min(100, Math.round((current / limit) * 100))
  const isAtLimit = limit !== null && current >= limit

  const upgrade = getUpgradeSuggestion(planName as PlanName)

  const messages: Record<Resource, { ok: string; blocked: string }> = {
    branches: {
      ok: `You have ${current} of ${limit} branches.`,
      blocked: `You've reached the maximum of ${limit} branches on your ${planName} plan.`,
    },
    staff: {
      ok: `You have ${current} of ${limit} staff members.`,
      blocked: `You've reached the maximum of ${limit} staff members on your ${planName} plan.`,
    },
    currencies: {
      ok: `You have ${current} of ${limit} currencies.`,
      blocked: `You've reached the maximum of ${limit} currencies on your ${planName} plan.`,
    },
    transfers: {
      ok: `You have used ${current} of ${limit} transfers this month.`,
      blocked: `You've used all ${limit} of your monthly transfers on the ${planName} plan.`,
    },
  }

  return {
    resource,
    valid,
    current,
    limit,
    remaining,
    percentage,
    isAtLimit,
    message: valid ? messages[resource].ok : messages[resource].blocked,
    suggestedPlan: upgrade?.plan ?? null,
    suggestedPlanMessage: valid ? null : upgrade?.message ?? null,
  }
}
