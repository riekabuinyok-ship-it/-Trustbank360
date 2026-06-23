// TrustBank360 Sync Engine
// Handles batch syncing of offline queue items to the server

import { getPendingItems, markSynced, markFailed, markSyncing } from "../db/sync-queue"
import { createConflict } from "../db/conflicts"
import { storeRecord as dbStore, getRecord as dbGet } from "../db/client"
import { useNetworkStore } from "@/store/network-store"
import { useSyncStore } from "@/store/sync-store"
import { useOfflineStore } from "@/store/offline-store"

const MAX_RETRIES = 5
const BATCH_SIZE = 10

export type SyncResult = {
  synced: number
  failed: number
  conflicts: number
  errors: string[]
}

export async function syncAll(): Promise<SyncResult> {
  const networkState = useNetworkStore.getState()
  if (!networkState.isOnline) {
    return { synced: 0, failed: 0, conflicts: 0, errors: ["Offline"] }
  }

  const syncStore = useSyncStore.getState()
  if (syncStore.isSyncing) {
    return { synced: 0, failed: 0, conflicts: 0, errors: ["Already syncing"] }
  }

  useNetworkStore.getState().setSyncing(true)
  syncStore.setSyncing(true)

  const result: SyncResult = { synced: 0, failed: 0, conflicts: 0, errors: [] }

  try {
    const items = await getPendingItems(100)
    if (items.length === 0) {
      result.synced = 0
      return result
    }

    const totalItems = items.length
    const batches: typeof items[] = []

    for (let i = 0; i < totalItems; i += BATCH_SIZE) {
      batches.push(items.slice(i, i + BATCH_SIZE))
    }

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex]
      syncStore.setSyncProgress(
        Math.round((batchIndex / batches.length) * 100)
      )

      for (const item of batch) {
        if (item.retryCount >= MAX_RETRIES) {
          await markFailed(item.id, "Max retries exceeded")
          result.failed++
          continue
        }

        await markSyncing(item.id)

        try {
          const response = await sendToServer(item)
          if (response.success) {
            const syncResult = response.data
            await markSynced(item.id, syncResult)
            result.synced++

            // Update sync store
            syncStore.updatePendingCount(-1)
            syncStore.updateSyncedCount(1)
          } else if (response.conflict) {
            await createConflict({
              companyId: item.companyId,
              tableName: item.tableName,
              recordId: item.recordId || undefined,
              localPayload: item.payload,
              serverPayload: response.conflict.serverData,
              conflictType: (response.conflict.type || "DUPLICATE") as "DUPLICATE" | "MERGE" | "STALE",
              userId: item.userId,
            })
            await markFailed(item.id, `Conflict: ${response.conflict.type}`)
            result.conflicts++
            syncStore.updateConflictCount(1)
          } else {
            await markFailed(item.id, response.error || "Server error")
            result.failed++
            syncStore.updateFailedCount(1)
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Sync failed"
          await markFailed(item.id, errorMsg)
          result.failed++
          result.errors.push(errorMsg)
        }
      }
    }

    const now = Date.now()
    syncStore.setLastSync(now)
    useOfflineStore.getState().setLastSync(now)

    return result
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Sync engine error"
    result.errors.push(errorMsg)
    return result
  } finally {
    useNetworkStore.getState().setSyncing(false)
    syncStore.setSyncing(false)
    syncStore.setSyncProgress(100)
  }
}

async function sendToServer(item: {
  id: string
  tableName: string
  recordId: string | null
  action: string
  payload: any
  companyId: string
  userId: string
}): Promise<{ success: boolean; data?: any; conflict?: { type: string; serverData: any }; error?: string }> {
  const endpoint = getEndpointForTable(item.tableName, item.action, item.recordId)

  const response = await fetch(endpoint, {
    method: getHttpMethod(item.action),
    headers: {
      "Content-Type": "application/json",
      "x-sync-id": item.id,
      "x-offline-sync": "true",
    },
    body: ["DELETE"].includes(item.action) ? undefined : JSON.stringify(item.payload),
  })

  if (response.status === 409) {
    const conflictData = await response.json()
    return {
      success: false,
      conflict: {
        type: conflictData.conflictType || "MERGE",
        serverData: conflictData.serverData || conflictData,
      },
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Server error" }))
    return { success: false, error: errorData.error || `HTTP ${response.status}` }
  }

  const data = await response.json()
  return { success: true, data }
}

function getEndpointForTable(
  tableName: string,
  action: string,
  recordId: string | null
): string {
  const endpoints: Record<string, string> = {
    customers: "/api/customers",
    transfers: "/api/transfers",
    staff: "/api/staff",
    branches: "/api/branches",
    exchangeRates: "/api/exchange-rates",
    announcements: "/api/company/announcements",
  }

  const base = endpoints[tableName] || `/api/${tableName}`

  if (recordId && (action === "UPDATE" || action === "DELETE")) {
    return `${base}/${recordId}`
  }

  return base
}

function getHttpMethod(action: string): string {
  switch (action) {
    case "CREATE": return "POST"
    case "UPDATE": return "PATCH"
    case "DELETE": return "DELETE"
    default: return "POST"
  }
}
