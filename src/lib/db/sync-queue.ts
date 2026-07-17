// TrustBank360 Sync Queue Manager
// Manages the queue of offline mutations that need to be synced to the server

import {
  storeRecord,
  getRecord,
  getAllRecords,
  getByIndex,
  countByIndex,
  deleteRecord,
  clearStore,
} from "./client"

export interface SyncQueueItem {
  id: string
  companyId: string
  userId: string
  tableName: string
  recordId: string | null
  action: "CREATE" | "UPDATE" | "DELETE"
  payload: any
  status: "PENDING" | "SYNCING" | "SYNCED" | "FAILED"
  retryCount: number
  lastError: string | null
  lastAttemptAt: number | null
  createdAt: number
  syncedAt: number | null
}

export async function enqueue(params: {
  companyId: string
  userId: string
  tableName: string
  recordId?: string
  action: "CREATE" | "UPDATE" | "DELETE"
  payload: any
}): Promise<SyncQueueItem> {
  const item: SyncQueueItem = {
    id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    companyId: params.companyId,
    userId: params.userId,
    tableName: params.tableName,
    recordId: params.recordId || null,
    action: params.action,
    payload: params.payload,
    status: "PENDING",
    retryCount: 0,
    lastError: null,
    lastAttemptAt: null,
    createdAt: Date.now(),
    syncedAt: null,
  }

  await storeRecord("syncQueue", item)
  return item
}

export async function markSynced(
  id: string,
  serverPayload?: any
): Promise<void> {
  const item = await getRecord<SyncQueueItem>("syncQueue", id)
  if (!item) return

  item.status = "SYNCED"
  item.syncedAt = Date.now()
  if (serverPayload) {
    item.payload = { ...item.payload, _serverResponse: serverPayload }
  }

  await storeRecord("syncQueue", item)
}

export async function markFailed(
  id: string,
  error: string
): Promise<void> {
  const item = await getRecord<SyncQueueItem>("syncQueue", id)
  if (!item) return

  item.status = "FAILED"
  item.retryCount += 1
  item.lastError = error

  await storeRecord("syncQueue", item)
}

export async function markSyncing(id: string): Promise<void> {
  const item = await getRecord<SyncQueueItem>("syncQueue", id)
  if (!item) return

  item.status = "SYNCING"
  item.lastAttemptAt = Date.now()
  await storeRecord("syncQueue", item)
}

export async function getPendingItems(
  limit: number = 50
): Promise<SyncQueueItem[]> {
  const all = await getAllRecords<SyncQueueItem>("syncQueue")
  return all
    .filter((item) => item.status === "PENDING")
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(0, limit)
}

export async function getFailedItems(
  limit: number = 100
): Promise<SyncQueueItem[]> {
  const all = await getAllRecords<SyncQueueItem>("syncQueue")
  return all
    .filter((item) => item.status === "FAILED")
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit)
}

export async function getSyncedItems(
  limit: number = 100
): Promise<SyncQueueItem[]> {
  const all = await getAllRecords<SyncQueueItem>("syncQueue")
  return all
    .filter((item) => item.status === "SYNCED")
    .sort((a, b) => (b.syncedAt || 0) - (a.syncedAt || 0))
    .slice(0, limit)
}

export async function getAllQueueItems(): Promise<SyncQueueItem[]> {
  return getAllRecords<SyncQueueItem>("syncQueue")
}

export async function getPendingCount(): Promise<number> {
  return countByIndex("syncQueue", "by_status", "PENDING")
}

export async function getFailedCount(): Promise<number> {
  return countByIndex("syncQueue", "by_status", "FAILED")
}

export async function getSyncedCount(): Promise<number> {
  return countByIndex("syncQueue", "by_status", "SYNCED")
}

export async function getTotalCount(): Promise<number> {
  const all = await getAllRecords<SyncQueueItem>("syncQueue")
  return all.length
}

export async function retryFailedItem(id: string): Promise<void> {
  const item = await getRecord<SyncQueueItem>("syncQueue", id)
  if (!item || item.status !== "FAILED") return

  item.status = "PENDING"
  item.lastError = null
  await storeRecord("syncQueue", item)
}

export async function retryAllFailed(): Promise<number> {
  const failed = await getFailedItems(1000)
  let count = 0
  for (const item of failed) {
    item.status = "PENDING"
    item.lastError = null
    await storeRecord("syncQueue", item)
    count++
  }
  return count
}

export async function deleteQueueItem(id: string): Promise<void> {
  await deleteRecord("syncQueue", id)
}

export async function clearSyncedItems(): Promise<void> {
  const synced = await getSyncedItems(10000)
  for (const item of synced) {
    await deleteRecord("syncQueue", item.id)
  }
}

export async function clearAllQueueItems(): Promise<void> {
  await clearStore("syncQueue")
}

export async function getStaleSyncingItems(
  thresholdMs: number
): Promise<SyncQueueItem[]> {
  const all = await getAllRecords<SyncQueueItem>("syncQueue")
  const now = Date.now()
  return all.filter(
    (item) =>
      item.status === "SYNCING" &&
      item.lastAttemptAt &&
      now - item.lastAttemptAt > thresholdMs
  )
}
