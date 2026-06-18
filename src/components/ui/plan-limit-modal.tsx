"use client"

import { X, ArrowUpCircle, CreditCard, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface PlanLimitErrorData {
  success: false
  errorCode: string
  title: string
  message: string
  usage?: { used: number; limit: number }
  plan?: string
  upgradeRequired: boolean
  suggestedPlan?: string | null
}

interface PlanLimitModalProps {
  error: PlanLimitErrorData | null
  onClose: () => void
}

export default function PlanLimitModal({ error, onClose }: PlanLimitModalProps) {
  if (!error) return null

  const usagePercent = error.usage
    ? Math.round((error.usage.used / error.usage.limit) * 100)
    : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="relative max-w-md w-full bg-white dark:bg-surface-900 shadow-2xl border-red-200 dark:border-red-900 overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-surface-900 dark:text-white">{error.title}</h3>
              <p className="text-xs text-muted-foreground">{error.errorCode.replace(/_/g, " ")}</p>
            </div>
          </div>

          <p className="text-sm text-surface-700 dark:text-surface-300 mb-4">{error.message}</p>

          {error.usage && (
            <div className="mb-4 p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">Current usage</span>
                <span className="text-xs font-bold text-surface-900 dark:text-white">
                  {error.usage.used} / {error.usage.limit}
                </span>
              </div>
              <div className="h-2 rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-red-500 transition-all"
                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {usagePercent >= 100
                  ? "You've reached your limit."
                  : `${100 - usagePercent}% remaining.`}
              </p>
            </div>
          )}

          {error.plan && (
            <div className="mb-4 p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
              <p className="text-xs font-medium text-primary-700 dark:text-primary-300">Current plan</p>
              <p className="text-sm font-bold text-primary-800 dark:text-primary-200">{error.plan}</p>
              {error.suggestedPlan && (
                <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">
                  Suggested: <span className="font-semibold">{error.suggestedPlan}</span>
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            {error.suggestedPlan && (
              <Button
                className="w-full gap-2"
                onClick={() => window.location.href = "/company/billing"}
              >
                <ArrowUpCircle className="h-4 w-4" />
                Upgrade to {error.suggestedPlan}
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => window.location.href = "/pricing"}
            >
              <CreditCard className="h-4 w-4" />
              View Plans & Pricing
            </Button>
            <Button variant="ghost" className="w-full text-xs" onClick={onClose}>
              Dismiss
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
