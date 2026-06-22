export interface ApiErrorResponse {
  success: false
  errorCode: string
  title: string
  message: string
  error: string
  usage?: { used: number; limit: number }
  plan?: string
  upgradeRequired: boolean
  suggestedPlan?: string | null
}

export interface ApiSuccessResponse<T = any> {
  success: true
  data: T
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse

export const ERROR_TITLES: Record<string, string> = {
  BRANCH_LIMIT_REACHED: "Branch limit reached",
  STAFF_LIMIT_REACHED: "Staff limit reached",
  CURRENCY_LIMIT_REACHED: "Currency limit reached",
  MONTHLY_TRANSFER_LIMIT_REACHED: "Monthly transfer limit reached",
  FEATURE_NOT_AVAILABLE: "Feature not available",
  AUDIT_LOGS_NOT_AVAILABLE: "Audit logs not available",
  API_ACCESS_NOT_AVAILABLE: "API access not available",
  CUSTOM_BRANDING_NOT_AVAILABLE: "Custom branding not available",
  ANALYTICS_NOT_AVAILABLE: "Analytics not available",
  CUSTOM_REPORTS_NOT_AVAILABLE: "Custom reports not available",
  DEDICATED_SUPPORT_NOT_AVAILABLE: "Dedicated support not available",
  BRANCH_WALLETS_NOT_AVAILABLE: "Branch wallets not available",
  KYC_COMPLIANCE_NOT_AVAILABLE: "KYC & compliance not available",
  ADVANCED_KYC_AML_NOT_AVAILABLE: "Advanced KYC/AML not available",
  CUSTOM_DOMAIN_NOT_AVAILABLE: "Custom domain not available",
  CUSTOM_INTEGRATIONS_NOT_AVAILABLE: "Custom integrations not available",
  DEDICATED_ACCOUNT_MANAGER_NOT_AVAILABLE: "Dedicated account manager not available",
  PRIORITY_SUPPORT_NOT_AVAILABLE: "Priority support not available",
  COMPANY_OVER_LIMIT: "Plan limits exceeded",
  NO_SUBSCRIPTION: "No active subscription",
  UNKNOWN_PLAN: "Unknown plan",
}

export const ERROR_MESSAGES: Record<string, (...args: any[]) => string> = {
  BRANCH_LIMIT_REACHED: () =>
    "Your Enterprise plan includes unlimited branches.",
  STAFF_LIMIT_REACHED: () =>
    "Your Enterprise plan includes unlimited staff.",
  CURRENCY_LIMIT_REACHED: () =>
    "Your Enterprise plan includes unlimited currencies.",
  MONTHLY_TRANSFER_LIMIT_REACHED: () =>
    "Your Enterprise plan includes unlimited transfers.",
  FEATURE_NOT_AVAILABLE: (_plan, _used, _limit, feature) =>
    `All features are included on the Enterprise plan. (${feature || "This feature"} is available.)`,
  AUDIT_LOGS_NOT_AVAILABLE: () =>
    "Audit logs are included on the Enterprise plan.",
  API_ACCESS_NOT_AVAILABLE: () =>
    "Full API access is included on the Enterprise plan.",
  CUSTOM_BRANDING_NOT_AVAILABLE: () =>
    "Custom branding is included on the Enterprise plan.",
  BRANCH_WALLETS_NOT_AVAILABLE: () =>
    "Branch wallets are included on the Enterprise plan.",
  KYC_COMPLIANCE_NOT_AVAILABLE: () =>
    "KYC & compliance features are included on the Enterprise plan.",
  ADVANCED_KYC_AML_NOT_AVAILABLE: () =>
    "Advanced KYC/AML is included on the Enterprise plan.",
  CUSTOM_DOMAIN_NOT_AVAILABLE: () =>
    "Custom domain is included on the Enterprise plan.",
  CUSTOM_INTEGRATIONS_NOT_AVAILABLE: () =>
    "Custom integrations are included on the Enterprise plan.",
  DEDICATED_ACCOUNT_MANAGER_NOT_AVAILABLE: () =>
    "A dedicated account manager is included on the Enterprise plan.",
  PRIORITY_SUPPORT_NOT_AVAILABLE: () =>
    "Priority support is included on the Enterprise plan.",
  COMPANY_OVER_LIMIT: () =>
    "All Enterprise resources are unlimited.",
  NO_SUBSCRIPTION: () =>
    "Your company does not have an active subscription. Please contact support.",
  UNKNOWN_PLAN: (plan) =>
    `Plan "${plan || "Unknown"}" is not recognized. Defaulting to Enterprise.`,
}

export function formatApiError(
  errorCode: string,
  overrides?: {
    title?: string
    message?: string
    usage?: { used: number; limit: number }
    plan?: string
    upgradeRequired?: boolean
    suggestedPlan?: string | null
  }
): ApiErrorResponse {
  const title = overrides?.title || ERROR_TITLES[errorCode] || "Error"
  const msgFn = ERROR_MESSAGES[errorCode]
  const message = overrides?.message || (msgFn ? msgFn(overrides?.plan, overrides?.usage?.used, overrides?.usage?.limit) : "An unexpected error occurred. Please try again.")

  return {
    success: false,
    errorCode,
    title,
    message,
    error: message,
    usage: overrides?.usage,
    plan: overrides?.plan,
    upgradeRequired: overrides?.upgradeRequired ?? true,
    suggestedPlan: overrides?.suggestedPlan ?? null,
  }
}

export function formatPlanError(
  errorCode: string,
  planName: string,
  used: number,
  limit: number | string,
  feature?: string
): ApiErrorResponse {
  const title = ERROR_TITLES[errorCode] || "Plan limit reached"
  const msgFn = ERROR_MESSAGES[errorCode]

  let message: string
  if (msgFn) {
    message = msgFn(planName, used, typeof limit === "number" ? limit : undefined, feature)
  } else {
    const limitStr = typeof limit === "number" ? `${used}/${limit}` : limit
    message = `You've reached the limit for your ${planName} plan (${limitStr}). Upgrade to continue.`
  }

  return {
    success: false,
    errorCode,
    title,
    message,
    error: message,
    usage: typeof limit === "number" ? { used, limit } : undefined,
    plan: planName,
    upgradeRequired: true,
    suggestedPlan: planName === "Small Company" ? "Medium Company" : planName === "Medium Company" ? "Enterprise" : null,
  }
}

export function generateUpgradeMessage(suggestedPlan: string | null): string {
  if (!suggestedPlan) return ""
  return `Upgrade to ${suggestedPlan} to unlock this feature.`
}
