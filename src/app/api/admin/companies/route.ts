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
    include: {
      _count: { select: { users: true } },
      users: {
        where: { role: { in: ["COMPANY_OWNER", "company_owner"] } },
        select: { name: true, email: true },
        take: 1,
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
    onboardingComplete: c.onboardingComplete,
    userCount: c._count.users,
    owner: c.users[0] || null,
    createdAt: c.createdAt,
  }))

  return NextResponse.json(result)
}
