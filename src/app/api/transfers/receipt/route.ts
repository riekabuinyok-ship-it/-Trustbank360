import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logTransactionEvent } from "@/lib/log-event"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  const { searchParams } = new URL(request.url)
  const transferId = searchParams.get("transferId")
  const isReprint = searchParams.get("reprint") === "true"

  if (!transferId) {
    return NextResponse.json({ error: "transferId required" }, { status: 400 })
  }

  const transfer = await prisma.transfer.findUnique({
    where: { id: transferId },
    include: {
      sender: true,
      receiver: true,
      issuedBy: { select: { name: true, role: true } },
      paidBy: { select: { name: true, role: true } },
      branchLink: {
        include: {
          senderBranch: { select: { name: true, city: true } },
          receiverBranch: { select: { name: true, city: true } },
        },
      },
      company: { select: { name: true, logo: true } },
      mobileProvider: { select: { name: true } },
    },
  })

  if (!transfer) {
    return NextResponse.json({ error: "Transfer not found" }, { status: 404 })
  }

  if (transfer.companyId !== user.companyId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const branchLink = transfer.branchLink
  if (!branchLink || (branchLink.senderBranchId !== user.branchId && branchLink.receiverBranchId !== user.branchId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.transfer.update({
    where: { id: transferId },
    data: {
      receiptPrintedAt: isReprint ? transfer.receiptPrintedAt : new Date(),
      receiptReprintedAt: isReprint ? new Date() : transfer.receiptReprintedAt,
    },
  })

  await logTransactionEvent({
    transferId,
    userId: user.id,
    action: isReprint ? "RECEIPT_REPRINTED" : "RECEIPT_PRINTED",
    details: `Receipt ${isReprint ? "reprinted" : "printed"} by ${user.name}`,
    branchId: user.branchId,
  })

  return NextResponse.json(transfer)
}
