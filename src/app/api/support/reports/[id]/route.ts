import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendSupportReplyEmail } from "@/lib/email"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== "platform_owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { status, adminReply } = body

    const updateData: any = {}
    if (status) updateData.status = status
    if (adminReply !== undefined) {
      updateData.adminReply = adminReply
      updateData.repliedAt = new Date()
      updateData.repliedById = (session.user as any).id
    }

    const report = await prisma.supportReport.update({
      where: { id },
      data: updateData,
    })

    if (adminReply && report.email) {
      await sendSupportReplyEmail(report.email, report.subject, adminReply)
    }

    return NextResponse.json({ success: true, report })
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

    const report = await prisma.supportReport.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true } }, company: { select: { name: true } } },
    })

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    return NextResponse.json({ report })
  } catch (error: any) {
    console.error("[reports] GET single error:", error?.message || error)
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 })
  }
}
