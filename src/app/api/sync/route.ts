// TrustBank360 Sync API Endpoint
// Receives and processes batch sync items from offline clients

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/log-event"
import {
  validateCustomerForSync,
  validateTransferForSync,
  validatePayoutForSync,
  validateStaffForSync,
} from "@/lib/sync/validators"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = session.user as any
  const companyId = user.companyId
  if (!companyId) {
    return NextResponse.json({ error: "No company" }, { status: 400 })
  }

  try {
    const body = await request.json()
    const { items } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ results: [] })
    }

    // Process items in order
    const results = []

    for (const item of items) {
      try {
        const result = await processSyncItem(item, companyId, user)
        results.push(result)
      } catch (error) {
        results.push({
          id: item.id,
          status: "FAILED",
          error: error instanceof Error ? error.message : "Processing error",
        })
      }
    }

    return NextResponse.json({ results, total: items.length, synced: results.filter((r) => r.status === "SYNCED").length })
  } catch (error) {
    console.error("Sync API error:", error)
    return NextResponse.json({ error: "Failed to process sync batch" }, { status: 500 })
  }
}

async function processSyncItem(
  item: any,
  companyId: string,
  user: any
): Promise<any> {
  const { id, tableName, recordId, action, payload } = item

  switch (tableName) {
    case "customers":
      return processCustomerSync(id, companyId, user, recordId, action, payload)
    case "transfers":
      return processTransferSync(id, companyId, user, recordId, action, payload)
    case "staff":
      return processStaffSync(id, companyId, user, recordId, action, payload)
    case "payouts":
      return processPayoutSync(id, companyId, user, recordId, action, payload)
    case "branches":
      return processBranchSync(id, companyId, user, recordId, action, payload)
    default:
      return { id, status: "SYNCED", serverId: null }
  }
}

async function processCustomerSync(
  syncId: string,
  companyId: string,
  user: any,
  recordId: string | null,
  action: string,
  payload: any
) {
  let existingCustomer = null
  if (recordId) {
    existingCustomer = await prisma.customer.findUnique({
      where: { id: recordId },
    })
  }

  const validation = validateCustomerForSync(existingCustomer, payload, syncId)
  if (!validation.valid) {
    if (validation.conflict) {
      return {
        id: syncId,
        status: "CONFLICT",
        conflictType: validation.conflict.type,
        conflict: { serverData: validation.conflict.serverData },
      }
    }
    return { id: syncId, status: "FAILED", error: validation.error }
  }

  let customer
  if (action === "CREATE") {
    customer = await prisma.customer.create({
      data: {
        fullName: payload.fullName,
        phone: payload.phone,
        nationality: payload.nationality,
        idType: payload.idType,
        idNumber: payload.idNumber,
        idDocument: payload.idDocument,
        verificationStatus: payload.verificationStatus || "UNVERIFIED",
        riskLevel: payload.riskLevel || "LOW",
        notes: payload.notes,
        companyId,
      },
    })
  } else if (action === "UPDATE" && recordId) {
    customer = await prisma.customer.update({
      where: { id: recordId },
      data: {
        fullName: payload.fullName,
        phone: payload.phone,
        nationality: payload.nationality,
        idType: payload.idType,
        idNumber: payload.idNumber,
        idDocument: payload.idDocument,
        verificationStatus: payload.verificationStatus,
        riskLevel: payload.riskLevel,
        notes: payload.notes,
      },
    })
  }

  // Create audit log
  await createAuditLog({
    userId: user.id,
    action: action === "CREATE" ? "CUSTOMER_CREATED" : "CUSTOMER_UPDATED",
    resource: "Customer",
    details: `Sync ${action.toLowerCase()} customer: ${payload.fullName}`,
    companyId,
  })

  return { id: syncId, status: "SYNCED", serverId: customer?.id }
}

async function processTransferSync(
  syncId: string,
  companyId: string,
  user: any,
  recordId: string | null,
  action: string,
  payload: any
) {
  let existingTransfer = null
  if (recordId) {
    existingTransfer = await prisma.transfer.findUnique({
      where: { id: recordId },
    })
  }

  const validation = validateTransferForSync(existingTransfer, payload, syncId)
  if (!validation.valid) {
    if (validation.conflict) {
      return {
        id: syncId,
        status: "CONFLICT",
        conflictType: validation.conflict.type,
        conflict: { serverData: validation.conflict.serverData },
      }
    }
    return { id: syncId, status: "FAILED", error: validation.error }
  }

  let transfer
  if (action === "CREATE") {
    transfer = await prisma.transfer.create({
      data: {
        transactionNumber: payload.transactionNumber,
        secretCode: payload.secretCode,
        transactionType: payload.transactionType,
        amount: payload.amount,
        currency: payload.currency,
        exchangeRate: payload.exchangeRate,
        commission: payload.commission || 0,
        commissionType: payload.commissionType || "INCLUDED",
        totalAmount: payload.totalAmount || payload.amount,
        senderAmount: payload.senderAmount,
        receiverAmount: payload.receiverAmount,
        status: payload.status || "PENDING",
        notes: payload.notes,
        senderId: payload.senderId,
        receiverId: payload.receiverId,
        companyId,
        issuedById: user.id,
        mobileProviderId: payload.mobileProviderId,
        receiverMobile: payload.receiverMobile,
        receiverIdNumber: payload.receiverIdNumber,
      },
    })

    await createAuditLog({
      userId: user.id,
      action: "TRANSFER_CREATED",
      resource: "Transfer",
      details: `Sync created transfer: ${payload.transactionNumber}`,
      companyId,
    })
  }

  return { id: syncId, status: "SYNCED", serverId: transfer?.id }
}

async function processStaffSync(
  syncId: string,
  companyId: string,
  user: any,
  recordId: string | null,
  action: string,
  payload: any
) {
  let existingStaff = null
  if (recordId && action !== "CREATE") {
    existingStaff = await prisma.user.findUnique({
      where: { id: recordId },
    })
  }

  const validation = validateStaffForSync(existingStaff, payload, syncId)
  if (!validation.valid) {
    if (validation.conflict) {
      return {
        id: syncId,
        status: "CONFLICT",
        conflictType: validation.conflict.type,
        conflict: { serverData: validation.conflict.serverData },
      }
    }
    return { id: syncId, status: "FAILED", error: validation.error }
  }

  let staff
  if (action === "CREATE") {
    staff = await prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        password: payload.password,
        role: payload.role,
        position: payload.position,
        status: payload.status || "INVITED",
        companyId,
        branchId: payload.branchId,
      },
    })
  } else if (action === "UPDATE" && recordId) {
    staff = await prisma.user.update({
      where: { id: recordId },
      data: {
        name: payload.name,
        email: payload.email,
        role: payload.role,
        position: payload.position,
        status: payload.status,
        branchId: payload.branchId,
      },
    })
  } else if (action === "DELETE" && recordId) {
    await prisma.user.update({
      where: { id: recordId },
      data: { status: "SUSPENDED" },
    })
  }

  await createAuditLog({
    userId: user.id,
    action: `STAFF_${action}`,
    resource: "Staff",
    details: `Sync ${action.toLowerCase()} staff: ${payload.name}`,
    companyId,
  })

  return { id: syncId, status: "SYNCED", serverId: staff?.id || recordId }
}

async function processPayoutSync(
  syncId: string,
  companyId: string,
  user: any,
  recordId: string | null,
  action: string,
  payload: any
) {
  let existingTransfer = null
  if (payload.transferId) {
    existingTransfer = await prisma.transfer.findUnique({
      where: { id: payload.transferId },
    })
  }

  const validation = validatePayoutForSync(existingTransfer, payload, syncId)
  if (!validation.valid) {
    if (validation.conflict) {
      return {
        id: syncId,
        status: "CONFLICT",
        conflictType: validation.conflict.type,
        conflict: { serverData: validation.conflict.serverData },
      }
    }
    return { id: syncId, status: "FAILED", error: validation.error }
  }

  if (existingTransfer) {
    await prisma.transfer.update({
      where: { id: payload.transferId },
      data: {
        status: "COMPLETED",
        paidById: user.id,
        paidAt: new Date(),
      },
    })
  }

  await createAuditLog({
    userId: user.id,
    action: "PAYOUT_CONFIRMED",
    resource: "Transfer",
    details: `Sync payout confirmation for transfer: ${payload.transactionNumber || payload.transferId}`,
    companyId,
  })

  return { id: syncId, status: "SYNCED", serverId: payload.transferId }
}

async function processBranchSync(
  syncId: string,
  companyId: string,
  user: any,
  recordId: string | null,
  action: string,
  payload: any
) {
  let branch
  if (action === "CREATE") {
    branch = await prisma.branch.create({
      data: {
        name: payload.name,
        code: payload.code,
        country: payload.country,
        state: payload.state,
        city: payload.city,
        address: payload.address,
        contactPhone: payload.contactPhone,
        contactEmail: payload.contactEmail,
        companyId,
        managerId: payload.managerId,
      },
    })
  } else if (action === "UPDATE" && recordId) {
    branch = await prisma.branch.update({
      where: { id: recordId },
      data: {
        name: payload.name,
        city: payload.city,
        address: payload.address,
        contactPhone: payload.contactPhone,
        contactEmail: payload.contactEmail,
        isActive: payload.isActive,
      },
    })
  }

  await createAuditLog({
    userId: user.id,
    action: `BRANCH_${action}`,
    resource: "Branch",
    details: `Sync ${action.toLowerCase()} branch: ${payload.name}`,
    companyId,
  })

  return { id: syncId, status: "SYNCED", serverId: branch?.id || recordId }
}
