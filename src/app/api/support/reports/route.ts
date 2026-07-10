import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = (session.user as any).role

    let reports

    if (role === "platform_owner") {
      const status = searchParams.get("status")?.trim()
      const priority = searchParams.get("priority")?.trim()
      const search = searchParams.get("search")?.trim()
      const where: any = {}
      if (status && ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].includes(status)) where.status = status
      if (priority && ["LOW", "MEDIUM", "HIGH", "URGENT"].includes(priority)) where.priority = priority
      if (search) {
        where.OR = [
          { subject: { contains: search, mode: "insensitive" } },
          { message: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ]
      }
      reports = await prisma.supportReport.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } },
          company: { select: { name: true } },
          replies: { take: 1, orderBy: { createdAt: "desc" }, select: { message: true, createdAt: true, userId: true, user: { select: { name: true, role: true } } } },
          _count: { select: { replies: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    } else {
      const companyId = (session.user as any).companyId
      reports = await prisma.supportReport.findMany({
        where: { userId: (session.user as any).id, ...(companyId ? { companyId } : {}) },
        include: {
          _count: { select: { replies: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    }

    return NextResponse.json({ reports })
  } catch (error: any) {
    console.error("[reports] GET error:", error?.message || error)
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const { subject, message, priority, category } = body

    if (!subject || !message) {
      return NextResponse.json({ error: "Subject and message are required" }, { status: 400 })
    }

    const year = new Date().getFullYear()
    const lastTicket = await prisma.supportReport.findFirst({
      where: { ticketNumber: { startsWith: `TB-${year}-` } },
      orderBy: { createdAt: "desc" },
      select: { ticketNumber: true },
    })
    let seq = 1
    if (lastTicket?.ticketNumber) {
      const parts = lastTicket.ticketNumber.split("-")
      seq = parseInt(parts[2], 10) + 1
    }
    const ticketNumber = `TB-${year}-${String(seq).padStart(5, "0")}`

    const report = await prisma.supportReport.create({
      data: {
        ticketNumber,
        userId: (session?.user as any)?.id || null,
        companyId: (session?.user as any)?.companyId || null,
        email: (session?.user as any)?.email || body.email || "anonymous@unknown",
        subject,
        message,
        category: category || "other",
        priority: priority || "MEDIUM",
      },
    })

    if (report.userId) {
      await prisma.ticketReply.create({
        data: {
          ticketId: report.id,
          userId: report.userId,
          message: report.message,
        },
      })
    }

    const platformOwners = await prisma.user.findMany({
      where: { role: "platform_owner" },
      select: { id: true },
    })
    if (platformOwners.length > 0) {
      await prisma.notification.createMany({
        data: platformOwners.map((po) => ({
          title: `New Support Ticket #${ticketNumber}`,
          message: `${subject}`,
          type: "NEW_TICKET",
          userId: po.id,
          link: `/platform/reports`,
        })),
      })
    }

    return NextResponse.json({ success: true, report })
  } catch (error: any) {
    console.error("[reports] POST error:", error?.message || error)
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 })
  }
}
