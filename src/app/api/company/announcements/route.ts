import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  if (!user.companyId) {
    return NextResponse.json({ error: "No company assigned" }, { status: 403 })
  }

  const announcements = await prisma.announcement.findMany({
    where: {
      companyId: user.companyId,
    },
    include: {
      company: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(announcements)
}
