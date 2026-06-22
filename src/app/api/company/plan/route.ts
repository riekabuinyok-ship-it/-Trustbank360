import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getAllowedCurrencies } from "@/lib/plan-config"
import { ensureEnterprisePlan } from "@/lib/migrate-to-enterprise"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  await ensureEnterprisePlan(user.companyId)

  const sub = await prisma.subscription.findUnique({
    where: { companyId: user.companyId },
    select: { plan: { select: { name: true } } },
  })

  return NextResponse.json({
    planName: "Enterprise",
    allowedCurrencies: getAllowedCurrencies(),
  })
}
