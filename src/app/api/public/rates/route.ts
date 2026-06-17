import { NextResponse } from "next/server"
import { fetchAllPublicRates, groupByPair, analyzePair, detectAnomalies } from "@/lib/rate-engine"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const country = searchParams.get("country")
  const fromCurrency = searchParams.get("from")
  const toCurrency = searchParams.get("to")
  const sort = searchParams.get("sort") || "latest"

  const allRates = await fetchAllPublicRates()

  // Filter by country
  let filtered = allRates
  if (country) filtered = filtered.filter((r) => r.companyCountry === country)
  if (fromCurrency) filtered = filtered.filter((r) => r.fromCurrency === fromCurrency)
  if (toCurrency) filtered = filtered.filter((r) => r.toCurrency === toCurrency)

  // Group and analyze
  const grouped = groupByPair(filtered)
  const analyses: any[] = []
  const bestBuyRates: any[] = []
  const bestSellRates: any[] = []

  Array.from(grouped.entries()).forEach(([, rates]) => {
    if (rates.length === 0) return
    const analysis = analyzePair(rates)
    const flags = detectAnomalies(rates, analysis)
    analyses.push({ ...analysis, flags })

    if (analysis.bestBuy) bestBuyRates.push(analysis.bestBuy)
    if (analysis.bestSell) bestSellRates.push(analysis.bestSell)
  })

  // Market-wide stats
  const allBuyRates = filtered.map((r) => r.buyRate)
  const allSellRates = filtered.map((r) => r.sellRate)
  const activeCompanies = Array.from(new Set(filtered.map((r) => r.companyId)))

  const marketStats = {
    averageBuy: allBuyRates.length ? allBuyRates.reduce((a, b) => a + b, 0) / allBuyRates.length : 0,
    averageSell: allSellRates.length ? allSellRates.reduce((a, b) => a + b, 0) / allSellRates.length : 0,
    activeCompanies: activeCompanies.length,
    bestBuyOverall: bestBuyRates.sort((a, b) => b.rate - a.rate)[0] || null,
    bestSellOverall: bestSellRates.sort((a, b) => a.rate - b.rate)[0] || null,
    totalRates: filtered.length,
  }

  // Sort analyses
  if (sort === "buy") {
    analyses.sort((a, b) => (b.bestBuy?.rate || 0) - (a.bestBuy?.rate || 0))
  } else if (sort === "sell") {
    analyses.sort((a, b) => (a.bestSell?.rate || Infinity) - (b.bestSell?.rate || Infinity))
  } else {
    analyses.sort((a, b) => {
      const aLatest = Math.max(...a.rates.map((r: any) => new Date(r.updatedAt).getTime()))
      const bLatest = Math.max(...b.rates.map((r: any) => new Date(r.updatedAt).getTime()))
      return bLatest - aLatest
    })
  }

  return NextResponse.json({
    analyses,
    stats: marketStats,
  })
}
