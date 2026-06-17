"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  ArrowRight, TrendingUp, TrendingDown, Building2, Globe, DollarSign, ArrowLeftRight,
  CheckCircle2, Shield, BarChart3, MessageSquare, Wallet, Users, Clock, Smartphone,
  Search, Filter, ChevronDown, Star, Award, AlertTriangle, BookOpen,
} from "lucide-react"

const features = [
  { icon: ArrowLeftRight, title: "Money Transfers", description: "Send and receive money across branches and countries with real-time tracking and automated commission calculation." },
  { icon: Building2, title: "Multi-Branch Management", description: "Manage unlimited branches with separate wallets, staff, and reporting per location." },
  { icon: Shield, title: "KYC & Compliance", description: "Built-in identity verification, AML screening, risk scoring, and fraud detection." },
  { icon: Wallet, title: "Branch Wallets", description: "Each branch gets its own multi-currency wallet (SSP, USD, KES, UGX) with automatic balance updates." },
  { icon: TrendingUp, title: "Exchange Rates", description: "Real-time rate management with buy/sell spread, scheduling, and full audit history." },
  { icon: BarChart3, title: "Reports & Analytics", description: "Daily, weekly, monthly reports with export to PDF, Excel, and CSV." },
  { icon: MessageSquare, title: "Internal Chat", description: "Built-in messaging with direct messages, group chats, and company announcements." },
  { icon: Globe, title: "Public Tracking", description: "Customers can track their transfers online using a simple code and phone number." },
]

const steps = [
  { number: "01", title: "Create Account", description: "Register your company in minutes. Set up branches, staff, and currencies." },
  { number: "02", title: "Configure Rates & Wallets", description: "Set exchange rates, fund branch wallets, and define approval rules." },
  { number: "03", title: "Start Transferring", description: "Process money transfers with automatic commission, tracking, and compliance checks." },
]

const stats = [
  { value: "50+", label: "Countries Covered" },
  { value: "6", label: "Currencies Supported" },
  { value: "99.9%", label: "Uptime" },
  { value: "24/7", label: "Support" },
]

const countryFlags: Record<string, string> = {
  "South Sudan": "🇸🇸",
  "Uganda": "🇺🇬",
  "Kenya": "🇰🇪",
}

const countryOptions = ["South Sudan", "Uganda", "Kenya"]
const pairOptions = [
  { from: "SSP", to: "USD", label: "SSP ↔ USD" },
  { from: "SSP", to: "UGX", label: "SSP ↔ UGX" },
  { from: "SSP", to: "KES", label: "SSP ↔ KES" },
  { from: "USD", to: "KES", label: "USD ↔ KES" },
]
const sortOptions = [
  { value: "latest", label: "Latest Updated" },
  { value: "buy", label: "Best Buy Rate" },
  { value: "sell", label: "Best Sell Rate" },
]

const currencySymbols: Record<string, string> = {
  SSP: "SSP", USD: "$", UGX: "UGX", KES: "KSh", EUR: "€", GBP: "£", AED: "د.إ",
}

function formatRate(rate: number) {
  const digits = rate < 0.01 ? 6 : rate < 1 ? 4 : 2
  return rate.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function HomePage() {
  const [analyses, setAnalyses] = useState<any[]>([])
  const [statsData, setStatsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [country, setCountry] = useState("")
  const [pairIndex, setPairIndex] = useState(0)
  const [sort, setSort] = useState("latest")
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set())
  const prevRatesRef = useRef<Map<string, number>>(new Map())
  const countryRef = useRef<HTMLDivElement>(null)
  const sortRef = useRef<HTMLDivElement>(null)

  const pair = pairOptions[pairIndex]

  const fetchRates = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (country) params.set("country", country)
      if (pair) { params.set("from", pair.from); params.set("to", pair.to) }
      params.set("sort", sort)
      const res = await fetch(`/api/public/rates?${params}`)
      if (!res.ok) { console.error("Public rates API returned", res.status); setLoading(false); return }
      const data = await res.json()

      setAnalyses((prev) => {
        const newHighlighted = new Set<string>()
        const newMap = new Map<string, number>()
        for (const a of data.analyses) {
          for (const r of a.rates) {
            const key = `${r.companyId}-${r.fromCurrency}-${r.toCurrency}`
            const prevBuy = prevRatesRef.current.get(`${key}-buy`)
            if (prevBuy !== undefined && prevBuy !== r.buyRate) newHighlighted.add(r.id)
            newMap.set(`${key}-buy`, r.buyRate)
            newMap.set(`${key}-sell`, r.sellRate)
          }
        }
        prevRatesRef.current = newMap
        if (newHighlighted.size > 0) setHighlightedIds(newHighlighted)
        return data.analyses
      })
      setStatsData(data.stats)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [country, pairIndex, sort, pair])

  useEffect(() => {
    fetchRates()
    const interval = setInterval(fetchRates, 8000)
    return () => clearInterval(interval)
  }, [fetchRates])

  useEffect(() => {
    if (highlightedIds.size > 0) {
      const timer = setTimeout(() => setHighlightedIds(new Set()), 1500)
      return () => clearTimeout(timer)
    }
  }, [highlightedIds])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) setShowCountryDropdown(false)
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSortDropdown(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // Flatten all rates from all analyses for card display
  const allRates = analyses.flatMap((a: any) =>
    a.rates.map((r: any) => ({ ...r, _analysis: a }))
  )

  const totalCards = allRates.length

  return (
    <div className="overflow-hidden">
      {/* HERO */}
      <section className="relative min-h-[85vh] flex items-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-surface-950 dark:via-surface-900 dark:to-surface-950">
        <div className="absolute inset-0 bg-grid-primary/[0.03] dark:bg-grid-primary/[0.05]" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium">
              <Globe className="h-4 w-4" />
              Live Exchange Rate Marketplace
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-surface-900 dark:text-white leading-tight">
              Live Exchange Rates Across{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-secondary-500">
                Africa&apos;s Leading Financial Companies
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Compare real-time exchange rates from money transfer companies, mobile money agents,
              and forex bureaus in South Sudan, Uganda, and Kenya.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="gap-2 text-base px-8" onClick={() => document.getElementById("rates-section")?.scrollIntoView({ behavior: "smooth" })}>
                View Live Rates
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="gap-2 text-base px-8" asChild>
                <Link href="/signup">
                  Become a Provider
                  <Building2 className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="ghost" className="gap-2 text-base px-8" asChild>
                <Link href="/tutorials">
                  <BookOpen className="h-4 w-4" />
                  Tutorials
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* LIVE EXCHANGE RATE MARKET */}
      <section id="rates-section" className="py-16 lg:py-24 bg-white dark:bg-surface-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-surface-900 dark:text-white">
              Live Exchange Rate Market
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Real-time rates from active providers. Updated every 8 seconds.
            </p>
          </div>

          {/* MARKET SUMMARY */}
          {statsData && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800 border">
                <p className="text-xs text-muted-foreground">Average Buy Rate</p>
                <p className="text-xl font-bold text-surface-900 dark:text-white">
                  {statsData.averageBuy ? formatRate(statsData.averageBuy) : "—"}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800 border">
                <p className="text-xs text-muted-foreground">Average Sell Rate</p>
                <p className="text-xl font-bold text-surface-900 dark:text-white">
                  {statsData.averageSell ? formatRate(statsData.averageSell) : "—"}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800 border">
                <p className="text-xs text-muted-foreground">Market Trend</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <TrendingUp className="h-5 w-5" />
                  Stable
                </p>
              </div>
              <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800 border">
                <p className="text-xs text-muted-foreground">Active Providers</p>
                <p className="text-xl font-bold text-surface-900 dark:text-white">{statsData.activeCompanies}</p>
              </div>
            </div>
          )}

          {/* BEST OVERALL HIGHLIGHT */}
          {statsData?.bestBuyOverall && statsData?.bestSellOverall && (
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-800">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Best Buy Rate</span>
                </div>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                  {statsData.bestBuyOverall.companyName}
                </p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  {formatRate(statsData.bestBuyOverall.rate)}
                </p>
              </div>
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">Best Sell Rate</span>
                </div>
                <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                  {statsData.bestSellOverall.companyName}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  {formatRate(statsData.bestSellOverall.rate)}
                </p>
              </div>
            </div>
          )}

          {/* FILTER BAR */}
          <div className="sticky top-16 lg:top-20 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-white/80 dark:bg-surface-900/80 backdrop-blur-lg border-b mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative" ref={countryRef}>
                <button
                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-surface-50 dark:bg-surface-800 text-sm font-medium hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                >
                  {country ? <>{countryFlags[country]} {country}</> : <><Globe className="h-4 w-4" /> All Countries</>}
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>
                {showCountryDropdown && (
                  <div className="absolute top-full mt-1 left-0 w-48 bg-white dark:bg-surface-800 rounded-xl shadow-xl border z-40 py-1">
                    <button onClick={() => { setCountry(""); setShowCountryDropdown(false) }} className="w-full text-left px-4 py-2 text-sm hover:bg-surface-100 dark:hover:bg-surface-700">
                      All Countries
                    </button>
                    {countryOptions.map((c) => (
                      <button key={c} onClick={() => { setCountry(c); setShowCountryDropdown(false) }} className="w-full text-left px-4 py-2 text-sm hover:bg-surface-100 dark:hover:bg-surface-700 flex items-center gap-2">
                        {countryFlags[c]} {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-1">
                {pairOptions.map((p, i) => (
                  <button
                    key={p.label}
                    onClick={() => setPairIndex(i)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      pairIndex === i
                        ? "bg-primary text-white"
                        : "bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 border"
                    }`}
                  >
                    <DollarSign className="h-3.5 w-3.5 inline mr-1" />
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="relative ml-auto" ref={sortRef}>
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-surface-50 dark:bg-surface-800 text-sm font-medium hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                >
                  <Filter className="h-4 w-4" />
                  {sortOptions.find((s) => s.value === sort)?.label}
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>
                {showSortDropdown && (
                  <div className="absolute top-full mt-1 right-0 w-44 bg-white dark:bg-surface-800 rounded-xl shadow-xl border z-40 py-1">
                    {sortOptions.map((s) => (
                      <button key={s.value} onClick={() => { setSort(s.value); setShowSortDropdown(false) }} className="w-full text-left px-4 py-2 text-sm hover:bg-surface-100 dark:hover:bg-surface-700">
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PAIR ANALYSIS SECTIONS */}
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-48 rounded-xl bg-surface-100 dark:bg-surface-800 animate-pulse" />
              ))}
            </div>
          ) : totalCards === 0 ? (
            <div className="text-center py-16">
              <Search className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-lg font-medium text-surface-900 dark:text-white">No rates available</p>
              <p className="text-sm text-muted-foreground">Try changing the filters or check back later.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {analyses.map((a: any) => {
                const pairBestBuy = a.bestBuy?.rate || 0
                const pairBestSell = a.bestSell?.rate || Infinity

                return (
                  <div key={a.pair}>
                    {/* Pair Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-surface-900 dark:text-white">
                          {a.fromCurrency} → {a.toCurrency}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          a.trend === "rising"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                            : a.trend === "falling"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                              : "bg-surface-100 text-muted-foreground dark:bg-surface-800"
                        }`}>
                          {a.trend === "rising" ? <TrendingUp className="h-3 w-3" /> : a.trend === "falling" ? <TrendingDown className="h-3 w-3" /> : null}
                          {a.trend === "rising" ? "Rising" : a.trend === "falling" ? "Falling" : "Stable"}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Avg Buy: {formatRate(a.averageBuy)} &middot; Avg Sell: {formatRate(a.averageSell)}
                      </div>
                    </div>

                    {/* Top Provider & Anomalies */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {a.topProvider && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-[10px] font-semibold">
                          <Award className="h-3 w-3" />
                          Top: {a.topProvider}
                        </span>
                      )}
                      {a.flags?.map((f: string, i: number) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-[10px] font-semibold">
                          <AlertTriangle className="h-3 w-3" />
                          {f}
                        </span>
                      ))}
                    </div>

                    {/* Rate Cards */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {a.rates.map((r: any) => {
                        const isBestBuy = r.buyRate === pairBestBuy
                        const isBestSell = r.sellRate === pairBestSell
                        const isHighlighted = highlightedIds.has(r.id)
                        const spread = r.sellRate - r.buyRate

                        return (
                          <div
                            key={r.id}
                            className={`rounded-xl border bg-white dark:bg-surface-800 p-5 transition-all duration-500 hover:shadow-lg hover:-translate-y-0.5 ${
                              isHighlighted ? "ring-2 ring-primary-400 shadow-lg scale-[1.02]" : ""
                            }`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-lg font-bold text-primary-600">
                                  {r.companyName.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-surface-900 dark:text-white">{r.companyName}</p>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    {countryFlags[r.companyCountry] || "📍"} {r.companyCountry}
                                  </p>
                                </div>
                              </div>
                              {isBestBuy && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold">
                                  <Star className="h-3 w-3" />
                                  Best Buy
                                </span>
                              )}
                              {isBestSell && !isBestBuy && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-semibold">
                                  <Star className="h-3 w-3" />
                                  Best Sell
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                              <ArrowLeftRight className="h-3 w-3" />
                              {r.fromCurrency} → {r.toCurrency}
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div className="p-2.5 rounded-lg bg-surface-50 dark:bg-surface-900">
                                <p className="text-[10px] text-muted-foreground">Buy Rate</p>
                                <p className={`text-base font-bold transition-colors duration-500 ${isBestBuy ? "text-emerald-600 dark:text-emerald-400" : "text-surface-900 dark:text-white"}`}>
                                  {currencySymbols[r.fromCurrency]} {formatRate(r.buyRate)}
                                </p>
                              </div>
                              <div className="p-2.5 rounded-lg bg-surface-50 dark:bg-surface-900">
                                <p className="text-[10px] text-muted-foreground">Sell Rate</p>
                                <p className={`text-base font-bold transition-colors duration-500 ${isBestSell ? "text-emerald-600 dark:text-emerald-400" : "text-surface-900 dark:text-white"}`}>
                                  {currencySymbols[r.fromCurrency]} {formatRate(r.sellRate)}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {timeAgo(r.updatedAt)}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                Spread: {formatRate(spread)}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="text-center mt-8">
            <p className="text-xs text-muted-foreground">
              Rates update every 8 seconds &middot; {totalCards} rate{totalCards !== 1 ? "s" : ""} displayed
            </p>
          </div>
        </div>
      </section>

      {/* PLATFORM FEATURES */}
      <section className="py-16 lg:py-24 bg-surface-50 dark:bg-surface-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-surface-900 dark:text-white">
              Everything You Need to Move Money Across Africa
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              From rate management to compliance tracking — one platform for your entire operation.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <div key={f.title} className="p-6 rounded-xl bg-white dark:bg-surface-800 border hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5 text-primary-600" />
                  </div>
                  <h3 className="font-semibold text-surface-900 dark:text-white mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 lg:py-24 bg-white dark:bg-surface-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-surface-900 dark:text-white">Get Started in Minutes</h2>
            <p className="text-muted-foreground mt-3">Three simple steps to start transferring money across Africa.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((s) => (
              <div key={s.number} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary-600">{s.number}</span>
                </div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button size="lg" className="gap-2" asChild>
              <Link href="/signup">
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* STATS BANNER */}
      <section className="py-16 bg-gradient-to-r from-primary to-primary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl lg:text-4xl font-bold text-white">{s.value}</p>
                <p className="text-primary-200 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24 bg-white dark:bg-surface-900">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl lg:text-4xl font-bold text-surface-900 dark:text-white">
            Ready to Transform Your Money Transfer Business?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Join leading financial companies across Africa. Start managing transfers, rates, and compliance from one dashboard.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="gap-2 text-base px-8" asChild>
              <Link href="/signup">
                Create Free Account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          <Button size="lg" variant="outline" className="gap-2 text-base px-8" asChild>
                <Link href="/contact">
                  Talk to Sales
                  <MessageSquare className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="ghost" className="gap-2 text-base px-8" asChild>
                <Link href="/tutorials">
                  <BookOpen className="h-4 w-4" />
                  Watch Tutorial
                </Link>
              </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
