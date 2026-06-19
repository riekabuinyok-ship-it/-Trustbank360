import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  const { searchParams } = new URL(request.url)
  const code = searchParams.get("secretCode")

  if (!code) {
    return NextResponse.json({ error: "Secret Code is required" }, { status: 400 })
  }

  const transfer = await prisma.transfer.findFirst({
    where: { secretCode: code },
    include: {
      sender: { select: { fullName: true } },
      receiver: { select: { fullName: true, phone: true } },
      issuedBy: { select: { name: true, role: true, branch: { select: { name: true } } } },
      branchLink: {
        include: {
          senderBranch: { select: { name: true } },
          receiverBranch: { select: { name: true } },
        },
      },
      mobileProvider: { select: { name: true } },
    },
  })

  if (!transfer || transfer.companyId !== user.companyId) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
  }

  // Only the destination branch can look up for payout
  if (transfer.branchLink?.receiverBranchId !== user.branchId) {
    return NextResponse.json({ error: "This transaction is not destined for your branch" }, { status: 403 })
  }

  return NextResponse.json(transfer)
}
