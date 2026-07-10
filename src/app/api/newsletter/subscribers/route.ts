import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== "platform_owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "20")
    const where: any = {}
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ]
    }
    const [subscribers, total] = await Promise.all([
      prisma.newsletterSubscriber.findMany({
        where,
        orderBy: { subscribedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.newsletterSubscriber.count({ where }),
    ])
    return NextResponse.json({ subscribers, total, page, pageSize })
  } catch (error: any) {
    console.error("[newsletter/subscribers] Error:", error?.message || error)
    return NextResponse.json({ error: "Failed to fetch subscribers" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== "platform_owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const body = await request.json()
    const { id } = body
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })
    await prisma.newsletterSubscriber.update({ where: { id }, data: { isActive: false, unsubscribedAt: new Date() } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[newsletter/subscribers] DELETE error:", error?.message || error)
    return NextResponse.json({ error: "Failed to remove subscriber" }, { status: 500 })
  }
}
