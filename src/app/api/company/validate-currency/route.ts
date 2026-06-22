import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { buildValidation } from "@/lib/plan-validate"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any
  if (!user?.companyId) return NextResponse.json({ error: "No company context" }, { status: 400 })

  const walletCurrencies = await prisma.wallet.groupBy({
    by: ["currency"],
    where: { companyId: user.companyId },
  })
  const current = walletCurrencies.length
  const result = await buildValidation(user.companyId, "currencies", current)
  if (!result) return NextResponse.json({ error: "No active subscription" }, { status: 404 })
  return NextResponse.json(result)
}
