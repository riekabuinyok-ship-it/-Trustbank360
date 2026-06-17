import { prisma } from "@/lib/prisma"

export async function logTransactionEvent(params: {
  transferId: string
  userId: string
  action: string
  details?: string
  branchId?: string
}) {
  return prisma.transactionEvent.create({
    data: {
      transferId: params.transferId,
      userId: params.userId,
      action: params.action,
      details: params.details,
      branchId: params.branchId,
    },
  })
}

export async function createAuditLog(params: {
  userId: string
  action: string
  resource: string
  details?: string
  branchId?: string
  companyId?: string | null
}) {
  return prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      resource: params.resource,
      details: params.details,
      branchId: params.branchId,
      companyId: params.companyId ?? null,
    },
  })
}

const notificationTemplates: Record<string, { title: string; getMessage: (d: any) => string }> = {
  TRANSACTION_CREATED: {
    title: "New Transaction",
    getMessage: (d) => `Transfer of ${d.amount} ${d.currency} created — Code: ${d.secretCode}`,
  },
  RECEIPT_PRINTED: {
    title: "Receipt Printed",
    getMessage: () => "Receipt has been printed",
  },
  RECEIPT_REPRINTED: {
    title: "Receipt Reprinted",
    getMessage: () => "Receipt has been reprinted",
  },
  CANCELLED: {
    title: "Transaction Cancelled",
    getMessage: (d) => `Transaction cancelled. Reason: ${d.reason || "N/A"}`,
  },
  REVERSED: {
    title: "Transaction Reversed",
    getMessage: (d) => `Transaction reversed. Reason: ${d.reason || "N/A"}`,
  },
  PAYOUT_CONFIRMED: {
    title: "Payout Completed",
    getMessage: (d) => `Customer paid by ${d.userName}`,
  },
  COMPLETED: {
    title: "Transaction Completed",
    getMessage: (d) => `Transaction completed at ${d.branchName || "N/A"}`,
  },
  INCOMING_TRANSFER: {
    title: "Incoming Transfer",
    getMessage: (d) => `New transfer received from ${d.senderBranch} — ${d.amount} ${d.currency}`,
  },
}

export async function createNotification(params: {
  userId: string
  companyId: string
  type: string
  title: string
  message: string
  link?: string
  transferId?: string
}) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      companyId: params.companyId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
    },
  })
}

export async function notifyStaff(params: {
  companyId: string
  type: string
  branchId?: string
  excludeUserId?: string
  transferData?: any
  transferId?: string
  link?: string
}) {
  const template = notificationTemplates[params.type]
  if (!template) return

  const title = template.title
  const message = template.getMessage(params.transferData || {})

  const where: any = { companyId: params.companyId, status: "ACTIVE" }
  if (params.branchId) where.branchId = params.branchId
  if (params.excludeUserId) where.id = { not: params.excludeUserId }

  const staff = await prisma.user.findMany({ where, select: { id: true } })

  await prisma.notification.createMany({
    data: staff.map((s) => ({
      userId: s.id,
      companyId: params.companyId,
      type: params.type,
      title,
      message,
      link: params.link || (params.transferId ? `/transfers` : undefined),
    })),
  })
}

export async function notifySenderBranch(params: {
  companyId: string
  senderBranchId: string
  type: string
  excludeUserId?: string
  transferData?: any
  transferId?: string
}) {
  return notifyStaff({
    companyId: params.companyId,
    branchId: params.senderBranchId,
    type: params.type,
    excludeUserId: params.excludeUserId,
    transferData: params.transferData,
    transferId: params.transferId,
    link: "/transfers",
  })
}

export async function notifyReceiverBranch(params: {
  companyId: string
  receiverBranchId: string
  type: string
  excludeUserId?: string
  transferData?: any
  transferId?: string
}) {
  return notifyStaff({
    companyId: params.companyId,
    branchId: params.receiverBranchId,
    type: params.type,
    excludeUserId: params.excludeUserId,
    transferData: params.transferData,
    transferId: params.transferId,
    link: "/transfers/payout",
  })
}
