// TrustBank360 Sync Engine
// Handles batch syncing of offline queue items to the server
// v2: Exponential backoff, larger batches, stale SYNCING recovery

import { getPendingItems, markSynced, markFailed, markSyncing, getStaleSyncingItems } from "../db/sync-queue"
import type { SyncQueueItem } from "../db/sync-queue"
import { getRecord, storeRecord } from "../db/client"
import { createConflict } from "../db/conflicts"
import { useNetworkStore } from "@/store/network-store"
import { useSyncStore } from "@/store/sync-store"
import { useOfflineStore } from "@/store/offline-store"

const MAX_RETRIES = 5
const BATCH_SIZE = 50
const STALE_SYNCING_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes

function getBackoffMs(retryCount: number): number {
  if (retryCount <= 0) return 0
  const baseMs = 1000
  const maxMs = 60_000
  const jitter = Math.random() * 1000
  return Math.min(baseMs * Math.pow(2, retryCount - 1) + jitter, maxMs)
}

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
    await recoverStaleSyncingItems()

    const items = await getPendingItems(500)
    if (items.length === 0) {
      return result
    }

    const batches: typeof items[] = []
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      batches.push(items.slice(i, i + BATCH_SIZE))
    }

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex]
      syncStore.setSyncProgress(Math.round((batchIndex / batches.length) * 100))

      for (const item of batch) {
        if (item.retryCount >= MAX_RETRIES) {
          await markFailed(item.id, "Max retries exceeded")
          result.failed++
          continue
        }

        const backoffMs = getBackoffMs(item.retryCount)
        if (backoffMs > 0 && item.lastAttemptAt) {
          const elapsed = Date.now() - new Date(item.lastAttemptAt).getTime()
          if (elapsed < backoffMs) {
            continue
          }
        }

        await markSyncing(item.id)

        try {
          const response = await sendToServer(item)
          if (response.success) {
            await markSynced(item.id, response.data)

            // Sync succeeded — update local data store so offline lookups reflect server state
            if (item.tableName === "transfers" && item.action === "UPDATE" && item.recordId) {
              const serverTransfer = response.data?.transfer
              if (serverTransfer) {
                try {
                  await storeRecord("transfers", {
                    ...serverTransfer,
                    id: item.recordId,
                    _localSyncStatus: undefined,
                  })
                } catch {}
              }
            }

            result.synced++
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
            // Permission errors (403) should not be retried — block manual retry too
            if (response.permanentFailure) {
              try {
                const syncItem = await getRecord<SyncQueueItem>("syncQueue", item.id)
                if (syncItem) {
                  syncItem.retryCount = MAX_RETRIES
                  await storeRecord("syncQueue", syncItem)
                }
              } catch {}
            }
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

async function recoverStaleSyncingItems(): Promise<void> {
  try {
    const staleItems = await getStaleSyncingItems(STALE_SYNCING_THRESHOLD_MS)
    for (const item of staleItems) {
      await markFailed(item.id, "Stale SYNCING status recovered")
    }
  } catch {}
}

async function sendToServer(item: {
  id: string
  tableName: string
  recordId: string | null
  action: string
  payload: any
  companyId: string
  userId: string
}): Promise<{ success: boolean; data?: any; conflict?: { type: string; serverData: any }; error?: string; permanentFailure?: boolean }> {
  const endpoint = getEndpointForTable(item.tableName, item.action, item.recordId)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30_000)

  try {
    const response = await fetch(endpoint, {
      method: getHttpMethod(item.action),
      headers: {
        "Content-Type": "application/json",
        "x-sync-id": item.id,
        "x-offline-sync": "true",
      },
      body: ["DELETE"].includes(item.action) ? undefined : JSON.stringify(item.payload),
      signal: controller.signal,
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
      const errorMsg = errorData.error || `HTTP ${response.status}`
      // 403 errors are permission issues — immediate permanent failure
      if (response.status === 403) {
        return { success: false, error: errorMsg, permanentFailure: true }
      }
      return { success: false, error: errorMsg }
    }

    const data = await response.json()
    return { success: true, data }
  } finally {
    clearTimeout(timeout)
  }
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
