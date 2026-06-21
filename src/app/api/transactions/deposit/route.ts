import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateTransactionNumber } from "@/lib/utils"
import { formatApiError } from "@/lib/api-error"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  if (!user.branchId) {
    return NextResponse.json({ error: "You must be assigned to a branch" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { customerName, phoneNumber, mobileProviderId, walletNumber, amount, currency, branchId, notes } = body

    let customer = await prisma.customer.findFirst({
      where: { phone: phoneNumber, companyId: user.companyId },
    })
    if (!customer) {
      customer = await prisma.customer.create({
        data: { fullName: customerName, phone: phoneNumber, companyId: user.companyId },
      })
    }

    const company = await prisma.company.findUnique({ where: { id: user.companyId } })
    if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 })

    if (company.overLimit) {
      return NextResponse.json(formatApiError("COMPANY_OVER_LIMIT"), { status: 403 })
    }

    const transactionNumber = generateTransactionNumber()

    const transfer = await prisma.$transaction(async (tx) => {
      const t = await tx.transfer.create({
        data: {
          transactionNumber,
          transactionType: "DEPOSIT",
          amount,
          currency,
          exchangeRate: 1,
          commission: 0,
          commissionType: "INCLUDED",
          totalAmount: amount,
          senderAmount: amount,
          receiverAmount: amount,
          senderId: customer.id,
          receiverId: customer.id,
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

      await tx.branchTransaction.create({
        data: {
          transferId: t.id,
          senderBranchId: branchId || user.branchId,
          receiverBranchId: branchId || user.branchId,
        },
      })

      return t
    })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "TRANSACTION_CREATED",
        resource: "TRANSFER",
        details: `Deposit ${transactionNumber} completed - ${amount} ${currency}`,
        branchId: branchId || user.branchId,
        companyId: user.companyId,
      },
    })

    return NextResponse.json(transfer)
  } catch (error) {
    console.error("Deposit error:", error)
    return NextResponse.json({ error: "Failed to process deposit" }, { status: 500 })
  }
}
