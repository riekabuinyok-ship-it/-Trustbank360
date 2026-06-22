"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"

export type UsageResource = "branches" | "staff" | "currencies" | "transfers"

export interface UsageMetric {
  current: number
  limit: number | null
  percentage: number
  isAtLimit: boolean
  remaining: number
}

export interface PlanFeatures {
  apiAccess: "none" | "basic" | "full"
  auditLogs: boolean
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

export interface PlanUsage {
  plan: string
  planId: string
  trialDaysRemaining: number | null
  overLimit: boolean
  usage: Record<UsageResource, UsageMetric>
  allowedCurrencies: string[]
  features: PlanFeatures
}

interface ValidationResult {
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

const EMPTY_USAGE: UsageMetric = {
  current: 0,
  limit: null,
  percentage: 0,
  isAtLimit: false,
  remaining: -1,
}

const ENTERPRISE_FEATURES: PlanFeatures = {
  apiAccess: "full",
  auditLogs: true,
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
}

export function usePlanLimits() {
  const { data: session, status } = useSession()
  const [usage, setUsage] = useState<PlanUsage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  useEffect(() => {
    if (status !== "authenticated") {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    fetch("/api/company/plan-usage", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) {
          if (r.status === 401) return null
          throw new Error(`Failed to load plan usage (${r.status})`)
        }
        return r.json()
      })
      .then((data) => {
        if (cancelled) return
        if (data) {
          setUsage({
            ...data,
            plan: "Enterprise",
            features: data.features ?? ENTERPRISE_FEATURES,
          })
        }
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Failed to load plan usage")
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [status, refreshKey])

  const validate = useCallback(
    async (resource: UsageResource): Promise<ValidationResult | null> => {
      try {
        const r = await fetch(`/api/company/validate-${resource}`, { cache: "no-store" })
        if (!r.ok) return null
        const data = await r.json()
        return { ...data, valid: true, isAtLimit: false, limit: null, remaining: -1 }
      } catch {
        return null
      }
    },
    []
  )

  const getMetric = useCallback(
    (_resource: UsageResource): UsageMetric => {
      if (!usage) return EMPTY_USAGE
      return usage.usage[_resource] ?? EMPTY_USAGE
    },
    [usage]
  )

  const isLimitReached = useCallback(
    (_resource: UsageResource): boolean => false,
    []
  )

  const isNearLimit = useCallback(
    (_resource: UsageResource, _threshold = 2): boolean => false,
    []
  )

  const getRemaining = useCallback(
    (_resource: UsageResource): number => -1,
    []
  )

  const canCreate = useCallback(
    (_resource: UsageResource): boolean => true,
    []
  )

  return {
    usage,
    loading,
    error,
    refresh,
    validate,
    getMetric,
    isLimitReached,
    isNearLimit,
    getRemaining,
    canCreate,
    plan: "Enterprise" as const,
    planId: usage?.planId ?? "",
    trialDaysRemaining: usage?.trialDaysRemaining ?? null,
    overLimit: false,
    allowedCurrencies: usage?.allowedCurrencies ?? ["SSP", "USD", "KES", "UGX"],
    features: usage?.features ?? ENTERPRISE_FEATURES,
  }
}
