import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== "platform_owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const totalSubscribers = await prisma.newsletterSubscriber.count({ where: { isActive: true } })
    const newThisWeek = await prisma.newsletterSubscriber.count({
      where: { isActive: true, subscribedAt: { gte: new Date(Date.now() - 86400000 * 7) } },
    })

    return NextResponse.json({ totalSubscribers, newThisWeek })
  } catch (error: any) {
    console.error("[newsletter/stats] Error:", error?.message || error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
