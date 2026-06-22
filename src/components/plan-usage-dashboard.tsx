"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Sparkles, Infinity as InfinityIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface PlanUsageDashboardProps {
  variant?: "full" | "compact"
  className?: string
}

const STATS = [
  { key: "branches", label: "Branches" },
  { key: "staff", label: "Staff" },
  { key: "currencies", label: "Currencies" },
] as const

function StatPill({ label, current }: { label: string; current: number }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-100 dark:bg-surface-800 text-xs">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-semibold tabular-nums">{current}</span>
    </div>
  )
}

export function PlanUsageDashboard({ variant = "full", className }: PlanUsageDashboardProps) {
  if (variant === "full") {
    return (
      <Card className={cn("border-secondary/30 bg-gradient-to-br from-secondary/5 via-transparent to-primary/5", className)}>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="p-2.5 rounded-xl bg-secondary/15 text-secondary flex-shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-semibold">Enterprise Plan</h2>
                  <Badge variant="default" className="bg-secondary text-white hover:bg-secondary">
                    Active
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />
                  All features are unlocked. No usage limits.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-shrink-0">
              <InfinityIcon className="h-3.5 w-3.5" />
              <span>Unlimited everything</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/20", className)}>
      <Sparkles className="h-3.5 w-3.5 text-secondary" />
      <span className="text-xs font-medium">Enterprise — All Unlocked</span>
    </div>
  )
}

export function EnterpriseBanner({ usage, className }: { usage?: { branches: number; staff: number; currencies: number }; className?: string }) {
  return (
    <Card className={cn("border-secondary/30 bg-gradient-to-br from-secondary/5 via-transparent to-primary/5", className)}>
      <CardContent className="p-5">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/15 text-secondary flex-shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold">Enterprise Plan</h3>
                <Badge variant="default" className="bg-secondary text-white hover:bg-secondary text-[10px] px-1.5 py-0">
                  Active
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                All features are unlocked — branches, staff, currencies, transfers, and more.
              </p>
            </div>
          </div>
          {usage && (
            <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/50">
              {STATS.map((s) => (
                <StatPill key={s.key} label={s.label} current={usage[s.key]} />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
