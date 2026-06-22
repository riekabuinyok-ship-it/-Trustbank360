"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Banknote, ArrowLeftRight, Building2, Users, TrendingUp, ArrowUpRight, Clock, Plus, Search, Award, Trophy, BarChart3, DollarSign, Percent, Smartphone, Target, AlertTriangle, Megaphone, ShieldAlert, X } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import { BusinessTypeBadges } from "@/components/business-type-badge"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { EnterpriseBanner } from "@/components/plan-usage-dashboard"

const STORAGE_KEY_ANNOUNCEMENTS = "dismissedAnnouncements"
const STORAGE_KEY_WARNINGS = "dismissedWarnings"

function getStoredDismissed(key: string): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    return new Set(JSON.parse(localStorage.getItem(key) || "[]"))
  } catch {
    return new Set()
  }
}

function storeDismissed(key: string, ids: Set<string>) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify([...ids]))
  } catch { /* ignore */ }
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const role = user?.role

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeCurrency, setActiveCurrency] = useState<string>("SSP")
  const [alerts, setAlerts] = useState<any>(null)
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<Set<string>>(new Set())
  const [dismissedWarnings, setDismissedWarnings] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/dashboard")
      if (res.ok) setData(await res.json())
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    async function loadAlerts() {
      const res = await fetch("/api/company/dashboard-alerts")
      if (res.ok) setAlerts(await res.json())
    }
    loadAlerts()
  }, [])

  useEffect(() => {
    setDismissedAnnouncements(getStoredDismissed(STORAGE_KEY_ANNOUNCEMENTS))
    setDismissedWarnings(getStoredDismissed(STORAGE_KEY_WARNINGS))
  }, [])

  function dismissAnnouncement(id: string) {
    const next = new Set(dismissedAnnouncements)
    next.add(id)
    setDismissedAnnouncements(next)
    storeDismissed(STORAGE_KEY_ANNOUNCEMENTS, next)
  }

  function dismissWarning(id: string) {
    const next = new Set(dismissedWarnings)
    next.add(id)
    setDismissedWarnings(next)
    storeDismissed(STORAGE_KEY_WARNINGS, next)
  }

  const isOperational = role === "BRANCH_MANAGER" || role === "branch_manager" || role === "TELLER" || role === "teller"
  const isSupervisory = role === "COMPANY_OWNER" || role === "company_owner" || role === "COMPANY_ADMIN" || role === "company_admin"
  const isTeller = role === "TELLER" || role === "teller"
  const isBranchManager = role === "BRANCH_MANAGER" || role === "branch_manager"

  const ins = data?.insights || {}
  const byCurrency = data?.byCurrency || {}
  
  const alertsData = alerts || {}
  const companyCurrencies = data?.companyCurrencies || ["SSP"]
  const topBranches = data?.topBranches || []
  const dailyVolume = data?.dailyVolume || []
  const recentTransactions = data?.recentTransactions || []

  // Currency-filtered data
  const currencyData = data?.byCurrency?.[activeCurrency]
  const activeCounts = data?.counts ?? {}
  const activeMf = data?.moneyFlow ?? {}
  const activeCf = data?.commissionFlow ?? {}
  const activeRecentTxs = data?.recentTransactions ?? []
  const activeWalletBalance = currencyData?.balance ?? 0

  const { isActive, warnings, announcements } = alertsData

  return (
    <div className="space-y-6">

      {/* 1. ACTIVE WARNINGS */}
      {alerts && warnings?.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-amber-600 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Active Warnings ({warnings.length})
          </h3>
          <div className="grid gap-2">
            {warnings.filter((w: any) => !dismissedWarnings.has(w.id)).map((w: any) => (
              <Card key={w.id} className="border-amber-300 bg-amber-50 dark:bg-amber-950/10">
                <CardContent className="p-3 flex items-start gap-3">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium break-anywhere">{w.reason}</p>
                    <p className="text-xs text-muted-foreground break-anywhere">
                      {new Date(w.createdAt).toLocaleDateString()} &middot; {w.createdBy?.name || "Admin"}
                    </p>
                  </div>
                  <button
                    onClick={() => dismissWarning(w.id)}
                    className="text-muted-foreground hover:text-foreground flex-shrink-0"
                    aria-label="Dismiss warning"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* HEADER + GREETING */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <p className="text-muted-foreground text-sm">
              {isSupervisory ? "Company Overview" : isBranchManager ? "Branch Operations" : "Front Desk Operations"}
            </p>
            {user?.businessTypes && <BusinessTypeBadges types={user.businessTypes} />}
          </div>
        </div>
        {isOperational && (
          <div className="flex flex-wrap gap-2">
            <Link href="/company/transfers/payout">
              <Button variant="outline" className="gap-2" size="sm">
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Search</span>
              </Button>
            </Link>
            <Link href="/company/transfers/new">
              <Button className="gap-2" size="sm">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">{isTeller ? "Send Money" : "New Transaction"}</span>
                <span className="sm:hidden">{isTeller ? "Send" : "New"}</span>
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* ENTERPRISE BANNER — for company owner/admin only */}
      {isSupervisory && (
        <EnterpriseBanner
          usage={
            data?.byCurrency
              ? {
                  branches: data.totalBranches ?? 0,
                  staff: data.totalStaff ?? 0,
                  currencies: data.totalCurrencies ?? 0,
                }
              : undefined
          }
        />
      )}

      {/* STATUS SUMMARY — always visible */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Transactions</p>
            <p className="text-2xl font-bold">{loading ? "-" : (activeCounts.total ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold text-emerald-600">{loading ? "-" : (activeCounts.completed ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{loading ? "-" : (activeCounts.pending ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Cancelled</p>
            <p className="text-2xl font-bold text-red-600">{loading ? "-" : (activeCounts.cancelled ?? 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions for Teller */}
      {isTeller && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link href="/company/transfers/new">
            <Card className="hover:border-primary-300 transition-colors cursor-pointer">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-2">
                  <Plus className="h-5 w-5 text-primary-600" />
                </div>
                <p className="text-sm font-medium">Send Money</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/company/transfers/payout">
            <Card className="hover:border-primary-300 transition-colors cursor-pointer">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 rounded-lg bg-secondary-100 dark:bg-secondary-900/20 flex items-center justify-center mx-auto mb-2">
                  <Search className="h-5 w-5 text-secondary-600" />
                </div>
                <p className="text-sm font-medium">Search</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/company/transfers">
            <Card className="hover:border-primary-300 transition-colors cursor-pointer">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center mx-auto mb-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <p className="text-sm font-medium">My Transactions</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/company/reports">
            <Card className="hover:border-primary-300 transition-colors cursor-pointer">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-sm font-medium">Reports</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* 2 & 3. DASHBOARD STATISTICS (Currency Tabs) */}
      {companyCurrencies.length > 0 && (
        <Tabs value={activeCurrency} onValueChange={setActiveCurrency}>
          <TabsList className="w-full justify-start overflow-x-auto">
            {companyCurrencies.map((cur: string) => (
              <TabsTrigger key={cur} value={cur}>{cur}</TabsTrigger>
            ))}
          </TabsList>
          {companyCurrencies.map((cur: string) => {
            const curr = data?.byCurrency?.[cur]
            const displayCount = curr?.count ?? 0
            const displayVolume = curr?.volume ?? 0
            const displayCommission = curr?.commission ?? 0
            return (
              <TabsContent key={cur} value={cur}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">Transactions</p>
                      <p className="text-2xl font-bold">{loading ? "-" : displayCount}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">Volume</p>
                      <p className="text-2xl font-bold">{loading ? "-" : formatCurrency(displayVolume, cur)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">Commission</p>
                      <p className="text-2xl font-bold text-emerald-600">{loading ? "-" : formatCurrency(displayCommission, cur)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">Wallet Balance</p>
                      <p className="text-2xl font-bold text-primary">{loading ? "-" : formatCurrency(activeWalletBalance, cur)}</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )
          })}
        </Tabs>
      )}

      {/* 4. MONEY FLOW */}
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
          <DollarSign className="h-5 w-5 text-primary" />
          Money Flow
          <span className="text-sm font-normal text-muted-foreground">({activeCurrency})</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <p className="text-xs text-muted-foreground">Today</p>
              </div>
              <p className="text-lg font-bold">{loading ? "-" : formatCurrency(activeMf.today || 0, activeCurrency === "ALL" ? "SSP" : activeCurrency)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-3.5 w-3.5 text-secondary" />
                <p className="text-xs text-muted-foreground">This Week</p>
              </div>
              <p className="text-lg font-bold">{loading ? "-" : formatCurrency(activeMf.week || 0, activeCurrency === "ALL" ? "SSP" : activeCurrency)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="h-3.5 w-3.5 text-amber-500" />
                <p className="text-xs text-muted-foreground">This Month</p>
              </div>
              <p className="text-lg font-bold">{loading ? "-" : formatCurrency(activeMf.month || 0, activeCurrency === "ALL" ? "SSP" : activeCurrency)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="h-3.5 w-3.5 text-primary" />
                <p className="text-xs text-muted-foreground">All Time</p>
              </div>
              <p className="text-lg font-bold">{loading ? "-" : formatCurrency(activeMf.all || 0, activeCurrency === "ALL" ? "SSP" : activeCurrency)}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 5. COMMISSION FLOW */}
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
          <Percent className="h-5 w-5 text-emerald-500" />
          Commission Flow
          <span className="text-sm font-normal text-muted-foreground">({activeCurrency})</span>
          <span className="text-xs font-normal text-muted-foreground">(Separate revenue stream)</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="border-emerald-200 dark:border-emerald-900">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Today Commission</p>
              <p className="text-lg font-bold text-emerald-600">{loading ? "-" : formatCurrency(activeCf.today || 0, activeCurrency === "ALL" ? "SSP" : activeCurrency)}</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 dark:border-emerald-900">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">This Week Commission</p>
              <p className="text-lg font-bold text-emerald-600">{loading ? "-" : formatCurrency(activeCf.week || 0, activeCurrency === "ALL" ? "SSP" : activeCurrency)}</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 dark:border-emerald-900">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">This Month Commission</p>
              <p className="text-lg font-bold text-emerald-600">{loading ? "-" : formatCurrency(activeCf.month || 0, activeCurrency === "ALL" ? "SSP" : activeCurrency)}</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 dark:border-emerald-900">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total Commission</p>
              <p className="text-lg font-bold text-emerald-600">{loading ? "-" : formatCurrency(activeCf.all || 0, activeCurrency === "ALL" ? "SSP" : activeCurrency)}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 6. CHARTS + BRANCH PERFORMANCE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {!isTeller && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Daily Transaction Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                {dailyVolume.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyVolume}>
                      <defs>
                        <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0F4C81" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#0F4C81" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" tickLine={false} axisLine={false} tickFormatter={(v) => v.slice(5)} />
                      <YAxis className="text-xs" tickLine={false} axisLine={false} />
                      <Tooltip formatter={(value: number) => formatCurrency(value, "SSP")} />
                      <Area type="monotone" dataKey="amount" stroke="#0F4C81" strokeWidth={2} fill="url(#colorV)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No data for this month</div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {isSupervisory && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Branch Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topBranches.length > 0 ? (
                <div className="space-y-3">
                  {topBranches.map((b: any, i: number) => (
                    <div key={b.id} className="flex items-center justify-between p-2 rounded-lg bg-surface-50 dark:bg-surface-800/50">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                          i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-slate-100 text-slate-600" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-surface-100 text-muted-foreground"
                        }`}>
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{b.name}</p>
                          <p className="text-xs text-muted-foreground">{b.count} txns</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="text-sm font-semibold">{formatCurrency(b.volume, "SSP")}</p>
                        <p className="text-xs text-emerald-600">{formatCurrency(b.commission, "SSP")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No branch data yet</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* 7. RECENT TRANSACTIONS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Transactions
            <span className="text-sm font-normal text-muted-foreground"> ({activeCurrency})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeRecentTxs.length > 0 ? (
            <div className="divide-y">
              {activeRecentTxs.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{tx.sender?.fullName} → {tx.receiver?.fullName}</p>
                    <p className="text-xs text-muted-foreground">{tx.transactionNumber}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-sm font-semibold">{formatCurrency(tx.amount, tx.currency)}</p>
                    <Badge variant={
                      tx.status === "COMPLETED" ? "default" :
                      tx.status === "PENDING" ? "secondary" : "destructive"
                    } className="text-[10px]">{tx.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No recent transactions</p>
          )}
          <div className="text-center pt-4 border-t mt-2">
            <Link href="/company/transfers" className="text-sm text-primary hover:underline">View all transactions</Link>
          </div>
        </CardContent>
      </Card>

      {/* 8. ANNOUNCEMENTS (moved to bottom) */}
      {alerts && announcements?.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary" />
            Announcements
          </h3>
          <div className="grid gap-3">
            {announcements.filter((a: any) => !dismissedAnnouncements.has(a.id)).map((a: any) => (
              <Card key={a.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium break-anywhere">{a.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 break-anywhere">{a.content}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-start">
                      <Badge variant="outline" className="text-[10px] whitespace-nowrap">
                        {new Date(a.createdAt).toLocaleDateString()}
                      </Badge>
                      <button
                        onClick={() => dismissAnnouncement(a.id)}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="Dismiss announcement"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 9. ALERTS (suspension - at the bottom) */}
      {alerts && !isActive && (
        <div className="bg-red-600 text-white px-4 sm:px-6 py-3 rounded-lg flex items-center gap-3">
          <ShieldAlert className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium break-anywhere">Your company has been suspended. Contact platform admin for assistance.</p>
        </div>
      )}
    </div>
  )
}
