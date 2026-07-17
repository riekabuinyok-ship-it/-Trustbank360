// TrustBank360 Data Seeder
// Seeds IndexedDB with server data for offline use

"use client"

import { storeRecord, getRecord, getAllRecords, storeMany } from "@/lib/db/client"
import { useNetworkStore } from "@/store/network-store"
import { useOfflineStore } from "@/store/offline-store"

const SEED_META_KEY = "seedMeta"

export interface SeedMeta {
  companyId: string
  lastSeedAt: number
  seedStatus: "pending" | "complete" | "error"
  errors: string[]
}

async function safeFetch<T>(url: string): Promise<T | null> {
  if (!useNetworkStore.getState().isOnline) return null
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function seedDashboard(companyId: string): Promise<boolean> {
  const data = await safeFetch<any>("/api/dashboard")
  if (!data) return false
  await storeRecord("dashboard", { key: `dashboard_${companyId}`, data, cachedAt: Date.now() })
  return true
}

export async function getCachedDashboard(companyId: string): Promise<any | null> {
  const cached = await getRecord<any>("dashboard", `dashboard_${companyId}`)
  return cached?.data || null
}

export async function seedTransfers(companyId: string): Promise<number> {
  const data = await safeFetch<any>("/api/transfers")
  if (!data) return 0
  const transfers = Array.isArray(data) ? data : (data.data || data.transfers || [])
  if (transfers.length > 0) {
    await storeMany("transfers", transfers.map((t: any) => ({ ...t, companyId })))
  }
  return transfers.length
}

export async function seedCustomers(companyId: string): Promise<number> {
  const data = await safeFetch<any>("/api/customers")
  if (!data) return 0
  const customers = Array.isArray(data) ? data : (data.data || data.customers || [])
  if (customers.length > 0) {
    await storeMany("customers", customers.map((c: any) => ({ ...c, companyId })))
  }
  return customers.length
}

export async function seedStaff(companyId: string): Promise<number> {
  const data = await safeFetch<any>("/api/staff")
  if (!data) return 0
  const staff = Array.isArray(data) ? data : (data.data || data.staff || [])
  if (staff.length > 0) {
    await storeMany("staff", staff.map((s: any) => ({ ...s, companyId })))
  }
  return staff.length
}

export async function seedBranches(companyId: string): Promise<number> {
  const data = await safeFetch<any>("/api/branches")
  if (!data) return 0
  const branches = Array.isArray(data) ? data : (data.data || data.branches || [])
  if (branches.length > 0) {
    await storeMany("branches", branches.map((b: any) => ({ ...b, companyId })))
  }
  return branches.length
}

export async function seedExchangeRates(companyId: string): Promise<number> {
  const data = await safeFetch<any>("/api/exchange-rates")
  if (!data) return 0
  const rates = Array.isArray(data) ? data : (data.data || data.rates || [])
  if (rates.length > 0) {
    await storeMany("exchangeRates", rates.map((r: any) => ({ ...r, companyId })))
  }
  return rates.length
}

export async function seedAnnouncements(companyId: string): Promise<number> {
  const data = await safeFetch<any>("/api/company/announcements")
  if (!data) return 0
  const items = Array.isArray(data) ? data : (data.data || data.announcements || [])
  if (items.length > 0) {
    await storeMany("announcements", items.map((a: any) => ({ ...a, companyId })))
  }
  return items.length
}

export async function seedReports(companyId: string): Promise<number> {
  const data = await safeFetch<any>("/api/support/reports")
  if (!data) return 0
  const reports = Array.isArray(data) ? data : (data.data || data.reports || [])
  if (reports.length > 0) {
    await storeMany("reports", reports.map((r: any) => ({ ...r, companyId })))
  }
  return reports.length
}

export async function seedProviders(companyId: string): Promise<number> {
  const data = await safeFetch<any>("/api/providers")
  if (!data) return 0
  const providers = Array.isArray(data) ? data : (data.data || data.providers || [])
  if (providers.length > 0) {
    await storeMany("providers", providers.map((p: any) => ({ ...p, companyId })))
  }
  return providers.length
}

export async function seedCommissionSettings(companyId: string): Promise<number> {
  const data = await safeFetch<any>("/api/commissions/settings")
  if (!data) return 0
  const settings = Array.isArray(data) ? data : (data.data || data.settings || [])
  if (settings.length > 0) {
    await storeMany("commissionSettings", settings.map((s: any) => ({ ...s, companyId })))
  }
  return settings.length
}

export async function seedAll(companyId: string): Promise<void> {
  if (!useNetworkStore.getState().isOnline) return

  const meta: SeedMeta = {
    companyId,
    lastSeedAt: Date.now(),
    seedStatus: "pending",
    errors: [],
  }

  try {
    await Promise.allSettled([
      seedDashboard(companyId),
      seedTransfers(companyId),
      seedCustomers(companyId),
      seedStaff(companyId),
      seedBranches(companyId),
      seedExchangeRates(companyId),
      seedAnnouncements(companyId),
      seedReports(companyId),
      seedProviders(companyId),
      seedCommissionSettings(companyId),
    ])

    meta.seedStatus = "complete"
    meta.lastSeedAt = Date.now()
    useOfflineStore.getState().setLastSync(Date.now())
  } catch {
    meta.seedStatus = "error"
    meta.errors.push("Failed to seed data")
  }

  await storeRecord("seedMeta", meta)
}

export async function getLastSeedTime(companyId: string): Promise<Date | null> {
  try {
    const meta = await getRecord<SeedMeta>("seedMeta", companyId)
    return meta?.lastSeedAt ? new Date(meta.lastSeedAt) : null
  } catch {
    return null
  }
}
