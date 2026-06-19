// TrustBank360 Sync Conflict Manager
// Handles conflict detection and resolution for offline sync

import { storeRecord, getRecord, getAllRecords, getByIndex, countByIndex } from "./client"

export interface SyncConflict {
  id: string
  companyId: string
  tableName: string
  recordId: string | null
  localPayload: any
  serverPayload: any
  conflictType: "DUPLICATE" | "MERGE" | "STALE"
  status: "PENDING_REVIEW" | "RESOLVED" | "DISCARDED"
  resolvedBy: string | null
  resolvedAt: number | null
  createdById: string
  createdAt: number
}

export async function createConflict(params: {
  companyId: string
  tableName: string
  recordId?: string
  localPayload: any
  serverPayload: any
  conflictType: "DUPLICATE" | "MERGE" | "STALE"
  userId: string
}): Promise<SyncConflict> {
  const conflict: SyncConflict = {
    id: `conflict_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    companyId: params.companyId,
    tableName: params.tableName,
    recordId: params.recordId || null,
    localPayload: params.localPayload,
    serverPayload: params.serverPayload,
    conflictType: params.conflictType,
    status: "PENDING_REVIEW",
    resolvedBy: null,
    resolvedAt: null,
    createdById: params.userId,
    createdAt: Date.now(),
  }

  await storeRecord("syncConflicts", conflict)
  return conflict
}

export async function resolveConflict(
  id: string,
  resolution: "RESOLVED" | "DISCARDED",
  resolvedBy: string
): Promise<void> {
  const conflict = await getRecord<SyncConflict>("syncConflicts", id)
  if (!conflict) return

  conflict.status = resolution
  conflict.resolvedBy = resolvedBy
  conflict.resolvedAt = Date.now()
  await storeRecord("syncConflicts", conflict)
}

export async function getConflicts(
  filter?: { status?: string; tableName?: string; conflictType?: string }
): Promise<SyncConflict[]> {
  const all = await getAllRecords<SyncConflict>("syncConflicts")
  let filtered = all

  if (filter?.status) {
    filtered = filtered.filter((c) => c.status === filter.status)
  }
  if (filter?.tableName) {
    filtered = filtered.filter((c) => c.tableName === filter.tableName)
  }
  if (filter?.conflictType) {
    filtered = filtered.filter((c) => c.conflictType === filter.conflictType)
  }

  return filtered.sort((a, b) => b.createdAt - a.createdAt)
}

export async function getUnresolvedConflicts(): Promise<SyncConflict[]> {
  return getConflicts({ status: "PENDING_REVIEW" })
}

export async function getUnresolvedConflictCount(): Promise<number> {
  const unresolved = await getUnresolvedConflicts()
  return unresolved.length
}

export async function getConflictsByTable(
  tableName: string
): Promise<SyncConflict[]> {
  return getConflicts({ tableName })
}

export async function getConflictsByType(
  conflictType: "DUPLICATE" | "MERGE" | "STALE"
): Promise<SyncConflict[]> {
  return getConflicts({ conflictType })
}

export function detectDuplicateCustomer(
  existingCustomers: any[],
  newCustomer: any
): any | null {
  if (!newCustomer) return null

  const phone = newCustomer.phone?.replace(/[^0-9]/g, "")
  const idNumber = newCustomer.idNumber?.toLowerCase().trim()

  for (const existing of existingCustomers) {
    const existingPhone = existing.phone?.replace(/[^0-9]/g, "")
    const existingIdNumber = existing.idNumber?.toLowerCase().trim()

    if (phone && existingPhone && phone === existingPhone) {
      return { existing, matchField: "phone" }
    }
    if (idNumber && existingIdNumber && idNumber === existingIdNumber) {
      return { existing, matchField: "idNumber" }
    }
  }

  return null
}

export function detectDuplicateTransaction(
  existingTransfers: any[],
  newTransfer: any
): any | null {
  if (!newTransfer) return null

  const txNumber = newTransfer.transactionNumber?.toLowerCase().trim()
  const secretCode = newTransfer.secretCode?.toLowerCase().trim()

  for (const existing of existingTransfers) {
    if (txNumber && existing.transactionNumber?.toLowerCase() === txNumber) {
      return { existing, matchField: "transactionNumber" }
    }
    if (secretCode && existing.secretCode?.toLowerCase() === secretCode) {
      return { existing, matchField: "secretCode" }
    }
  }

  return null
}

export function detectStaleEdit(
  localObject: any,
  serverObject: any
): boolean {
  if (!localObject || !serverObject) return false

  const localUpdated = new Date(localObject.updatedAt || localObject.createdAt || 0).getTime()
  const serverUpdated = new Date(serverObject.updatedAt || serverObject.createdAt || 0).getTime()

  // If server has a newer version and local also has changes, it's stale
  return serverUpdated > localUpdated
}
