"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, CheckCircle2, XCircle, AlertTriangle, TrendingUp, DollarSign, Activity, Clock } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

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
  deletedCompanies: number
  newThisMonth: number
  totalRevenue: number
  mrr: number
  recentActivity: ActivityItem[]
  systemHealth: string
}

export default function AdminPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/analytics")
        if (res.ok) setData(await res.json())
      } catch {
        console.error("Failed to load admin analytics")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
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

  const stats = [
    { label: "Total Companies", value: data?.totalCompanies ?? 0, icon: Building2, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/20" },
    { label: "Active Companies", value: data?.activeCompanies ?? 0, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20" },
    { label: "Suspended", value: data?.suspendedCompanies ?? 0, icon: XCircle, color: "text-red-600 bg-red-100 dark:bg-red-900/20" },
    { label: "Deleted", value: data?.deletedCompanies ?? 0, icon: AlertTriangle, color: "text-orange-600 bg-orange-100 dark:bg-orange-900/20" },
    { label: "New This Month", value: data?.newThisMonth ?? 0, icon: TrendingUp, color: "text-purple-600 bg-purple-100 dark:bg-purple-900/20" },
    { label: "Total Revenue", value: data?.totalRevenue ?? 0, icon: DollarSign, color: "text-primary-600 bg-primary-100 dark:bg-primary-900/20", isCurrency: true },
  ]

  const activity = data?.recentActivity ?? []

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      <div>
        <h1 className="text-2xl font-bold">Admin Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform-wide metrics and activity</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold mt-1">
                  {stat.isCurrency ? formatCurrency(stat.value as number, "USD") : stat.value}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activity.length > 0 ? (
              <div className="divide-y">
                {activity.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 py-3">
                    <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.action}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.targetCompany}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-xs text-muted-foreground">{item.actor}</p>
                      <p className="text-xs text-muted-foreground">{new Date(item.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mb-2" />
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                data?.systemHealth === "healthy"
                  ? "bg-emerald-100 dark:bg-emerald-900/20"
                  : "bg-amber-100 dark:bg-amber-900/20"
              }`}>
                <CheckCircle2 className={`h-8 w-8 ${
                  data?.systemHealth === "healthy" ? "text-emerald-600" : "text-amber-600"
                }`} />
              </div>
              <p className="text-lg font-semibold mt-3 capitalize">{data?.systemHealth ?? "Unknown"}</p>
              <p className="text-xs text-muted-foreground mt-1">All systems operational</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
