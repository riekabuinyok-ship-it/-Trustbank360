import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendSupportReplyEmail } from "@/lib/email"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = session.user as any
    const body = await request.json()
    const { status, message } = body

    const report = await prisma.supportReport.findUnique({ where: { id } })
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    const isOwner = report.userId === user.id
    const isPlatformOwner = user.role === "platform_owner"
    if (!isOwner && !isPlatformOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (message) {
      await prisma.ticketReply.create({
        data: { ticketId: id, userId: user.id, message },
      })
      await prisma.supportReport.update({
        where: { id },
        data: { lastRepliedAt: new Date() },
      })
    }

    if (status) {
      await prisma.supportReport.update({
        where: { id },
        data: { status },
      })
    }

    if (isPlatformOwner && message) {
      const ticket = await prisma.supportReport.findUnique({
        where: { id },
        select: { userId: true, companyId: true, ticketNumber: true, subject: true, email: true },
      })
      if (ticket?.userId) {
        await prisma.notification.create({
          data: {
            title: `Support replied to Ticket #${ticket.ticketNumber}`,
            message: message.substring(0, 120),
            type: "SUPPORT_REPLY",
            userId: ticket.userId,
            companyId: ticket.companyId,
            link: `/company/my-tickets?id=${ticket.ticketNumber}`,
          },
        })
      }
      if (ticket?.email) {
        await sendSupportReplyEmail(ticket.email, `Ticket #${ticket.ticketNumber} - ${ticket.subject}`, message)
      }
    }

    if (!isPlatformOwner && message && report.userId) {
      const platformOwners = await prisma.user.findMany({
        where: { role: "platform_owner" },
        select: { id: true },
      })
      if (platformOwners.length > 0) {
        await prisma.notification.createMany({
          data: platformOwners.map((po) => ({
            title: `User replied to Ticket #${report.ticketNumber}`,
            message: message.substring(0, 120),
            type: "USER_REPLY_TICKET",
            userId: po.id,
            link: `/platform/reports`,
          })),
        })
      }
    }

    const updated = await prisma.supportReport.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        company: { select: { name: true } },
        replies: { orderBy: { createdAt: "asc" }, include: { user: { select: { name: true, role: true } } } },
        _count: { select: { replies: true } },
      },
    })

    return NextResponse.json({ success: true, report: updated })
  } catch (error: any) {
    console.error("[reports] PATCH error:", error?.message || error)
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 })
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = session.user as any
    const report = await prisma.supportReport.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        company: { select: { name: true } },
        replies: { orderBy: { createdAt: "asc" }, include: { user: { select: { name: true, role: true } } } },
      },
    })

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    const isOwner = report.userId === user.id
    const isPlatformOwner = user.role === "platform_owner"
    const isCompanyAdmin = ["company_owner", "company_admin"].includes(user.role) && report.companyId === user.companyId
    if (!isOwner && !isPlatformOwner && !isCompanyAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({ report })
  } catch (error: any) {
    console.error("[reports] GET single error:", error?.message || error)
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 })
  }
}
