"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building2, Users, Coins, Send, AlertCircle, AlertTriangle, CheckCircle2, Infinity as InfinityIcon } from "lucide-react"
import { usePlanLimits, type UsageResource } from "@/hooks/usePlanLimits"
import { cn } from "@/lib/utils"

interface PlanUsageDashboardProps {
  variant?: "full" | "compact"
  className?: string
}

interface ResourceCardProps {
  resource: UsageResource
  title: string
  icon: React.ReactNode
  metric: { current: number; limit: number | null; percentage: number; isAtLimit: boolean; remaining: number }
  isNearLimit: boolean
  onUpgradeHref: string
}

function ResourceCard({ title, icon, metric, isNearLimit, isAtLimit, onUpgradeHref }: ResourceCardProps & { isAtLimit: boolean }) {
  const unlimited = metric.limit === null
  const tone = isAtLimit
    ? "border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-900"
    : isNearLimit
      ? "border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900"
      : "border-border"

  const barColor = isAtLimit
    ? "bg-red-500"
    : isNearLimit
      ? "bg-yellow-500"
      : "bg-secondary"

  const iconColor = isAtLimit
    ? "text-red-500"
    : isNearLimit
      ? "text-yellow-500"
      : "text-green-500"

  const StatusIcon = isAtLimit
    ? AlertCircle
    : isNearLimit
      ? AlertTriangle
      : CheckCircle2

  return (
    <Card className={cn("transition-colors", tone)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={cn("p-1.5 rounded-md bg-surface-100 dark:bg-surface-800", iconColor)}>
              {icon}
            </div>
            <span className="font-medium text-sm">{title}</span>
          </div>
          <StatusIcon className={cn("h-4 w-4", iconColor)} />
        </div>

        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-2xl font-bold">{metric.current.toLocaleString()}</span>
          {unlimited ? (
            <span className="text-muted-foreground text-sm flex items-center gap-1">
              <InfinityIcon className="h-3.5 w-3.5" />
            </span>
          ) : (
            <span className="text-muted-foreground text-sm">/ {metric.limit?.toLocaleString()}</span>
          )}
        </div>

        {!unlimited && (
          <div className="w-full bg-surface-200 dark:bg-surface-800 rounded-full h-2 overflow-hidden">
            <div
              className={cn("h-full transition-all", barColor)}
              style={{ width: `${metric.percentage}%` }}
            />
          </div>
        )}

        <div className="mt-2 min-h-[1.25rem]">
          {isAtLimit && (
            <p className="text-xs text-red-600 dark:text-red-400 font-medium">
              Limit reached
            </p>
          )}
          {isNearLimit && !isAtLimit && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400">
              Only {metric.remaining} remaining
            </p>
          )}
          {!isAtLimit && !isNearLimit && (
            <p className="text-xs text-muted-foreground">
              {unlimited ? "Unlimited" : `${metric.remaining} remaining`}
            </p>
          )}
        </div>

        {(isAtLimit || isNearLimit) && (
          <Link href={onUpgradeHref} className="block mt-2">
            <Button variant="outline" size="sm" className="w-full text-xs">
              Upgrade Plan
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  )
}

export function PlanUsageDashboard({ variant = "full", className }: PlanUsageDashboardProps) {
  const { usage, loading, getMetric, isLimitReached, isNearLimit, plan, trialDaysRemaining } = usePlanLimits()

  if (loading) {
    return (
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
        {Array.from({ length: variant === "full" ? 4 : 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-surface-200 dark:bg-surface-800 rounded w-1/2 mb-3" />
              <div className="h-8 bg-surface-200 dark:bg-surface-800 rounded w-1/3 mb-2" />
              <div className="h-2 bg-surface-200 dark:bg-surface-800 rounded w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!usage) return null

  const cards: Array<{ resource: UsageResource; title: string; icon: React.ReactNode }> = [
    { resource: "branches", title: "Branches", icon: <Building2 className="h-4 w-4" /> },
    { resource: "staff", title: "Staff", icon: <Users className="h-4 w-4" /> },
    { resource: "currencies", title: "Currencies", icon: <Coins className="h-4 w-4" /> },
  ]
  if (variant === "full") {
    cards.push({ resource: "transfers", title: "Transfers / month", icon: <Send className="h-4 w-4" /> })
  }

  return (
    <div className={cn("space-y-4", className)}>
      {variant === "full" && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">Plan Usage</h2>
            <p className="text-sm text-muted-foreground">
              Current plan: <Badge variant="outline" className="ml-1">{plan}</Badge>
              {trialDaysRemaining !== null && trialDaysRemaining > 0 && (
                <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400">
                  Trial: {trialDaysRemaining} day{trialDaysRemaining === 1 ? "" : "s"} left
                </span>
              )}
            </p>
          </div>
          <Link href="/company/settings/billing">
            <Button variant="outline" size="sm">Manage Plan</Button>
          </Link>
        </div>
      )}

      <div className={cn(
        "grid gap-3",
        variant === "full"
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          : "grid-cols-1 sm:grid-cols-3"
      )}>
        {cards.map(({ resource, title, icon }) => {
          const metric = getMetric(resource)
          return (
            <ResourceCard
              key={resource}
              resource={resource}
              title={title}
              icon={icon}
              metric={metric}
              isAtLimit={isLimitReached(resource)}
              isNearLimit={isNearLimit(resource)}
              onUpgradeHref="/company/settings/billing"
            />
          )
        })}
      </div>
    </div>
  )
}
