// TrustBank360 Offline Audit Logger
// Records all offline actions for later sync to server

import { storeRecord, getAllRecords, getByIndex } from "./client"

export interface OfflineAuditLog {
  id: string
  userId: string
  companyId: string
  action: string
  resource: string
  details: string | null
  createdAt: number
  syncedAt: number | null
}

export async function logOfflineAudit(params: {
  userId: string
  companyId: string
  action: string
  resource: string
  details?: string
}): Promise<OfflineAuditLog> {
  const log: OfflineAuditLog = {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    userId: params.userId,
    companyId: params.companyId,
    action: params.action,
    resource: params.resource,
    details: params.details || null,
    createdAt: Date.now(),
    syncedAt: null,
  }

  await storeRecord("offlineAuditLogs", log)
  return log
}

export async function getOfflineAuditLogs(): Promise<OfflineAuditLog[]> {
  return getAllRecords<OfflineAuditLog>("offlineAuditLogs")
}

export async function getUnsyncedAuditLogs(): Promise<OfflineAuditLog[]> {
  return getByIndex<OfflineAuditLog>("offlineAuditLogs", "by_synced", null as any)
}

export async function getOfflineAuditLogsByCompany(
  companyId: string
): Promise<OfflineAuditLog[]> {
  return getByIndex<OfflineAuditLog>("offlineAuditLogs", "by_companyId", companyId)
}

export async function markAuditLogSynced(id: string): Promise<void> {
  const all = await getAllRecords<OfflineAuditLog>("offlineAuditLogs")
  const log = all.find((l) => l.id === id)
  if (!log) return

  log.syncedAt = Date.now()
  await storeRecord("offlineAuditLogs", log)
}

export async function markAllAuditLogsSynced(): Promise<number> {
  const unsynced = await getUnsyncedAuditLogs()
  for (const log of unsynced) {
    log.syncedAt = Date.now()
    await storeRecord("offlineAuditLogs", log)
  }
  return unsynced.length
}

export async function getUnsyncedAuditCount(): Promise<number> {
  const unsynced = await getUnsyncedAuditLogs()
  return unsynced.length
}
