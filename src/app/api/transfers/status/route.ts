import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  try {
    const { transferId, action, reason } = await request.json()

    const transfer = await prisma.transfer.findUnique({
      where: { id: transferId },
      include: { branchLink: true },
    })

    if (!transfer || transfer.companyId !== user.companyId) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    if (user.role !== "BRANCH_MANAGER" && user.role !== "branch_manager" && user.role !== "TELLER" && user.role !== "teller") {
      return NextResponse.json({ error: "Only Branch Managers and Tellers can update transaction status" }, { status: 403 })
    }

    if (action === "cancel") {
      if (transfer.status === "COMPLETED") {
        return NextResponse.json({ error: "Cannot cancel a completed transaction" }, { status: 400 })
      }
      if (transfer.branchLink?.senderBranchId !== user.branchId) {
        return NextResponse.json({ error: "Only the sender branch can cancel" }, { status: 403 })
      }
      if (!reason) {
        return NextResponse.json({ error: "Cancellation reason is required" }, { status: 400 })
      }

      const updated = await prisma.transfer.update({
        where: { id: transferId },
        data: { status: "CANCELLED", cancellationReason: reason, cancelledAt: new Date() },
      })

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "TRANSACTION_CANCELLED",
          resource: "TRANSFER",
          details: `Transaction ${transfer.transactionNumber} cancelled. Reason: ${reason}`,
          branchId: user.branchId,
          companyId: user.companyId,
        },
      })

      return NextResponse.json(updated)
    }

    if (action === "reverse") {
      if (transfer.status === "COMPLETED") {
        return NextResponse.json({ error: "Cannot reverse a completed transaction" }, { status: 400 })
      }
      if (transfer.branchLink?.senderBranchId !== user.branchId) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
      }
      if (!reason) {
        return NextResponse.json({ error: "Reversal reason is required" }, { status: 400 })
      }

      const updated = await prisma.transfer.update({
        where: { id: transferId },
        data: { status: "REVERSED", reversalReason: reason, reversedAt: new Date() },
      })

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "TRANSACTION_REVERSED",
          resource: "TRANSFER",
          details: `Transaction ${transfer.transactionNumber} reversed. Reason: ${reason}`,
          branchId: user.branchId,
          companyId: user.companyId,
        },
      })

      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 })
  }
}
