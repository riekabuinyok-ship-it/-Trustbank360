"use client"

import { useState, useEffect, useCallback } from "react"
import { PublicLayout } from "@/components/public-layout"

const CURRENCIES = ["SSP", "USD", "KES", "UGX", "EUR", "GBP", "AED"]

export default function ExchangeRatesPage() {
  const [allRates, setAllRates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterFrom, setFilterFrom] = useState("")
  const [filterTo, setFilterTo] = useState("")
  const [lastUpdated, setLastUpdated] = useState("")

  const fetchAll = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filterFrom) params.set("from", filterFrom)
      if (filterTo) params.set("to", filterTo)
      const res = await fetch(`/api/public/rates?${params.toString()}`)
      if (!res.ok) return
      const data = await res.json()
      if (data.analyses) setAllRates(data.analyses)
      setLastUpdated(new Date().toLocaleTimeString())
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [filterFrom, filterTo])

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 8000)
    return () => clearInterval(interval)
  }, [fetchAll])

  return (
    <PublicLayout>
      <section className="pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Market · Updated {lastUpdated}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold">Exchange Rate Marketplace</h1>
            <p className="text-muted-foreground mt-3">Complete list of live rates from all active licensed exchange companies.</p>
          </div>

          <div className="flex flex-wrap gap-3 mb-8 justify-center">
            <select value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)}
              className="px-3 py-2 rounded-lg border border-input bg-background text-sm font-mono focus:ring-2 focus:ring-primary/30 outline-none">
              <option value="">All From</option>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <span className="text-muted-foreground flex items-center">→</span>
            <select value={filterTo} onChange={(e) => setFilterTo(e.target.value)}
              className="px-3 py-2 rounded-lg border border-input bg-background text-sm font-mono focus:ring-2 focus:ring-primary/30 outline-none">
              <option value="">All To</option>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {(filterFrom || filterTo) && (
              <button onClick={() => { setFilterFrom(""); setFilterTo("") }}
                className="px-3 py-2 rounded-lg border border-input text-sm text-muted-foreground hover:text-foreground transition-colors">
                Clear
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 rounded-full border-2 border-emerald-300 border-t-emerald-600 dark:border-emerald-800 dark:border-t-emerald-400 animate-spin" />
            </div>
          ) : allRates.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-sm">No exchange rates available</p>
            </div>
          ) : (
            <div className="space-y-6">
              {allRates.map((pair: any) => (
                <div key={pair.pair} className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="px-5 py-3 border-b border-border flex items-center justify-between flex-wrap gap-2">
                    <span className="text-sm font-bold font-mono">{pair.pair}</span>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-muted-foreground">
                        Best Buy: <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{pair.bestBuy?.rate.toFixed(0)}</span>
                      </span>
                      <span className="text-muted-foreground">
                        Best Sell: <span className="text-red-500 font-mono font-bold">{pair.bestSell?.rate.toFixed(0)}</span>
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {pair.rates.sort((a: any, b: any) => b.buyRate - a.buyRate).map((rate: any, i: number) => {
                        const phoneClean = rate.companyPhone ? rate.companyPhone.replace(/\D/g, "") : ""
                        return (
                          <div key={`${rate.companyId}-${i}`}
                            className={`p-4 rounded-lg border transition-colors ${
                              i === 0
                                ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/5"
                                : "border-border hover:border-primary/20"
                            }`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-sm font-medium ${i === 0 ? "text-emerald-700 dark:text-emerald-300" : ""}`}>{rate.companyName}</span>
                              {i === 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-mono">BEST</span>}
                            </div>
                            <div className="flex items-center gap-4 mb-2">
                              <div>
                                <span className="text-[10px] text-muted-foreground block">Buy</span>
                                <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">{rate.buyRate.toFixed(0)}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-muted-foreground block">Sell</span>
                                <span className="text-sm font-mono font-bold text-red-500">{rate.sellRate.toFixed(0)}</span>
                              </div>
                            </div>
                            <div className="text-[10px] text-muted-foreground space-y-0.5">
                              {rate.companyPhone && <p>Phone: <a href={`tel:${rate.companyPhone}`} className="text-primary hover:underline">{rate.companyPhone}</a></p>}
                              {phoneClean && <p>WhatsApp: <a href={`https://wa.me/${phoneClean}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Chat ↗</a></p>}
                              {rate.companyAddress && <p className="truncate">{rate.companyAddress}</p>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  )
}
