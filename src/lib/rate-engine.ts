import { prisma } from "@/lib/prisma"

export interface RateRecord {
  id: string
  companyId: string
  companyName: string
  companyCountry: string
  fromCurrency: string
  toCurrency: string
  buyRate: number
  sellRate: number
  updatedAt: Date
  createdAt: Date
}

export interface PairAnalysis {
  pair: string
  fromCurrency: string
  toCurrency: string
  rates: RateRecord[]
  bestBuy: { rate: number; companyName: string; companyId: string } | null
  bestSell: { rate: number; companyName: string; companyId: string } | null
  averageBuy: number
  averageSell: number
  spread: number
  trend: "rising" | "falling" | "stable"
  topProvider: string | null
  competitiveProviders: string[]
  lowPerformanceProviders: string[]
}

export interface RankedCompany {
  companyId: string
  companyName: string
  score: number
  buyRateRank: number
  sellRateRank: number
  freshnessScore: number
}

export async function fetchAllPublicRates(): Promise<RateRecord[]> {
  const rates = await prisma.exchangeRate.findMany({
    where: { isActive: true, isPublic: true },
    include: {
      company: { select: { id: true, name: true, country: true } },
    },
    orderBy: { updatedAt: "desc" },
  })

  return rates.map((r) => ({
    id: r.id,
    companyId: r.company.id,
    companyName: r.company.name,
    companyCountry: r.company.country,
    fromCurrency: r.fromCurrency,
    toCurrency: r.toCurrency,
    buyRate: r.buyRate,
    sellRate: r.sellRate,
    updatedAt: r.updatedAt,
    createdAt: r.createdAt,
  }))
}

export function groupByPair(rates: RateRecord[]): Map<string, RateRecord[]> {
  const groups = new Map<string, RateRecord[]>()
  for (const r of rates) {
    const key = `${r.fromCurrency}→${r.toCurrency}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(r)
  }
  return groups
}

export function analyzePair(rates: RateRecord[]): PairAnalysis {
  const pair = `${rates[0]?.fromCurrency || "?"}→${rates[0]?.toCurrency || "?"}`
  const fromCurrency = rates[0]?.fromCurrency || ""
  const toCurrency = rates[0]?.toCurrency || ""

  // Best buy = max buy rate (customer gets more)
  const bestBuyRate = Math.max(...rates.map((r) => r.buyRate))
  const bestBuy = rates.find((r) => r.buyRate === bestBuyRate) || null

  // Best sell = min sell rate (customer pays less)
  const bestSellRate = Math.min(...rates.map((r) => r.sellRate))
  const bestSell = rates.find((r) => r.sellRate === bestSellRate) || null

  // Averages
  const averageBuy = rates.reduce((s, r) => s + r.buyRate, 0) / rates.length
  const averageSell = rates.reduce((s, r) => s + r.sellRate, 0) / rates.length

  // Spread
  const spread = averageSell - averageBuy

  // Trend: compare latest vs previous (by updatedAt)
  const sorted = [...rates].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  const latest: RateRecord[] = []
  const previous: RateRecord[] = []
  for (const r of sorted) {
    const isLatest = latest.length === 0 || r.updatedAt.getTime() === latest[0].updatedAt.getTime()
    if (isLatest) latest.push(r)
    else previous.push(r)
  }

  const prevAvgBuy = previous.length
    ? previous.reduce((s, r) => s + r.buyRate, 0) / previous.length
    : averageBuy

  const prevAvgSell = previous.length
    ? previous.reduce((s, r) => s + r.sellRate, 0) / previous.length
    : averageSell

  let trend: "rising" | "falling" | "stable"
  const buyDelta = averageBuy - prevAvgBuy
  const sellDelta = averageSell - prevAvgSell
  if (buyDelta > 0.01 || sellDelta > 0.01) trend = "rising"
  else if (buyDelta < -0.01 || sellDelta < -0.01) trend = "falling"
  else trend = "stable"

  // Ranking: score = buy_rank + sell_rank + freshness
  const ranked = rankCompanies(rates)

  const topProvider = ranked.length > 0 ? ranked[0].companyName : null
  const competitiveProviders = ranked.filter((c) => c.score <= 5).map((c) => c.companyName)
  const lowPerformanceProviders = ranked.filter((c) => c.score > 8).map((c) => c.companyName)

  return {
    pair,
    fromCurrency,
    toCurrency,
    rates,
    bestBuy: bestBuy
      ? { rate: bestBuyRate, companyName: bestBuy.companyName, companyId: bestBuy.companyId }
      : null,
    bestSell: bestSell
      ? { rate: bestSellRate, companyName: bestSell.companyName, companyId: bestSell.companyId }
      : null,
    averageBuy,
    averageSell,
    spread,
    trend,
    topProvider,
    competitiveProviders,
    lowPerformanceProviders,
  }
}

export function rankCompanies(rates: RateRecord[]): RankedCompany[] {
  const unique = new Map<string, { companyId: string; companyName: string; rates: RateRecord[] }>()
  for (const r of rates) {
    if (!unique.has(r.companyId)) {
      unique.set(r.companyId, { companyId: r.companyId, companyName: r.companyName, rates: [] })
    }
    unique.get(r.companyId)!.rates.push(r)
  }

  // Rank by buy rate (higher is better)
  const byBuy = [...rates].sort((a, b) => b.buyRate - a.buyRate)
  const buyRanks = new Map<string, number>()
  byBuy.forEach((r, i) => buyRanks.set(r.companyId, i + 1))

  // Rank by sell rate (lower is better)
  const bySell = [...rates].sort((a, b) => a.sellRate - b.sellRate)
  const sellRanks = new Map<string, number>()
  bySell.forEach((r, i) => sellRanks.set(r.companyId, i + 1))

  // Freshness: companies with most recent updates get bonus
  const now = Date.now()
  const freshnessScores = new Map<string, number>()
  Array.from(unique.entries()).forEach(([cid, entry]) => {
    const latest = Math.max(...entry.rates.map((r) => r.updatedAt.getTime()))
    const minsAgo = (now - latest) / 60000
    freshnessScores.set(cid, Math.max(0, 10 - minsAgo / 10))
  })

  const ranked: RankedCompany[] = []
  Array.from(unique.entries()).forEach(([cid, entry]) => {
    const bRank = buyRanks.get(cid) || rates.length
    const sRank = sellRanks.get(cid) || rates.length
    const freshness = freshnessScores.get(cid) || 0
    const score = bRank + sRank + (10 - freshness)
    ranked.push({
      companyId: cid,
      companyName: entry.companyName,
      score,
      buyRateRank: bRank,
      sellRateRank: sRank,
      freshnessScore: Math.round(freshness * 10) / 10,
    })
  })

  return ranked.sort((a, b) => a.score - b.score)
}

export function detectAnomalies(rates: RateRecord[], pairAnalysis: PairAnalysis): string[] {
  const flags: string[] = []
  const threshold = 0.05

  for (const r of rates) {
    if (pairAnalysis.averageBuy !== 0 && Math.abs(r.buyRate - pairAnalysis.averageBuy) / pairAnalysis.averageBuy > threshold) {
      flags.push(`${r.companyName}: buy rate deviates >${threshold * 100}% from market average`)
    }
    if (pairAnalysis.averageSell !== 0 && Math.abs(r.sellRate - pairAnalysis.averageSell) / pairAnalysis.averageSell > threshold) {
      flags.push(`${r.companyName}: sell rate deviates >${threshold * 100}% from market average`)
    }
  }

  return flags
}

export async function getPublicRateAnalysis() {
  const allRates = await fetchAllPublicRates()
  const grouped = groupByPair(allRates)
  const analyses: PairAnalysis[] = []

  Array.from(grouped.entries()).forEach(([, rates]) => {
    if (rates.length > 0) {
      analyses.push(analyzePair(rates))
    }
  })

  return analyses
}
