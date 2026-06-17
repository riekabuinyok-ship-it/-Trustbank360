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

  if (unreadOnly) {
    const count = await prisma.message.count({
      where: {
        companyId: user.companyId,
        receiverId: user.id,
        senderId: { not: user.id },
        readAt: null,
      },
    })
    return NextResponse.json({ unreadCount: count })
  }

  const messages = await prisma.message.findMany({
    where: {
      companyId: user.companyId,
      OR: [{ senderId: user.id }, { receiverId: user.id }, { type: "ANNOUNCEMENT" }],
    },
    include: { sender: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  await prisma.message.updateMany({
    where: {
      receiverId: user.id,
      deliveredAt: null,
      senderId: { not: user.id },
    },
    data: { deliveredAt: new Date() },
  })

  return NextResponse.json(messages)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  try {
    const body = await request.json()

    const message = await prisma.message.create({
      data: {
        subject: body.subject,
        content: body.content,
        type: body.type || "DIRECT",
        senderId: user.id,
        receiverId: body.receiverId,
        companyId: user.companyId,
        branchId: body.branchId,
      },
    })

    return NextResponse.json(message)
  } catch {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  try {
    const { senderId } = await request.json()

    await prisma.message.updateMany({
      where: {
        senderId,
        receiverId: user.id,
        readAt: null,
      },
      data: { readAt: new Date(), deliveredAt: new Date() },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 })
  }
}
