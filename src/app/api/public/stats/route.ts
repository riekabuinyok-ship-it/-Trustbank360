import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const [companyCount, transactionCount] = await Promise.all([
      prisma.company.count({ where: { isActive: true } }),
      prisma.transfer.count({ where: { status: "COMPLETED" } }),
    ])

    return NextResponse.json({
      companyCount,
      transactionCount,
    })
  } catch {
    return NextResponse.json({ companyCount: 0, transactionCount: 0 })
  }
}
