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
        if (data) setUsage(data)
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
        return r.json()
      } catch {
        return null
      }
    },
    []
  )

  const getMetric = useCallback(
    (resource: UsageResource): UsageMetric => {
      if (!usage) return EMPTY_USAGE
      return usage.usage[resource] ?? EMPTY_USAGE
    },
    [usage]
  )

  const isLimitReached = useCallback(
    (resource: UsageResource): boolean => {
      return getMetric(resource).isAtLimit
    },
    [getMetric]
  )

  const isNearLimit = useCallback(
    (resource: UsageResource, threshold = 2): boolean => {
      const m = getMetric(resource)
      if (m.limit === null) return false
      return m.remaining > 0 && m.remaining <= threshold
    },
    [getMetric]
  )

  const getRemaining = useCallback(
    (resource: UsageResource): number => {
      return getMetric(resource).remaining
    },
    [getMetric]
  )

  const canCreate = useCallback(
    (resource: UsageResource): boolean => {
      if (!usage) return false
      return !isLimitReached(resource)
    },
    [usage, isLimitReached]
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
    plan: usage?.plan ?? null,
    planId: usage?.planId ?? null,
    trialDaysRemaining: usage?.trialDaysRemaining ?? null,
    overLimit: usage?.overLimit ?? false,
    allowedCurrencies: usage?.allowedCurrencies ?? [],
    features: usage?.features ?? null,
  }
}
