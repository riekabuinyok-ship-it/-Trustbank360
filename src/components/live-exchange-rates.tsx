"use client"

import { useState, useEffect, useRef } from "react"
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react"

interface RateAnalysis {
  pair: string
  bestBuy: { rate: number; provider: string } | null
  bestSell: { rate: number; provider: string } | null
  spread: number
  activeProviders: number
  rates: any[]
}

export function LiveExchangeRates() {
  const [analyses, setAnalyses] = useState<RateAnalysis[]>([])
  const [lastUpdated, setLastUpdated] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  async function fetchRates() {
    try {
      const res = await fetch("/api/public/rates?sort=latest")
      if (!res.ok) return
      const data = await res.json()
      if (data.analyses) {
        setAnalyses(data.analyses.slice(0, 6))
        setLastUpdated(new Date().toLocaleTimeString())
      }
    } catch {
      // ignore fetch errors silently
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRates()
    intervalRef.current = setInterval(fetchRates, 8000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  if (loading) {
    return (
      <section className="py-6 bg-surface-100 dark:bg-surface-900/50 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading live exchange rates...
          </div>
        </div>
      </section>
    )
  }

  if (analyses.length === 0) {
    return (
      <section className="py-6 bg-surface-100 dark:bg-surface-900/50 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Live Exchange Rate Market
            </h3>
            <span className="text-xs text-muted-foreground">No rates available</span>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-6 bg-surface-100 dark:bg-surface-900/50 border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Live Exchange Rate Market
            <span className="text-xs font-normal text-muted-foreground">Real-time rates from active providers. Updated every 8 seconds.</span>
          </h3>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <RefreshCw className="h-3 w-3" />
            {lastUpdated}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {analyses.map((a) => (
            <div key={a.pair} className="bg-card rounded-xl border border-border p-3 hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-primary">{a.pair}</span>
                <span className="text-[10px] text-muted-foreground">{a.activeProviders} providers</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">Buy</span>
                  <span className="text-xs font-semibold text-secondary">
                    {a.bestBuy ? a.bestBuy.rate.toFixed(4) : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">Sell</span>
                  <span className="text-xs font-semibold text-destructive">
                    {a.bestSell ? a.bestSell.rate.toFixed(4) : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-border">
                  <span className="text-[10px] text-muted-foreground">Spread</span>
                  <span className="text-[10px] font-medium">{a.spread.toFixed(4)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
