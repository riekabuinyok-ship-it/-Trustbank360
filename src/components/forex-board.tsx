"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"

interface RateItem {
  id: string
  companyName: string
  companyPhone: string | null
  companyAddress: string | null
  buyRate: number
  sellRate: number
  previousBuyRate?: number
  direction?: "up" | "down" | "same"
}

interface PairGroup {
  pair: string
  from: string
  to: string
  rates: RateItem[]
}

const CURRENCIES = ["SSP", "USD", "KES", "UGX", "EUR", "GBP", "AED"]

function NeonRate({ value, isBest, direction }: { value: number; isBest: boolean; direction?: "up" | "down" | "same" }) {
  const prevRef = useRef(value)
  const [flash, setFlash] = useState<string>("")

  useEffect(() => {
    if (prevRef.current !== value) {
      const dir = value > prevRef.current ? "up" : "down"
      setFlash(dir === "up" ? "flash-green" : "flash-red")
      prevRef.current = value
      const t = setTimeout(() => setFlash(""), 600)
      return () => clearTimeout(t)
    }
  }, [value])

  const arrow = direction === "up" ? "▲" : direction === "down" ? "▼" : ""
  const arrowColor = direction === "up" ? "text-emerald-500" : direction === "down" ? "text-red-500" : "text-muted-foreground"

  return (
    <span className={`inline-flex items-center gap-1.5 transition-all duration-300 ${
      flash === "flash-green" ? "bg-emerald-500/10 rounded px-1 -mx-1" :
      flash === "flash-red" ? "bg-red-500/10 rounded px-1 -mx-1" : ""
    }`}>
      <span className={`font-mono text-lg sm:text-xl lg:text-2xl font-bold tracking-wider tabular-nums ${
        isBest ? "text-emerald-600 dark:text-emerald-400" : ""
      }`}>
        {value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
      </span>
      <span className={`text-xs ${arrowColor}`}>{arrow}</span>
    </span>
  )
}

export function ForexBoard() {
  const [pairGroups, setPairGroups] = useState<PairGroup[]>([])
  const [lastUpdated, setLastUpdated] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedRate, setSelectedRate] = useState<RateItem | null>(null)
  const [selectedPair, setSelectedPair] = useState<string>("")
  const [activeCurrency, setActiveCurrency] = useState<string>("ALL")
  const prevRatesRef = useRef<Map<string, number>>(new Map())

  const fetchRates = useCallback(async () => {
    try {
      const res = await fetch("/api/public/rates?sort=buy")
      if (!res.ok) return
      const data = await res.json()
      if (!data.analyses) return

      const groups: PairGroup[] = []
      data.analyses.forEach((a: any) => {
        if (!a.rates || a.rates.length === 0) return
        const items: RateItem[] = a.rates
          .sort((r1: any, r2: any) => r2.buyRate - r1.buyRate)
          .map((r: any) => {
            const key = `${a.pair}-${r.companyId}`
            const prev = prevRatesRef.current.get(key)
            prevRatesRef.current.set(key, r.buyRate)
            const dir = prev === undefined ? undefined : r.buyRate > prev ? "up" as const : r.buyRate < prev ? "down" as const : "same" as const
            return {
              id: r.id || `${a.pair}-${r.companyId}`,
              companyName: r.companyName,
              companyPhone: r.companyPhone || null,
              companyAddress: r.companyAddress || null,
              buyRate: r.buyRate,
              sellRate: r.sellRate,
              previousBuyRate: prev,
              direction: dir,
            }
          })
        groups.push({ pair: a.pair, from: a.fromCurrency, to: a.toCurrency, rates: items })
      })

      setPairGroups(groups.slice(0, 12))
      setLastUpdated(new Date().toLocaleTimeString())
    } catch {
      if (pairGroups.length === 0) {
        setPairGroups([])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRates()
    const interval = setInterval(fetchRates, 8000)
    return () => clearInterval(interval)
  }, [fetchRates])

  const filtered = activeCurrency === "ALL"
    ? pairGroups
    : pairGroups.filter((g) => g.from === activeCurrency || g.to === activeCurrency)

  const allPairRates = pairGroups.flatMap((g) =>
    g.rates.map((r) => ({ ...r, pair: g.pair, from: g.from, to: g.to }))
  )
  const selectedPairRates = allPairRates
    .filter((r) => r.pair === selectedPair)
    .sort((a, b) => b.buyRate - a.buyRate)

  if (loading) {
    return (
      <section className="py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-10 h-10 rounded-full border-2 border-emerald-300 border-t-emerald-600 dark:border-emerald-800 dark:border-t-emerald-400 animate-spin mb-3" />
          <p className="text-muted-foreground text-sm">Loading live exchange rates...</p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 bg-surface-50 dark:bg-surface-900/50 border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Market · Updated {lastUpdated}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold">Live Exchange Rate Market</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Real-time rates from active providers. Updated every 8 seconds.
          </p>
        </div>

        {/* Currency Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          <button
            onClick={() => { setActiveCurrency("ALL"); setSelectedRate(null); setSelectedPair("") }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              activeCurrency === "ALL"
                ? "bg-primary text-primary-foreground border-primary"
                : "border-input hover:border-primary/50"
            }`}
          >
            ALL
          </button>
          {CURRENCIES.map((c) => (
            <button key={c} onClick={() => { setActiveCurrency(c); setSelectedRate(null); setSelectedPair("") }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                activeCurrency === c
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-input hover:border-primary/50"
              }`}
            >{c}</button>
          ))}
        </div>

        {/* Live Exchange Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((group) => {
            const bestRate = group.rates[0]
            return (
              <button
                key={group.pair}
                onClick={() => setSelectedPair(selectedPair === group.pair ? "" : group.pair)}
                className={`text-left p-4 rounded-xl border transition-all ${
                  selectedPair === group.pair
                    ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/10"
                    : "border-border bg-card hover:border-muted-foreground/20"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-muted-foreground font-mono tracking-wider">
                    {group.from}/{group.to}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {group.rates.length} provider{group.rates.length > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="mb-2">
                  <NeonRate value={bestRate.buyRate} isBest={true} direction={bestRate.direction} />
                </div>

                {group.rates.length > 1 && (
                  <div className="space-y-1 mt-2 pt-2 border-t border-border">
                    {group.rates.slice(1, 4).map((r) => (
                      <div key={r.id} className="flex items-center justify-between">
                        <NeonRate value={r.buyRate} isBest={false} direction={r.direction} />
                        <span className="text-[10px] text-muted-foreground truncate ml-2 max-w-[80px]">{r.companyName}</span>
                      </div>
                    ))}
                    {group.rates.length > 4 && (
                      <span className="text-[10px] text-muted-foreground pl-1">+{group.rates.length - 4} more</span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Company Detail Panel */}
        {selectedPair && (
          <div className="mt-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/5 p-6 animate-in fade-in duration-300">
            <h3 className="text-sm font-bold mb-4 font-mono">
              {selectedPair} — All Providers
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedPairRates.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRate(selectedRate?.id === r.id ? null : r)}
                  className={`text-left p-4 rounded-lg border transition-all ${
                    selectedRate?.id === r.id
                      ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/10"
                      : "border-border bg-card hover:border-primary/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{r.companyName}</span>
                    <span className="text-[10px] text-muted-foreground">{r.direction === "up" ? "↑" : r.direction === "down" ? "↓" : ""}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Buy</span>
                      <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">{r.buyRate.toFixed(0)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Sell</span>
                      <span className="text-sm font-mono font-bold text-red-500">{r.sellRate.toFixed(0)}</span>
                    </div>
                  </div>

                  {selectedRate?.id === r.id && (
                    <div className="mt-3 pt-3 border-t border-border space-y-2 animate-in fade-in duration-200">
                      {r.companyPhone && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">Phone:</span>
                          <a href={`tel:${r.companyPhone}`} className="text-primary hover:underline">{r.companyPhone}</a>
                        </div>
                      )}
                      {r.companyPhone && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">WhatsApp:</span>
                          <a href={`https://wa.me/${r.companyPhone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Chat on WhatsApp ↗</a>
                        </div>
                      )}
                      {r.companyAddress && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">Address:</span>
                          <span className="text-foreground/80">{r.companyAddress}</span>
                        </div>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* View All CTA */}
        <div className="mt-8 text-center">
          <Link href="/exchange-rates" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-600 transition-colors group">
            View All Exchange Rates
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </Link>
        </div>

        {/* Market Stats */}
        <div className="mt-8 border-t border-border pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "24H Volume", value: "—" },
              { label: "Active Companies", value: pairGroups.length > 0 ? new Set(pairGroups.flatMap(g => g.rates.map(r => r.companyName))).size : "—" },
              { label: "Total Pairs", value: pairGroups.length },
            ].map((stat) => (
              <div key={stat.label} className="p-4 rounded-xl border border-border text-center">
                <span className="text-[10px] text-muted-foreground font-mono uppercase">{stat.label}</span>
                <p className="text-xl font-mono font-bold mt-1">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
