// TrustBank360 Sync Request Handler
// Helper for API routes to handle offline sync headers and deduplication

import { prisma } from "@/lib/prisma"

export interface SyncRequest {
  syncId: string | null
  isSync: boolean
}

export function extractSyncInfo(request: Request): SyncRequest {
  const syncId = request.headers.get("x-sync-id")
  return {
    syncId,
    isSync: syncId !== null || request.headers.get("x-offline-sync") === "true",
  }
}

export function conflictResponse(type: string, serverData: any): Response {
  return new Response(
    JSON.stringify({
      conflictType: type,
      serverData,
      message: `Conflict detected: ${type}. Server data provided for resolution.`,
    }),
    {
      status: 409,
      headers: { "Content-Type": "application/json" },
    }
  )
}

export function dedupResponse(id: string): Response {
  return new Response(
    JSON.stringify({
      id,
      deduplicated: true,
      message: "This operation was already processed.",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  )
}

export async function checkDuplicateCustomer(
  companyId: string,
  phone?: string,
  idNumber?: string,
  excludeId?: string
): Promise<any | null> {
  if (!phone && !idNumber) return null

  const where: any[] = [{ companyId }]
  if (phone) {
    where.push({ phone: { equals: phone } })
  }
  if (idNumber) {
    where.push({ idNumber: { equals: idNumber } })
  }

  if (where.length <= 1) return null

  const existing = await prisma.customer.findFirst({
    where: {
      AND: [
        { AND: where },
        ...(excludeId ? [{ id: { not: excludeId } }] : []),
      ],
    },
  })

  return existing
}

export async function checkDuplicateTransfer(
  companyId: string,
  transactionNumber?: string,
  secretCode?: string,
  excludeId?: string
): Promise<any | null> {
  if (!transactionNumber && !secretCode) return null

  const where: any[] = [{ companyId }]
  if (transactionNumber) {
    where.push({ transactionNumber: { equals: transactionNumber } })
  }
  if (secretCode) {
    where.push({ secretCode: { equals: secretCode } })
  }

  if (where.length <= 1) return null

  const existing = await prisma.transfer.findFirst({
    where: {
      AND: [
        { AND: where },
        ...(excludeId ? [{ id: { not: excludeId } }] : []),
      ],
    },
  })

  return existing
}

export function syncRequiredResponse(error?: string): Response {
  return new Response(
    JSON.stringify({
      offline: true,
      syncRequired: true,
      error: error || "Operation requires server connectivity. Queued for sync.",
    }),
    {
      status: 202,
      headers: { "Content-Type": "application/json" },
    }
  )
}
