import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const name = searchParams.get("name")

  if (!code || !name) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
  }

  try {
    const transfer = await prisma.transfer.findFirst({
      where: { secretCode: code },
      include: {
        branchLink: {
          select: {
            receiverBranch: { select: { name: true, city: true, country: true } },
          },
        },
        sender: { select: { fullName: true, phone: true } },
      },
    })

    if (!transfer) {
      return NextResponse.json({ error: "Transfer not found. Please check your secret code." }, { status: 404 })
    }

    if (!transfer.sender.fullName?.toLowerCase().startsWith(name.toLowerCase())) {
      return NextResponse.json({ error: "Invalid credentials. Please check your name and secret code." }, { status: 401 })
    }

    return NextResponse.json({
      transferCode: transfer.secretCode,
      transactionNumber: transfer.transactionNumber,
      amount: transfer.amount,
      currency: transfer.currency,
      status: transfer.status,
      destinationBranch: transfer.branchLink?.receiverBranch,
      createdAt: transfer.createdAt,
    })
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
