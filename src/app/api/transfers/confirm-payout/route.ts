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
    return NextResponse.json({ error: "Only Branch Managers and Tellers can process payouts" }, { status: 403 })
  }

  if (!user.branchId) {
    return NextResponse.json({ error: "You must be assigned to a branch" }, { status: 403 })
  }

  try {
    const { transferId, secretCode } = await request.json()
    if (!transferId) {
      return NextResponse.json({ error: "transferId required" }, { status: 400 })
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
    if (!branchLink || branchLink.receiverBranchId !== user.branchId) {
      return NextResponse.json({ error: "Only the receiver branch can process payout" }, { status: 403 })
    }

    if (transfer.status !== "PENDING") {
      return NextResponse.json({ error: "This transaction is not pending payout. Current status: " + transfer.status }, { status: 400 })
    }

    // Verify secret code if provided
    if (secretCode && transfer.secretCode !== secretCode) {
      return NextResponse.json({ error: "Invalid Secret Code" }, { status: 400 })
    }

    const now = new Date()
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.transfer.update({
        where: { id: transferId },
        data: {
          status: "COMPLETED",
          paidById: user.id,
          paidAt: now,
        },
      })

      await logTransactionEvent({
        transferId,
        userId: user.id,
        action: "PAYOUT_CONFIRMED",
        details: `Payout completed by ${user.name}${secretCode ? `. Secret Code: ${secretCode}` : ""}`,
        branchId: user.branchId,
      })

      await logTransactionEvent({
        transferId,
        userId: user.id,
        action: "COMPLETED",
        details: `Transaction completed`,
        branchId: user.branchId,
      })

      await createAuditLog({
        userId: user.id,
        action: "TRANSFER_COMPLETED",
        resource: "Transfer",
        details: JSON.stringify({
          transactionNumber: transfer.transactionNumber,
          paidBy: user.name,
          branchId: user.branchId,
          paidAt: now.toISOString(),
        }),
        branchId: user.branchId,
        companyId: user.companyId,
      })

      const { notifyReceiverBranch } = await import("@/lib/log-event")
      await notifyReceiverBranch({
        companyId: user.companyId,
        receiverBranchId: branchLink.receiverBranchId,
        type: "PAYOUT_CONFIRMED",
        transferData: { userName: user.name, secretCode: transfer.secretCode },
        transferId,
      })

      return updated
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Confirm payout error:", error)
    return NextResponse.json({ error: "Failed to process payout" }, { status: 500 })
  }
}
