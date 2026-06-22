export type PlanName = "Enterprise"

export type ApiAccessLevel = "none" | "basic" | "full"

export type FeatureName =
  | "branches"
  | "staff"
  | "currencies"
  | "transfers"
  | "auditLogs"
  | "apiAccess"
  | "customBranding"
  | "advancedAnalytics"
  | "customReports"
  | "dedicatedSupport"
  | "branchWallets"
  | "kycCompliance"
  | "advancedKycAml"
  | "customDomain"
  | "customIntegrations"
  | "dedicatedAccountManager"
  | "prioritySupport"

export interface PlanLimits {
  branches: number
  staff: number
  currencies: number
  monthlyTransferLimit: number | null
}

export interface PlanFeatures {
  auditLogs: boolean
  apiAccess: ApiAccessLevel
  customBranding: boolean
  advancedAnalytics: boolean
  customReports: boolean
  dedicatedSupport: boolean
  branchWallets: boolean
  kycCompliance: boolean
  advancedKycAml: boolean
  customDomain: boolean
  customIntegrations: boolean
  dedicatedAccountManager: boolean
  prioritySupport: boolean
}

export interface PlanDefinition {
  name: PlanName
  limits: PlanLimits
  features: PlanFeatures
  trialDays: number
  displayName: string
  monthlyPrice: number
  currency: string
  allowedCurrencies: string[]
}

export const ENTERPRISE_PLAN: PlanDefinition = {
  name: "Enterprise",
  displayName: "Enterprise",
  trialDays: 30,
  monthlyPrice: 60,
  currency: "USD",
  limits: { branches: Infinity, staff: Infinity, currencies: Infinity, monthlyTransferLimit: null },
  features: {
    auditLogs: true,
    apiAccess: "full",
    customBranding: true,
    advancedAnalytics: true,
    customReports: true,
    dedicatedSupport: true,
    branchWallets: true,
    kycCompliance: true,
    advancedKycAml: true,
    customDomain: true,
    customIntegrations: true,
    dedicatedAccountManager: true,
    prioritySupport: true,
  },
  allowedCurrencies: ["SSP", "USD", "KES", "UGX"],
}

export const PLANS: Record<PlanName, PlanDefinition> = {
  Enterprise: ENTERPRISE_PLAN,
}

export const DEFAULT_ALLOWED_CURRENCIES: readonly string[] = ["SSP", "USD", "KES", "UGX"] as const

export function getAllowedCurrencies(_planName?: string): string[] {
  return [...DEFAULT_ALLOWED_CURRENCIES]
}

export type LimitFeature = "branches" | "staff" | "currencies"
export type BooleanFeature =
  | "auditLogs"
  | "customBranding"
  | "advancedAnalytics"
  | "customReports"
  | "dedicatedSupport"
  | "branchWallets"
  | "kycCompliance"
  | "advancedKycAml"
  | "customDomain"
  | "customIntegrations"
  | "dedicatedAccountManager"
  | "prioritySupport"

export function isLimitFeature(f: FeatureName): f is LimitFeature {
  return f === "branches" || f === "staff" || f === "currencies"
}

export function isBooleanFeature(f: FeatureName): f is BooleanFeature {
  return !isLimitFeature(f) && f !== "apiAccess" && f !== "transfers"
}

export function getLimit(_planName: string, feature: LimitFeature): number {
  return Infinity
}

export function getMonthlyTransferLimit(_planName: string): number | null {
  return null
}

export function getFeature(_planName: string, feature: BooleanFeature): boolean {
  return true
}

export function getApiAccess(_planName: string): ApiAccessLevel {
  return "full"
}

export function getPlanByName(planName: string | null | undefined): PlanDefinition {
  if (planName && PLANS[planName as PlanName]) {
    return PLANS[planName as PlanName]
  }
  return ENTERPRISE_PLAN
}

export const UPGRADE_PATH: Record<PlanName, PlanName | null> = {
  Enterprise: null,
}

export function getUpgradeSuggestion(_planName: string): { plan: string; message: string } | null {
  return null
}

export const ERROR_CODES: Record<FeatureName, string> = {
  branches: "BRANCH_LIMIT_REACHED",
  staff: "STAFF_LIMIT_REACHED",
  currencies: "CURRENCY_LIMIT_REACHED",
  transfers: "MONTHLY_TRANSFER_LIMIT_REACHED",
  auditLogs: "AUDIT_LOGS_NOT_AVAILABLE",
  apiAccess: "API_ACCESS_NOT_AVAILABLE",
  customBranding: "CUSTOM_BRANDING_NOT_AVAILABLE",
  advancedAnalytics: "ANALYTICS_NOT_AVAILABLE",
  customReports: "CUSTOM_REPORTS_NOT_AVAILABLE",
  dedicatedSupport: "DEDICATED_SUPPORT_NOT_AVAILABLE",
  branchWallets: "BRANCH_WALLETS_NOT_AVAILABLE",
  kycCompliance: "KYC_COMPLIANCE_NOT_AVAILABLE",
  advancedKycAml: "ADVANCED_KYC_AML_NOT_AVAILABLE",
  customDomain: "CUSTOM_DOMAIN_NOT_AVAILABLE",
  customIntegrations: "CUSTOM_INTEGRATIONS_NOT_AVAILABLE",
  dedicatedAccountManager: "DEDICATED_ACCOUNT_MANAGER_NOT_AVAILABLE",
  prioritySupport: "PRIORITY_SUPPORT_NOT_AVAILABLE",
}
