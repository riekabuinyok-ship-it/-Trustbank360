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
  isFirst: boolean
}

const CURRENCIES = ["SSP", "USD", "KES", "UGX", "EUR", "GBP", "AED"]

const DIGITAL_CHARS: Record<string, string> = {
  "0": "M12 4a8 8 0 100 16 8 8 0 000-16zm0 2a6 6 0 110 12 6 6 0 010-12z",
}

function DigitalChar({ char }: { char: string }) {
  return (
    <span className="inline-block w-[0.6em] text-center font-mono tabular-nums">{char}</span>
  )
}

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
  const arrowColor = direction === "up" ? "text-[#00FF88]" : direction === "down" ? "text-red-400" : "text-white/20"

  return (
    <span className={`inline-flex items-center gap-1.5 transition-all duration-300 ${
      flash === "flash-green" ? "bg-[#00FF88]/10 rounded px-1 -mx-1" :
      flash === "flash-red" ? "bg-red-500/10 rounded px-1 -mx-1" : ""
    }`}>
      <span className={`font-mono text-lg sm:text-xl lg:text-2xl font-bold tracking-wider tabular-nums ${
        isBest ? "text-[#00FF88] drop-shadow-[0_0_12px_rgba(0,255,136,0.5)]" : "text-white/80"
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
      const allRates: any[] = []

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
        groups.push({ pair: a.pair, from: a.fromCurrency, to: a.toCurrency, rates: items, isFirst: true })
        allRates.push(...items)
      })

      setPairGroups(groups.slice(0, 12))
      setLastUpdated(new Date().toLocaleTimeString())
    } catch {
      // silent
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
      <section className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 rounded-full border-2 border-[#00FF88]/20 border-t-[#00FF88] animate-spin mb-4" />
          <p className="text-white/40 text-sm font-mono">Connecting to exchange network...</p>
        </div>
      </section>
    )
  }

  return (
    <section className="relative px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      {/* Background grid effect */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)", backgroundSize: "40px 40px" }}
      />

      <div className="relative max-w-7xl mx-auto">
        {/* Market status bar */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse" />
            <span className="text-xs text-white/40 font-mono">LIVE MARKET</span>
            <span className="text-[10px] text-white/20 font-mono">UPDATED {lastUpdated}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/20 font-mono">
              {pairGroups.length} pairs · {pairGroups.reduce((s, g) => s + g.rates.length, 0)} providers
            </span>
          </div>
        </div>

        {/* Currency Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => { setActiveCurrency("ALL"); setSelectedRate(null); setSelectedPair("") }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              activeCurrency === "ALL"
                ? "bg-[#00FF88]/10 border-[#00FF88]/30 text-[#00FF88]"
                : "border-white/10 text-white/40 hover:border-white/30 hover:text-white/70"
            }`}
          >
            ALL
          </button>
          {CURRENCIES.map((c) => (
            <button
              key={c}
              onClick={() => { setActiveCurrency(c); setSelectedRate(null); setSelectedPair("") }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                activeCurrency === c
                  ? "bg-[#00FF88]/10 border-[#00FF88]/30 text-[#00FF88]"
                  : "border-white/10 text-white/40 hover:border-white/30 hover:text-white/70"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Live Exchange Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((group) => {
            const bestRate = group.rates[0]
            return (
              <button
                key={group.pair}
                onClick={() => {
                  if (selectedPair === group.pair) {
                    setSelectedPair("")
                    setSelectedRate(null)
                  } else {
                    setSelectedPair(group.pair)
                    setSelectedRate(null)
                  }
                }}
                className={`text-left p-4 rounded-xl border transition-all duration-300 ${
                  selectedPair === group.pair
                    ? "border-[#00FF88]/30 bg-[#00FF88]/5"
                    : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-white/50 font-mono tracking-wider">
                    {group.from}/{group.to}
                  </span>
                  <span className="text-[10px] text-white/20">
                    {group.rates.length} provider{group.rates.length > 1 ? "s" : ""}
                  </span>
                </div>

                {/* Best Rate - glows */}
                <div className="mb-2">
                  <NeonRate value={bestRate.buyRate} isBest={true} direction={bestRate.direction} />
                </div>

                {/* Other rates */}
                {group.rates.length > 1 && (
                  <div className="space-y-1 mt-2 pt-2 border-t border-white/5">
                    {group.rates.slice(1, 4).map((r) => (
                      <div key={r.id} className="flex items-center justify-between">
                        <NeonRate value={r.buyRate} isBest={false} direction={r.direction} />
                        <span className="text-[10px] text-white/20 truncate ml-2 max-w-[80px]">{r.companyName}</span>
                      </div>
                    ))}
                    {group.rates.length > 4 && (
                      <span className="text-[10px] text-white/20 pl-1">+{group.rates.length - 4} more</span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Company Detail Panel */}
        {selectedPair && (
          <div className="mt-6 rounded-xl border border-[#00FF88]/20 bg-[#00FF88]/5 p-6 animate-in slide-in-from-bottom-4 duration-300">
            <h3 className="text-sm font-bold text-white mb-4 font-mono">
              {selectedPair} — All Providers
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedPairRates.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRate(selectedRate?.id === r.id ? null : r)}
                  className={`text-left p-4 rounded-lg border transition-all ${
                    selectedRate?.id === r.id
                      ? "border-[#00FF88]/40 bg-[#00FF88]/10"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">{r.companyName}</span>
                    <span className="text-[10px] text-white/30">{r.direction === "up" ? "↑" : r.direction === "down" ? "↓" : ""}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-[10px] text-white/30 block">Buy</span>
                      <span className="text-sm font-mono font-bold text-[#00FF88]/70">{r.buyRate.toFixed(0)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-white/30 block">Sell</span>
                      <span className="text-sm font-mono font-bold text-red-400/70">{r.sellRate.toFixed(0)}</span>
                    </div>
                  </div>

                  {/* Expanded Company Details */}
                  {selectedRate?.id === r.id && (
                    <div className="mt-3 pt-3 border-t border-white/10 space-y-2 animate-in fade-in duration-200">
                      {r.companyPhone && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-white/30">Phone:</span>
                          <a href={`tel:${r.companyPhone}`} className="text-[#00FF88]/80 hover:text-[#00FF88]">{r.companyPhone}</a>
                        </div>
                      )}
                      {r.companyPhone && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-white/30">WhatsApp:</span>
                          <a
                            href={`https://wa.me/${r.companyPhone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#00FF88]/80 hover:text-[#00FF88]"
                          >
                            Chat on WhatsApp ↗
                          </a>
                        </div>
                      )}
                      {r.companyAddress && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-white/30">Address:</span>
                          <span className="text-white/60">{r.companyAddress}</span>
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
        <div className="mt-12 text-center">
          <Link
            href="/exchange-rates"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#00FF88]/10 border border-[#00FF88]/30 text-[#00FF88] font-semibold hover:bg-[#00FF88]/20 transition-colors text-lg group"
          >
            View All Exchange Rates
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </Link>
        </div>

        {/* Market Insights placeholder */}
        <div className="mt-16 border-t border-white/5 pt-8">
          <h3 className="text-sm font-bold text-white/30 font-mono tracking-wider mb-6">MARKET INSIGHTS</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {["24H Volume", "Active Companies", "Total Pairs"].map((label) => (
              <div key={label} className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                <span className="text-[10px] text-white/30 font-mono">{label}</span>
                <p className="text-lg font-mono font-bold text-white/60 mt-1">
                  {label === "24H Volume" ? "—" : label === "Active Companies" ? pairGroups.length > 0 ? new Set(pairGroups.flatMap(g => g.rates.map(r => r.companyName))).size : "—" : pairGroups.length}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
