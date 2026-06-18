import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    })
    return NextResponse.json({ plans })
  } catch {
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 })
  }
}
