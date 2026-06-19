import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  const { id } = await params
  const announcement = await prisma.announcement.findUnique({
    where: { id },
    include: {
      company: { select: { name: true } },
    },
  })

  if (!announcement || announcement.companyId !== user.companyId) {
    return NextResponse.json({ error: "Announcement not found" }, { status: 404 })
  }

  return NextResponse.json(announcement)
}
