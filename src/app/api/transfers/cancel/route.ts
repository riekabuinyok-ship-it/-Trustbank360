import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logTransactionEvent, createAuditLog } from "@/lib/log-event"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  if (user.role !== "BRANCH_MANAGER" && user.role !== "branch_manager" && user.role !== "TELLER" && user.role !== "teller") {
    return NextResponse.json({ error: "Only Branch Managers and Tellers can cancel transactions" }, { status: 403 })
  }

  try {
    const { transferId, reason } = await request.json()
    if (!transferId || !reason) {
      return NextResponse.json({ error: "transferId and reason required" }, { status: 400 })
    }

    const transfer = await prisma.transfer.findUnique({
      where: { id: transferId },
      include: { branchLink: true },
    })
    if (!transfer) {
      return NextResponse.json({ error: "Transfer not found" }, { status: 404 })
    }
    if (transfer.companyId !== user.companyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const branchLink = transfer.branchLink
    if (!branchLink || branchLink.senderBranchId !== user.branchId) {
      return NextResponse.json({ error: "Only the sender branch can cancel this transaction" }, { status: 403 })
    }

    if (transfer.status !== "PENDING") {
      return NextResponse.json({ error: "Can only cancel PENDING transactions" }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.transfer.update({
        where: { id: transferId },
        data: {
          status: "CANCELLED",
          cancellationReason: reason,
          cancelledAt: new Date(),
        },
      })

      await logTransactionEvent({
        transferId,
        userId: user.id,
        action: "CANCELLED",
        details: `Transaction cancelled. Reason: ${reason}`,
        branchId: user.branchId,
      })

      await createAuditLog({
        userId: user.id,
        action: "TRANSFER_CANCELLED",
        resource: "Transfer",
        details: JSON.stringify({
          transactionNumber: transfer.transactionNumber,
          reason,
          branchId: user.branchId,
        }),
        branchId: user.branchId,
        companyId: user.companyId,
      })

      const { notifySenderBranch } = await import("@/lib/log-event")
      await notifySenderBranch({
        companyId: user.companyId,
        senderBranchId: branchLink.senderBranchId,
        type: "CANCELLED",
        transferData: { reason, secretCode: transfer.secretCode, transactionNumber: transfer.transactionNumber },
        transferId,
      })

      return updated
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Cancel error:", error)
    return NextResponse.json({ error: "Failed to cancel transaction" }, { status: 500 })
  }
}
