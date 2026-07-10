import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = session.user as any

    if (user.role === "platform_owner") {
      const openCount = await prisma.supportReport.count({
        where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
      })

      const totalSubscribers = await prisma.newsletterSubscriber.count({
        where: { isActive: true },
      })

      const recentSubscribers = await prisma.newsletterSubscriber.count({
        where: { isActive: true, subscribedAt: { gte: new Date(Date.now() - 86400000 * 7) } },
      })

      return NextResponse.json({ openCount, recentSubscribers, totalSubscribers })
    }

    const unreadReplies = await prisma.ticketReply.count({
      where: {
        ticket: { userId: user.id },
        userId: { not: user.id },
        createdAt: { gte: new Date(Date.now() - 86400000 * 30) },
      },
    })

    return NextResponse.json({ unreadReplies })
  } catch (error: any) {
    console.error("[support/stats] Error:", error?.message || error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
