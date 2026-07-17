// TrustBank360 Offline Data Hooks
// All hooks follow the same pattern: read from IndexedDB first, background sync when online

"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useNetworkStore } from "@/store/network-store"
import { useOfflineStore } from "@/store/offline-store"
import { storeRecord, getRecord, getAllRecords, getByIndex, getFirstByIndex, storeMany } from "@/lib/db/client"
import { enqueue } from "@/lib/db/sync-queue"
import { generateTransactionNumber, generateSecretCode, MOBILE_MONEY_TYPES } from "@/lib/utils"

type LoadingState = "loading" | "ready" | "error"

// ---- GENERIC OFFLINE HOOK ----
function useOfflineData<T>(
  cacheTable: string,
  apiUrl: string,
  options?: {
    companyId?: string
    filterByCompany?: boolean
    maxAge?: number // ms before cache is considered stale
  }
): {
  data: T[]
  loading: boolean
  error: string | null
  isFromCache: boolean
  refetch: () => Promise<void>
  saveLocally: (items: T[]) => Promise<void>
} {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState<LoadingState>("loading")
  const [error, setError] = useState<string | null>(null)
  const [isFromCache, setIsFromCache] = useState(false)
  const mounted = useRef(true)

  const loadFromCache = useCallback(async () => {
    try {
      let cached: T[]
      if (options?.companyId) {
        cached = await getByIndex<T>(cacheTable, "by_companyId", options.companyId)
      } else {
        cached = await getAllRecords<T>(cacheTable)
      }

      if (cached.length > 0 && mounted.current) {
        setData(cached)
        setIsFromCache(true)
        setLoading("ready")
      }
      return cached
    } catch {
      return []
    }
  }, [cacheTable, options?.companyId])

  const fetchFromServer = useCallback(async () => {
    const isOnline = useNetworkStore.getState().isOnline
    if (!isOnline) return

    try {
      const response = await fetch(apiUrl)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const serverData = await response.json()
      const items = Array.isArray(serverData) ? serverData : (serverData.data || serverData.results || [])

      if (items.length > 0) {
        await storeMany(cacheTable, items)
      }

      if (mounted.current) {
        setData(items)
        setIsFromCache(false)
        setLoading("ready")
        setError(null)
      }
    } catch (err) {
      if (mounted.current) {
        setError(err instanceof Error ? err.message : "Fetch failed")
        setLoading("ready")
      }
    }
  }, [cacheTable, apiUrl])

  const refetch = useCallback(async () => {
    setLoading("loading")
    await loadFromCache()
    await fetchFromServer()
  }, [loadFromCache, fetchFromServer])

  const saveLocally = useCallback(async (items: T[]) => {
    await storeMany(cacheTable, items)
    if (mounted.current) {
      setData(items)
    }
  }, [cacheTable])

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    const init = async () => {
      await loadFromCache()
      await fetchFromServer()
      interval = setInterval(fetchFromServer, 30000)
    }
    init()
    return () => clearInterval(interval)
  }, [loadFromCache, fetchFromServer])

  return {
    data,
    loading: loading === "loading",
    error,
    isFromCache,
    refetch,
    saveLocally,
  }
}

// ---- CUSTOMERS ----
export function useOfflineCustomers(companyId?: string) {
  return useOfflineData<any>("customers", "/api/customers", {
    companyId,
    filterByCompany: true,
  })
}

// ---- TRANSFERS ----
export function useOfflineTransfers(companyId?: string) {
  const base = useOfflineData<any>("transfers", "/api/transfers", {
    companyId,
    filterByCompany: true,
  })

  const createOfflineTransfer = useCallback(async (transferData: any, userId: string, companyId: string, companyName?: string) => {
    const transactionNumber = generateTransactionNumber()
    const isMobileMoney = MOBILE_MONEY_TYPES.includes(transferData.transactionType)
    const secretCode = isMobileMoney ? null : generateSecretCode(companyName || "TBN")

    const offlineTransfer = {
      ...transferData,
      transactionNumber,
      secretCode,
      id: transferData.id || `offline_${Date.now()}`,
      _syncStatus: "PENDING",
      _createdOffline: true,
      createdAt: new Date().toISOString(),
    }

    await storeRecord("transfers", offlineTransfer)
    await base.saveLocally([offlineTransfer, ...base.data])

    await enqueue({
      companyId,
      userId,
      tableName: "transfers",
      recordId: offlineTransfer.id,
      action: "CREATE",
      payload: { ...transferData, transactionNumber, secretCode },
    })

    useOfflineStore.getState().incrementQueuedOperations()

    return offlineTransfer
  }, [base])

  return { ...base, createOfflineTransfer }
}

// ---- STAFF ----
export function useOfflineStaff(companyId?: string) {
  return useOfflineData<any>("staff", "/api/staff", {
    companyId,
    filterByCompany: true,
  })
}

// ---- BRANCHES ----
export function useOfflineBranches(companyId?: string) {
  return useOfflineData<any>("branches", "/api/branches", {
    companyId,
    filterByCompany: true,
  })
}

// ---- PROVIDERS ----
export function useOfflineProviders(companyId?: string) {
  return useOfflineData<any>("providers", "/api/providers", {
    companyId,
    filterByCompany: true,
  })
}

// ---- COMMISSION SETTINGS ----
export function useOfflineCommissionSettings(companyId?: string) {
  return useOfflineData<any>("commissionSettings", "/api/commissions/settings", {
    companyId,
    filterByCompany: true,
  })
}

// ---- EXCHANGE RATES ----
export function useOfflineExchangeRates(companyId?: string) {
  return useOfflineData<any>("exchangeRates", "/api/exchange-rates", {
    companyId,
    filterByCompany: true,
  })
}

// ---- WALLETS ----
export function useOfflineWallets(companyId?: string) {
  return useOfflineData<any>("wallets", "/api/wallets", {
    companyId,
    filterByCompany: true,
  })
}

// ---- ANNOUNCEMENTS ----
export function useOfflineAnnouncements(companyId?: string) {
  return useOfflineData<any>("announcements", "/api/company/announcements", {
    companyId,
    filterByCompany: true,
  })
}

// ---- DASHBOARD ----
export function useOfflineDashboard(companyId?: string) {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState<LoadingState>("loading")
  const [isFromCache, setIsFromCache] = useState(false)

  const fetchDashboard = useCallback(async () => {
    const isOnline = useNetworkStore.getState().isOnline

    try {
      // Try server first
      if (isOnline) {
        const response = await fetch("/api/dashboard")
        if (response.ok) {
          const data = await response.json()
          // Cache the dashboard
          await storeRecord("dashboard", { key: "dashboard", data, cachedAt: Date.now() })

          setDashboardData(data)
          setIsFromCache(false)
          setLoading("ready")
          return
        }
      }

      // Fallback to cache
      const cached = await getRecord<any>("dashboard", "dashboard")
      if (cached?.data) {
        setDashboardData(cached.data)
        setIsFromCache(true)
        setLoading("ready")
      } else {
        setLoading("error")
      }
    } catch {
      const cached = await getRecord<any>("dashboard", "dashboard")
      if (cached?.data) {
        setDashboardData(cached.data)
        setIsFromCache(true)
        setLoading("ready")
      } else {
        setLoading("error")
      }
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
    const interval = setInterval(fetchDashboard, 60000)
    return () => clearInterval(interval)
  }, [fetchDashboard])

  return { dashboardData, loading: loading === "loading", isFromCache, refresh: fetchDashboard }
}

// ---- OFFLINE TRANSFER LOOKUP ----
export async function lookupOfflineTransfer(secretCode: string): Promise<any | null> {
  try {
    return await getFirstByIndex<any>("transfers", "by_secretCode", secretCode)
  } catch {
    // Index might not exist (e.g., stale DB version) — fallback to full scan
    try {
      const all = await getAllRecords<any>("transfers")
      return all.find((t) => t.secretCode === secretCode) || null
    } catch {
      return null
    }
  }
}

// ---- PAYOUTS ----
export function useOfflinePayouts() {
  const [payouts, setPayouts] = useState<any[]>([])
  const [loading, setLoading] = useState<LoadingState>("loading")

  const createOfflinePayout = useCallback(async (
    payoutData: any,
    userId: string,
    companyId: string,
    transferData?: any
  ) => {
    // Dedup: check if a payout for this transfer is already queued
    if (payoutData.transferId) {
      const allItems = await getAllRecords<any>("syncQueue")
      const hasPending = allItems.some(
        (item: any) =>
          item.recordId === payoutData.transferId &&
          item.tableName === "transfers" &&
          item.action === "UPDATE" &&
          (item.status === "PENDING" || item.status === "SYNCING")
      )
      if (hasPending) {
        throw new Error("A payout for this transaction is already queued for sync")
      }
    }

    const offlinePayout = {
      ...payoutData,
      id: `payout_${Date.now()}`,
      _syncStatus: "PENDING",
      createdAt: new Date().toISOString(),
    }

    await storeRecord("pendingPayouts", offlinePayout)

    await enqueue({
      companyId,
      userId,
      tableName: "transfers",
      recordId: payoutData.transferId,
      action: "UPDATE",
      payload: {
        status: "COMPLETED",
        paidById: userId,
        paidAt: new Date().toISOString(),
        secretCode: payoutData.secretCode,
      },
    })

    // Update local transfer record so subsequent lookups show it as paid
    if (transferData && payoutData.transferId) {
      const updated = {
        ...transferData,
        status: "COMPLETED",
        paidById: userId,
        paidAt: new Date().toISOString(),
        _localSyncStatus: "payout_queued",
      }
      await storeRecord("transfers", updated)
    }

    useOfflineStore.getState().incrementQueuedOperations()
    return offlinePayout
  }, [])

  useEffect(() => {
    const load = async () => {
      const cached = await getAllRecords<any>("pendingPayouts")
      setPayouts(cached)
      setLoading("ready")
    }
    load()
  }, [])

  return { payouts, loading: loading === "loading", createOfflinePayout }
}

// ---- REPORTS ----
export function useOfflineReports(companyId?: string) {
  const base = useOfflineData<any>("reports", "/api/support/reports", {
    companyId,
    filterByCompany: true,
  })

  const cacheReport = useCallback(async (report: any) => {
    const stored = { ...report, cachedAt: Date.now() }
    await storeRecord("reports", stored)
    await base.saveLocally([stored, ...base.data])
  }, [base])

  return { ...base, cacheReport }
}

// ---- KYC ----
export function useOfflineKYC(customerId?: string) {
  const [kycData, setKycData] = useState<any>(null)
  const [loading, setLoading] = useState<LoadingState>("loading")

  const updateKycOffline = useCallback(async (
    kycUpdate: any,
    userId: string,
    companyId: string
  ) => {
    await storeRecord("customers", { ...kycUpdate, id: customerId })

    await enqueue({
      companyId,
      userId,
      tableName: "customers",
      recordId: customerId,
      action: "UPDATE",
      payload: kycUpdate,
    })

    useOfflineStore.getState().incrementQueuedOperations()
  }, [customerId])

  useEffect(() => {
    const load = async () => {
      if (customerId) {
        const cached = await getRecord<any>("customers", customerId)
        if (cached) {
          setKycData(cached)
        }
      }
      setLoading("ready")
    }
    load()
  }, [customerId])

  return { kycData, loading: loading === "loading", updateKycOffline }
}

// ---- NOTIFICATIONS ----
export function useOfflineNotifications() {
  return useOfflineData<any>("notifications", "/api/notifications", {})
}

// ---- AUDIT LOGS ----
export function useOfflineAuditLogs() {
  return useOfflineData<any>("auditLogs", "/api/audit-logs", {})
}

// ---- COMPANY SETTINGS ----
export function useOfflineCompanySettings() {
  return useOfflineData<any>("settings", "/api/company", {})
}

// ---- ADMIN STATS (Platform Dashboard) ----
export function useOfflineAdminStats() {
  return useOfflineData<any>("apiCache", "/api/admin/analytics", { maxAge: 5 * 60 * 1000 })
}
