import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logTransactionEvent, createAuditLog } from "@/lib/log-event"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  if (!user.branchId) {
    return NextResponse.json({ error: "You must be assigned to a branch" }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { status, paidById, paidAt, secretCode, notes } = body

    const transfer = await prisma.transfer.findUnique({
      where: { id },
      include: { branchLink: true, receiver: true },
    })
    if (!transfer) {
      return NextResponse.json({ error: "Transfer not found" }, { status: 404 })
    }
    if (transfer.companyId !== user.companyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (status === "COMPLETED") {
      const branchLink = transfer.branchLink
      if (!branchLink || branchLink.receiverBranchId !== user.branchId) {
        return NextResponse.json({ error: "Only the receiver branch can process payout" }, { status: 403 })
      }

      if (transfer.status !== "PENDING") {
        return NextResponse.json({ error: "This transaction is not pending payout. Current status: " + transfer.status }, { status: 400 })
      }

      if (secretCode && transfer.secretCode !== secretCode) {
        return NextResponse.json({ error: "Invalid Secret Code" }, { status: 400 })
      }

      const now = new Date()
      const updateData: any = {
        status: "COMPLETED",
        paidById: paidById || user.id,
        paidAt: paidAt ? new Date(paidAt) : now,
      }

      if (transfer.currency === "USD") {
        const { receiverNationality, receiverIdType, receiverIdNumber } = body
        const finalNationality = (receiverNationality || "").trim() || transfer.receiver?.nationality || ""
        const finalIdType = (receiverIdType || "").trim() || transfer.receiver?.idType || ""
        const finalIdNumber = (receiverIdNumber || "").trim() || transfer.receiver?.idNumber || ""

        if (!finalNationality || !finalIdType || !finalIdNumber) {
          return NextResponse.json({
            success: false,
            errorCode: "USD_ID_REQUIRED",
            error: "Nationality, ID Type, and ID Number are required for USD payouts.",
          }, { status: 400 })
        }

        updateData.receiverNationality = finalNationality
        updateData.receiverIdType = finalIdType
        if (receiverIdNumber && receiverIdNumber.trim()) {
          updateData.receiverIdNumber = receiverIdNumber.trim()
        }
      }

      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.transfer.update({
          where: { id },
          data: updateData,
        })

        if (transfer.currency === "USD" && transfer.receiver) {
          const { receiverNationality, receiverIdType, receiverIdNumber } = body
          const customerUpdate: any = {}
          if (receiverNationality && receiverNationality.trim()) customerUpdate.nationality = receiverNationality.trim()
          if (receiverIdType && receiverIdType.trim()) customerUpdate.idType = receiverIdType.trim()
          if (receiverIdNumber && receiverIdNumber.trim()) customerUpdate.idNumber = receiverIdNumber.trim()
          if (Object.keys(customerUpdate).length > 0) {
            await tx.customer.update({
              where: { id: transfer.receiver.id },
              data: customerUpdate,
            })
          }
        }

        await logTransactionEvent({
          transferId: id,
          userId: user.id,
          action: "PAYOUT_CONFIRMED",
          details: `Payout completed by ${user.name}`,
          branchId: user.branchId,
        })

        return updated
      })

      await createAuditLog({
        userId: user.id,
        action: "PAYOUT_COMPLETED",
        resource: "Transfer",
        details: `Payout confirmed for transfer ${transfer.transactionNumber}`,
        companyId: user.companyId,
      })

      return NextResponse.json({ success: true, transfer: result })
    }

    if (status) {
      const result = await prisma.transfer.update({
        where: { id },
        data: {
          status,
          ...(notes !== undefined && { notes }),
        },
      })

      await createAuditLog({
        userId: user.id,
        action: "TRANSFER_UPDATED",
        resource: "Transfer",
        details: `Transfer ${transfer.transactionNumber} status changed to ${status}`,
        companyId: user.companyId,
      })

      return NextResponse.json({ success: true, transfer: result })
    }

    return NextResponse.json({ error: "No valid update fields provided" }, { status: 400 })
  } catch (error) {
    console.error("Transfer PATCH error:", error)
    return NextResponse.json({ error: "Failed to update transfer" }, { status: 500 })
  }
}
