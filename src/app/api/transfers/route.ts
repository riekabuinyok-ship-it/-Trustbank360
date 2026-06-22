import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateTransactionNumber, generateSecretCode, MOBILE_MONEY_TYPES } from "@/lib/utils"
import { getCommissionSetting, calculateCommission } from "@/lib/commission"
import { checkPlanLimit, PlanEnforcementError } from "@/lib/plan-enforcement"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const incoming = searchParams.get("incoming")

  const where: any = { companyId: user.companyId }

  const isSupervisory = user.role === "COMPANY_OWNER" || user.role === "company_owner" || user.role === "COMPANY_ADMIN" || user.role === "company_admin"

  if (isSupervisory) {
    // Supervisory sees all
  } else if (user.branchId) {
    // Operational sees their own branch transfers
    if (incoming === "true") {
      // Only transactions where user's branch is the receiver
      where.branchLink = { receiverBranchId: user.branchId }
    } else {
      // Only transactions where user's branch is sender or receiver
      where.branchLink = {
        OR: [
          { senderBranchId: user.branchId },
          { receiverBranchId: user.branchId },
        ],
      }
    }
  } else {
    return NextResponse.json([])
  }

  if (status) where.status = status

  const transfers = await prisma.transfer.findMany({
    where,
    include: {
      sender: { select: { fullName: true, phone: true } },
      receiver: { select: { fullName: true, phone: true } },
      issuedBy: { select: { name: true, role: true, branch: { select: { name: true } } } },
      paidBy: { select: { name: true, role: true, branch: { select: { name: true } } } },
      branchLink: {
        include: {
          senderBranch: { select: { name: true } },
          receiverBranch: { select: { name: true } },
        },
      },
      mobileProvider: { select: { name: true } },
      events: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
        take: 10,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json(transfers)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  if (user.role !== "BRANCH_MANAGER" && user.role !== "branch_manager" && user.role !== "TELLER" && user.role !== "teller" && user.role !== "COMPANY_OWNER" && user.role !== "company_owner" && user.role !== "COMPANY_ADMIN" && user.role !== "company_admin") {
    return NextResponse.json({ error: "Only Branch Managers, Tellers, and Company Admins can create transfers" }, { status: 403 })
  }

  if (!user.branchId) {
    return NextResponse.json({ error: "You must be assigned to a branch to create transfers" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { senderName, senderPhone, senderNationality, senderIdType, senderIdNumber, receiverName, receiverPhone, destinationBranchId, amount, currency, transactionType, commissionType, notes, mobileProviderId, receiverMobile, receiverIdNumber } = body

    if (!senderName || !senderPhone || !receiverName || !receiverPhone || !destinationBranchId || !amount || !currency) {
      return NextResponse.json({ error: "Missing required fields: sender name, sender phone, receiver name, receiver phone, destination branch, amount, and currency are required." }, { status: 400 })
    }

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Amount must be a positive number." }, { status: 400 })
    }

    try {
      await checkPlanLimit({ companyId: user.companyId, feature: "transfers" })
    } catch (e) {
      if (e instanceof PlanEnforcementError) {
        return NextResponse.json(e.toJSON(), { status: 403 })
      }
      throw e
    }

    let sender = await prisma.customer.findFirst({
      where: { phone: senderPhone, companyId: user.companyId },
    })
    if (!sender) {
      sender = await prisma.customer.create({
        data: { fullName: senderName, phone: senderPhone, nationality: senderNationality, idType: senderIdType, idNumber: senderIdNumber, companyId: user.companyId },
      })
    }

    let receiver = await prisma.customer.findFirst({
      where: { phone: receiverPhone, companyId: user.companyId },
    })
    if (!receiver) {
      receiver = await prisma.customer.create({
        data: { fullName: receiverName, phone: receiverPhone, companyId: user.companyId },
      })
    }

    const company = await prisma.company.findUnique({ where: { id: user.companyId } })
    if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 })

    const transactionNumber = generateTransactionNumber()
    const isMobileMoney = transactionType && MOBILE_MONEY_TYPES.includes(transactionType)
    const secretCode = isMobileMoney ? null : generateSecretCode(company.name)

    const commissionSetting = await getCommissionSetting(user.companyId, currency)
    const { commission, senderAmount, receiverAmount } = calculateCommission(
      amount,
      commissionSetting.mode as any,
      commissionSetting.value,
      commissionSetting.minFee,
      commissionType,
    )

    const transfer = await prisma.$transaction(async (tx) => {
      const t = await tx.transfer.create({
        data: {
          transactionNumber,
          secretCode,
          transactionType: transactionType || "CASH_TO_CASH",
          amount,
          currency,
          exchangeRate: 1,
          commission,
          commissionType,
          totalAmount: amount + (commissionType === "SEPARATE" ? commission : 0),
          senderAmount,
          receiverAmount,
          senderId: sender.id,
          receiverId: receiver.id,
          companyId: user.companyId,
          issuedById: user.id,
          mobileProviderId: mobileProviderId || null,
          receiverMobile: receiverMobile || null,
          receiverIdNumber: receiverIdNumber || null,
          notes,
          status: "PENDING",
        },
      })

      await tx.branchTransaction.create({
        data: {
          transferId: t.id,
          senderBranchId: user.branchId!,
          receiverBranchId: destinationBranchId,
        },
      })

      return t
    })

    const { notifySenderBranch, notifyReceiverBranch } = await import("@/lib/log-event")
    const branches = await prisma.branch.findMany({
      where: { id: { in: [user.branchId!, destinationBranchId] } },
      select: { id: true, name: true },
    })
    const senderBranchName = branches.find((b) => b.id === user.branchId)?.name || "Sender Branch"
    const receiverBranchName = branches.find((b) => b.id === destinationBranchId)?.name || "Receiver Branch"

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "TRANSACTION_CREATED",
        resource: "TRANSFER",
        details: `Transaction ${transactionNumber} created`,
        branchId: user.branchId,
        companyId: user.companyId,
      },
    })

    await notifySenderBranch({
      companyId: user.companyId,
      senderBranchId: user.branchId!,
      type: "TRANSACTION_CREATED",
      transferData: { secretCode, amount: `${amount.toLocaleString()}`, currency, branchName: receiverBranchName },
      transferId: transfer.id,
    })

    await notifyReceiverBranch({
      companyId: user.companyId,
      receiverBranchId: destinationBranchId,
      type: "INCOMING_TRANSFER",
      transferData: { secretCode, amount: `${amount.toLocaleString()}`, currency, senderBranch: senderBranchName },
      transferId: transfer.id,
    })

    return NextResponse.json(transfer)
  } catch (error: any) {
    console.error("Transfer error:", error)
    const message = error?.message || "Failed to create transfer"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
