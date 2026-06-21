export type PlanName = "Small Company" | "Medium Company" | "Enterprise"

export type ApiAccessLevel = "none" | "basic" | "full"

export type FeatureName =
  | "branches"
  | "staff"
  | "currencies"
  | "auditLogs"
  | "apiAccess"
  | "customBranding"
  | "advancedAnalytics"
  | "customReports"
  | "dedicatedSupport"

export interface PlanLimits {
  branches: number
  staff: number
  currencies: number
}

export interface PlanFeatures {
  auditLogs: boolean
  apiAccess: ApiAccessLevel
  customBranding: boolean
  advancedAnalytics: boolean
  customReports: boolean
  dedicatedSupport: boolean
}

export interface PlanDefinition {
  name: PlanName
  limits: PlanLimits
  features: PlanFeatures
  trialDays: number
  displayName: string
  allowedCurrencies: string[]
}

export const PLANS: Record<PlanName, PlanDefinition> = {
  "Small Company": {
    name: "Small Company",
    displayName: "Small Company",
    trialDays: 30,
    limits: { branches: 2, staff: 5, currencies: 2 },
    features: {
      auditLogs: false,
      apiAccess: "none",
      customBranding: false,
      advancedAnalytics: false,
      customReports: false,
      dedicatedSupport: false,
    },
    allowedCurrencies: ["SSP", "KES"],
  },
  "Medium Company": {
    name: "Medium Company",
    displayName: "Medium Company",
    trialDays: 60,
    limits: { branches: 10, staff: 25, currencies: 3 },
    features: {
      auditLogs: true,
      apiAccess: "basic",
      customBranding: true,
      advancedAnalytics: true,
      customReports: true,
      dedicatedSupport: false,
    },
    allowedCurrencies: ["SSP", "KES", "UGX"],
  },
  Enterprise: {
    name: "Enterprise",
    displayName: "Enterprise",
    trialDays: 90,
    limits: { branches: Infinity, staff: Infinity, currencies: Infinity },
    features: {
      auditLogs: true,
      apiAccess: "full",
      customBranding: true,
      advancedAnalytics: true,
      customReports: true,
      dedicatedSupport: true,
    },
    allowedCurrencies: ["SSP", "KES", "UGX", "EUR", "GBP", "AED", "USD"],
  },
}

export function getAllowedCurrencies(planName: string): string[] {
  const plan = getPlanByName(planName)
  return plan?.allowedCurrencies || ["SSP", "KES"]
}

export type LimitFeature = "branches" | "staff" | "currencies"
export type BooleanFeature = "auditLogs" | "customBranding" | "advancedAnalytics" | "customReports" | "dedicatedSupport"

export function isLimitFeature(f: FeatureName): f is LimitFeature {
  return f === "branches" || f === "staff" || f === "currencies"
}

export function isBooleanFeature(f: FeatureName): f is BooleanFeature {
  return !isLimitFeature(f) && f !== "apiAccess"
}

export function getLimit(planName: string, feature: LimitFeature): number {
  const p = PLANS[planName as PlanName]
  if (!p) return 0
  return p.limits[feature]
}

export function getFeature(planName: string, feature: BooleanFeature): boolean {
  const p = PLANS[planName as PlanName]
  if (!p) return false
  return p.features[feature]
}

export function getApiAccess(planName: string): ApiAccessLevel {
  const p = PLANS[planName as PlanName]
  if (!p) return "none"
  return p.features.apiAccess
}

export function getPlanByName(planName: string): PlanDefinition | undefined {
  return PLANS[planName as PlanName]
}

export const UPGRADE_PATH: Record<PlanName, PlanName | null> = {
  "Small Company": "Medium Company",
  "Medium Company": "Enterprise",
  Enterprise: null,
}

export function getUpgradeSuggestion(planName: string): { plan: string; message: string } | null {
  const next = UPGRADE_PATH[planName as PlanName]
  if (!next) return null
  const nextPlan = PLANS[next]
  return {
    plan: next,
    message: `Upgrade to ${nextPlan.displayName} to remove this limit.`,
  }
}

export const ERROR_CODES: Record<FeatureName, string> = {
  branches: "BRANCH_LIMIT_REACHED",
  staff: "STAFF_LIMIT_REACHED",
  currencies: "CURRENCY_LIMIT_REACHED",
  auditLogs: "AUDIT_LOGS_NOT_AVAILABLE",
  apiAccess: "API_ACCESS_NOT_AVAILABLE",
  customBranding: "CUSTOM_BRANDING_NOT_AVAILABLE",
  advancedAnalytics: "ANALYTICS_NOT_AVAILABLE",
  customReports: "CUSTOM_REPORTS_NOT_AVAILABLE",
  dedicatedSupport: "DEDICATED_SUPPORT_NOT_AVAILABLE",
}
