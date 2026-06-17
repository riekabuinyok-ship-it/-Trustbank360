import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateTransactionNumber, generateSecretCode } from "@/lib/utils"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  if (!user.branchId) {
    return NextResponse.json({ error: "You must be assigned to a branch" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { senderName, senderPhone, mobileProviderId, walletNumber, amount, currency, branchId, notes } = body

    let sender = await prisma.customer.findFirst({
      where: { phone: senderPhone, companyId: user.companyId },
    })
    if (!sender) {
      sender = await prisma.customer.create({
        data: { fullName: senderName, phone: senderPhone, companyId: user.companyId },
      })
    }

    const transactionNumber = generateTransactionNumber()
    const company = await prisma.company.findUnique({ where: { id: user.companyId } })
    const secretCode = generateSecretCode(company?.name || "TRUST")

    const transfer = await prisma.transfer.create({
      data: {
        transactionNumber,
        secretCode,
        transactionType: "MOBILE_TO_CASH",
        amount,
        currency,
        exchangeRate: 1,
        commission: 0,
        commissionType: "INCLUDED",
        totalAmount: amount,
        senderAmount: amount,
        receiverAmount: amount,
        senderId: sender.id,
        receiverId: sender.id,
        companyId: user.companyId,
        issuedById: user.id,
        paidById: user.id,
        paidAt: new Date(),
        mobileProviderId: mobileProviderId || null,
        receiverMobile: walletNumber || null,
        notes,
        status: "COMPLETED",
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "TRANSACTION_CREATED",
        resource: "TRANSFER",
        details: `Withdrawal ${transactionNumber} completed - ${amount} ${currency}`,
        branchId: branchId || user.branchId,
        companyId: user.companyId,
      },
    })

    return NextResponse.json(transfer)
  } catch (error) {
    console.error("Withdrawal error:", error)
    return NextResponse.json({ error: "Failed to process withdrawal" }, { status: 500 })
  }
}
