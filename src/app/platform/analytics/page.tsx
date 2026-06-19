"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, TrendingUp, Users, Activity, DollarSign, Crown } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface MonthlyDataPoint {
  month: string
  revenue: number
  companies: number
}

interface ActivityItem {
  id: string
  action: string
  targetCompany: string
  timestamp: string
  actor: string
}

interface AnalyticsData {
  totalCompanies: number
  activeCompanies: number
  suspendedCompanies: number
  trialCompanies: number
  deletedCompanies: number
  newThisMonth: number
  totalRevenue: number
  subscriptionRevenue: number
  commissionRevenue: number
  mrr: number
  totalUsers: number
  activeUsers: number
  monthlyRevenue: MonthlyDataPoint[]
  recentActivity: ActivityItem[]
  systemHealth: string
}

function BarChart({
  data,
  label,
  color = "bg-primary-500",
  format,
}: {
  data: { value: number; label: string }[]
  label: string
  color?: string
  format?: (v: number) => string
}) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground text-center">{label}</p>
      <div className="flex items-end justify-between gap-1.5 h-48">
        {data.map((point, i) => (
          <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-0">
            <span className="text-[10px] font-medium text-muted-foreground">
              {format ? format(point.value) : point.value}
            </span>
            <div
              className={`w-full rounded-t ${color}`}
              style={{ height: `${(point.value / max) * 100}%`, minHeight: 4 }}
            />
            <span className="text-[10px] text-muted-foreground truncate w-full text-center">
              {point.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-600 animate-pulse flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground">Loading analytics...</p>
      </div>
    </div>
  )
}

function EmptyAnalytics() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <BarChart3 className="h-12 w-12 text-muted-foreground/30 mb-4" />
      <h3 className="text-lg font-semibold">No analytics data</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
        Analytics data will appear here once companies are registered and activity is recorded on the platform.
      </p>
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/analytics")
        if (!res.ok) throw new Error("Failed to fetch")
        const json: AnalyticsData = await res.json()
        setData(json)
      } catch {
        console.error("Failed to load admin analytics")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <LoadingSpinner />
  if (!data) return <EmptyAnalytics />

  const churnRate = data.totalCompanies > 0
    ? ((data.suspendedCompanies / data.totalCompanies) * 100).toFixed(1)
    : "0.0"

  const activePct = data.totalUsers > 0 ? Math.round((data.activeUsers / data.totalUsers) * 100) : 0
  const inactivePct = data.totalUsers > 0 ? Math.round(((data.totalUsers - data.activeUsers) / data.totalUsers) * 100) : 0

  const revenueData = data.monthlyRevenue?.length
    ? data.monthlyRevenue.map((m) => ({ value: m.revenue, label: m.month.slice(0, 3) }))
    : []

  const companiesData = data.monthlyRevenue?.length
    ? data.monthlyRevenue.map((m) => ({ value: m.companies, label: m.month.slice(0, 3) }))
    : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Platform-wide analytics and trends
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-blue-600 bg-blue-100 dark:bg-blue-900/20">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">Total Companies</p>
                <p className="text-xl font-bold mt-0.5">{data.totalCompanies.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">Active</p>
                <p className="text-xl font-bold mt-0.5">{data.activeCompanies.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-violet-600 bg-violet-100 dark:bg-violet-900/20">
                <Crown className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">On Trial</p>
                <p className="text-xl font-bold mt-0.5">{data.trialCompanies.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-rose-600 bg-rose-100 dark:bg-rose-900/20">
                <DollarSign className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">MRR</p>
                <p className="text-xl font-bold mt-0.5">{formatCurrency(data.mrr, "USD")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-primary-600 bg-primary-100 dark:bg-primary-900/20">
                <Activity className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">Churn Rate</p>
                <p className="text-xl font-bold mt-0.5">{churnRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue breakdown */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Revenue</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(data.totalRevenue, "USD")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Subscription Revenue</p>
            <p className="text-2xl font-bold mt-1 text-blue-600">{formatCurrency(data.subscriptionRevenue, "USD")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Commission Revenue</p>
            <p className="text-2xl font-bold mt-1 text-emerald-600">{formatCurrency(data.commissionRevenue, "USD")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">New This Month</p>
            <p className="text-2xl font-bold mt-1">{data.newThisMonth}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Company Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={companiesData}
              label="New Companies per Month"
              color="bg-gradient-to-t from-primary-600 to-primary-400"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Revenue Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={revenueData}
              label="Monthly Revenue"
              color="bg-gradient-to-t from-emerald-600 to-emerald-400"
              format={(v) => formatCurrency(v, "USD")}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Platform Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative w-40 h-40 mb-6">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--primary))" strokeWidth="3"
                    strokeDasharray={`${activePct} ${100 - activePct}`} strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-2xl font-bold">{activePct}%</span>
                  <span className="text-[10px] text-muted-foreground">active</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 text-center w-full max-w-xs">
                <div>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full bg-primary-500" />
                    <span className="text-sm font-medium">Active</span>
                  </div>
                  <p className="text-lg font-bold">{data.activeUsers.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{activePct}% of total</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
                    <span className="text-sm font-medium">Inactive</span>
                  </div>
                  <p className="text-lg font-bold">{(data.totalUsers - data.activeUsers).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{inactivePct}% of total</p>
                </div>
              </div>

              <div className="mt-6 w-full pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Users</span>
                  <span className="font-bold">{data.totalUsers.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentActivity.length > 0 ? (
              <div className="space-y-0 divide-y">
                {data.recentActivity.slice(0, 8).map((activity) => (
                  <div key={activity.id} className="py-3 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground truncate">{activity.targetCompany}</p>
                      <p className="text-xs text-muted-foreground">by {activity.actor}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No recent activity
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${data.systemHealth === "healthy" ? "bg-emerald-500" : "bg-amber-500"}`} />
          <span className="text-sm">
            System Status: <strong>{data.systemHealth === "healthy" ? "All Systems Operational" : "Degraded Performance"}</strong>
          </span>
          <span className="text-xs text-muted-foreground ml-auto">
            {data.totalCompanies} companies · {data.totalUsers} users · Updated real-time
          </span>
        </CardContent>
      </Card>
    </div>
  )
}
