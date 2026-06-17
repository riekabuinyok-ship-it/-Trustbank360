import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any
  const { searchParams } = new URL(request.url)
  const unreadOnly = searchParams.get("unread") === "true"
  const since = searchParams.get("since")

  const where: any = { userId: user.id }
  if (unreadOnly) where.readAt = null
  if (since) where.createdAt = { gt: new Date(since) }

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.notification.count({
      where: { userId: user.id, readAt: null },
    }),
  ])

  return NextResponse.json({ notifications, unreadCount })
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  try {
    const { ids, all } = await request.json()

    if (all) {
      await prisma.notification.updateMany({
        where: { userId: user.id, readAt: null },
        data: { readAt: new Date() },
      })
    } else if (Array.isArray(ids) && ids.length > 0) {
      await prisma.notification.updateMany({
        where: { id: { in: ids }, userId: user.id },
        data: { readAt: new Date() },
      })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  try {
    const { title, message, type, link } = await request.json()

    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type,
        link,
        userId: user.id,
        companyId: user.companyId,
      },
    })

    return NextResponse.json(notification)
  } catch {
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 })
  }
}
