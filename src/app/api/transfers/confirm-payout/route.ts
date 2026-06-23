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
    const { transferId, secretCode, receiverNationality, receiverIdType, receiverIdNumber } = await request.json()
    if (!transferId) {
      return NextResponse.json({ error: "transferId required" }, { status: 400 })
    }

    const transfer = await prisma.transfer.findUnique({
      where: { id: transferId },
      include: { branchLink: true, receiver: true },
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

    // Require receiver ID verification for USD payouts
    if (transfer.currency === "USD") {
      const finalNationality = (receiverNationality || "").trim() || transfer.receiver?.nationality || ""
      const finalIdType = (receiverIdType || "").trim() || transfer.receiver?.idType || ""
      const finalIdNumber = (receiverIdNumber || "").trim() || transfer.receiver?.idNumber || ""

      if (!finalNationality || !finalIdType || !finalIdNumber) {
        return NextResponse.json({
          success: false,
          errorCode: "USD_ID_REQUIRED",
          title: "Receiver ID verification required",
          error: "Nationality, ID Type, and ID Number are required for USD payouts.",
          message: "Please collect the receiver's Nationality, ID Type, and ID Number before completing the USD payout.",
        }, { status: 400 })
      }
    }

    const now = new Date()
    const result = await prisma.$transaction(async (tx) => {
      // For USD payouts, persist the receiver ID info on the transfer
      const updateData: any = {
        status: "COMPLETED",
        paidById: user.id,
        paidAt: now,
      }
      if (transfer.currency === "USD") {
        updateData.receiverNationality = (receiverNationality || "").trim() || transfer.receiver?.nationality || null
        updateData.receiverIdType = (receiverIdType || "").trim() || transfer.receiver?.idType || null
        // Don't overwrite existing receiverIdNumber if no new one provided
        if (receiverIdNumber && receiverIdNumber.trim()) {
          updateData.receiverIdNumber = receiverIdNumber.trim()
        }
      }

      const updated = await tx.transfer.update({
        where: { id: transferId },
        data: updateData,
      })

      // Also update the receiver Customer record with any new ID info (for USD payouts)
      if (transfer.currency === "USD" && transfer.receiver) {
        const customerUpdate: any = {}
        if (receiverNationality && receiverNationality.trim()) {
          customerUpdate.nationality = receiverNationality.trim()
        }
        if (receiverIdType && receiverIdType.trim()) {
          customerUpdate.idType = receiverIdType.trim()
        }
        if (receiverIdNumber && receiverIdNumber.trim()) {
          customerUpdate.idNumber = receiverIdNumber.trim()
        }
        if (Object.keys(customerUpdate).length > 0) {
          await tx.customer.update({
            where: { id: transfer.receiver.id },
            data: customerUpdate,
          })
        }
      }

      await logTransactionEvent({
        transferId,
        userId: user.id,
        action: "PAYOUT_CONFIRMED",
        details: `Payout completed by ${user.name}`,
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
          ...(transfer.currency === "USD" && {
            receiverNationality: (receiverNationality || "").trim() || transfer.receiver?.nationality,
            receiverIdType: (receiverIdType || "").trim() || transfer.receiver?.idType,
            receiverIdNumber: (receiverIdNumber || "").trim() || transfer.receiver?.idNumber,
          }),
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
