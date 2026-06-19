"use client"

import { useState, useEffect, useCallback } from "react"
import { ForexLayout } from "@/components/forex-layout"
import { ForexNavbar } from "@/components/forex-navbar"
import { ForexFooter } from "@/components/forex-footer"

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
    <ForexLayout>
      <ForexNavbar />

      <section className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#00FF88]/20 text-[#00FF88]/80 text-xs font-mono mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse" />
              LIVE MARKET · UPDATED {lastUpdated}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">Exchange Rate Marketplace</h1>
            <p className="text-white/40 mt-3">Complete list of live rates from all active licensed exchange companies.</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-8 justify-center">
            <select
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className="px-3 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm font-mono focus:border-[#00FF88]/30 outline-none"
            >
              <option value="" className="bg-[#050505]">All From</option>
              {CURRENCIES.map((c) => (
                <option key={c} value={c} className="bg-[#050505]">{c}</option>
              ))}
            </select>
            <span className="text-white/20 flex items-center">→</span>
            <select
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              className="px-3 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm font-mono focus:border-[#00FF88]/30 outline-none"
            >
              <option value="" className="bg-[#050505]">All To</option>
              {CURRENCIES.map((c) => (
                <option key={c} value={c} className="bg-[#050505]">{c}</option>
              ))}
            </select>
            {(filterFrom || filterTo) && (
              <button
                onClick={() => { setFilterFrom(""); setFilterTo("") }}
                className="px-3 py-2 rounded-lg border border-white/10 text-white/40 text-sm hover:text-white/70 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Rates Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 rounded-full border-2 border-[#00FF88]/20 border-t-[#00FF88] animate-spin" />
            </div>
          ) : allRates.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-white/30 text-sm font-mono">No exchange rates available</p>
            </div>
          ) : (
            <div className="space-y-6">
              {allRates.map((pair: any) => (
                <div key={pair.pair} className="rounded-xl border border-white/5 bg-white/[0.01] overflow-hidden">
                  <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                    <span className="text-sm font-bold text-white font-mono">{pair.pair}</span>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-white/30">
                        Best Buy: <span className="text-[#00FF88]/80 font-mono">{pair.bestBuy?.rate.toFixed(0)}</span>
                      </span>
                      <span className="text-white/30">
                        Best Sell: <span className="text-red-400/80 font-mono">{pair.bestSell?.rate.toFixed(0)}</span>
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {pair.rates
                        .sort((a: any, b: any) => b.buyRate - a.buyRate)
                        .map((rate: any, i: number) => {
                          const phoneClean = rate.companyPhone ? rate.companyPhone.replace(/\D/g, "") : ""
                          return (
                            <div
                              key={`${rate.companyId}-${i}`}
                              className={`p-4 rounded-lg border transition-colors ${
                                i === 0
                                  ? "border-[#00FF88]/20 bg-[#00FF88]/5"
                                  : "border-white/5 bg-white/[0.01] hover:border-white/10"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-sm font-medium ${i === 0 ? "text-[#00FF88]" : "text-white/80"}`}>
                                  {rate.companyName}
                                </span>
                                {i === 0 && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#00FF88]/20 text-[#00FF88] font-mono">
                                    BEST
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 mb-2">
                                <div>
                                  <span className="text-[10px] text-white/30 block">Buy</span>
                                  <span className="text-sm font-mono font-bold text-[#00FF88]/70">{rate.buyRate.toFixed(0)}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-white/30 block">Sell</span>
                                  <span className="text-sm font-mono font-bold text-red-400/70">{rate.sellRate.toFixed(0)}</span>
                                </div>
                              </div>
                              <div className="text-[10px] text-white/20 space-y-0.5">
                                {rate.companyPhone && (
                                  <p>Phone: <a href={`tel:${rate.companyPhone}`} className="text-white/40 hover:text-[#00FF88]">{rate.companyPhone}</a></p>
                                )}
                                {phoneClean && (
                                  <p>WhatsApp: <a href={`https://wa.me/${phoneClean}`} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[#00FF88]">Chat ↗</a></p>
                                )}
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

      <ForexFooter />
    </ForexLayout>
  )
}
