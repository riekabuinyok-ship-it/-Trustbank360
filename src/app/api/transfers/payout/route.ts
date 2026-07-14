import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
    const { secretCode } = await request.json()
    if (!secretCode) {
      return NextResponse.json({ error: "Secret Code is required" }, { status: 400 })
    }

    const transfer = await prisma.transfer.findFirst({
      where: { secretCode, companyId: user.companyId },
      include: { branchLink: true, receiver: true },
    })

    if (!transfer) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    if (transfer.status !== "PENDING") {
      return NextResponse.json({ error: "This transaction is not pending payout. Current status: " + transfer.status }, { status: 400 })
    }

    if (transfer.branchLink?.receiverBranchId !== user.branchId) {
      return NextResponse.json({ error: "Only the destination branch can complete this payout" }, { status: 403 })
    }

    const updated = await prisma.transfer.update({
      where: { id: transfer.id },
      data: {
        status: "COMPLETED",
        paidById: user.id,
        paidAt: new Date(),
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "PAYOUT_CONFIRMED",
        resource: "TRANSFER",
        details: `Payout completed for ${updated.transactionNumber} - Secret Code: ${secretCode}`,
        branchId: user.branchId,
        companyId: user.companyId,
      },
    })

    return NextResponse.json({ success: true, message: "Payout completed successfully" })
  } catch (error) {
    console.error("Payout error:", error)
    return NextResponse.json({ error: "Failed to process payout" }, { status: 500 })
  }
}
