import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  if (user.role !== "platform_owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const companies = await prisma.company.findMany({
    where: { status: { not: "DELETED" } },
    include: {
      _count: { select: { users: true, branches: true } },
      users: {
        where: { role: { in: ["COMPANY_OWNER", "company_owner"] } },
        select: { name: true, email: true },
        take: 1,
      },
      subscription: {
        select: {
          status: true,
          plan: { select: { name: true, price: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const result = companies.map((c) => ({
    id: c.id,
    name: c.name,
    businessTypes: c.businessTypes,
    country: c.country,
    isActive: c.isActive,
    status: c.status,
    onboardingComplete: c.onboardingComplete,
    userCount: c._count.users,
    branchCount: c._count.branches,
    owner: c.users[0] || null,
    subscription: c.subscription
      ? {
          status: c.subscription.status,
          planName: c.subscription.plan.name,
          planPrice: c.subscription.plan.price,
        }
      : null,
    createdAt: c.createdAt,
  }))

  return NextResponse.json(result)
}
