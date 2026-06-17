import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const providers = await prisma.mobileMoneyProvider.findMany({
    where: { isActive: true },
  })
  return NextResponse.json(providers)
}
