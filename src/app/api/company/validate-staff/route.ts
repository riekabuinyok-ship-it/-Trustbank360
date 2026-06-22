import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any
  if (!user?.companyId) return NextResponse.json({ error: "No company context" }, { status: 400 })

  const current = await prisma.user.count({ where: { companyId: user.companyId } }).catch(() => 0)

  return NextResponse.json({
    resource: "staff",
    valid: true,
    current,
    limit: null,
    remaining: -1,
    percentage: 0,
    isAtLimit: false,
    message: "Unlimited staff on Enterprise plan",
    suggestedPlan: null,
    suggestedPlanMessage: null,
  })
}
