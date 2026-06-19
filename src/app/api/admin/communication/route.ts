import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  if (user.role !== "platform_owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const messages = await prisma.adminMessage.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { name: true, email: true } },
      },
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error("Error fetching admin messages:", error)
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  if (user.role !== "platform_owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { title, content, type = "BROADCAST", targetRole = "ALL", targetPlan, targetStatus = "ALL" } = body

    if (!title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 })
    if (!content?.trim()) return NextResponse.json({ error: "Content is required" }, { status: 400 })

    const userWhere: any = {
      role: {
        notIn: ["platform_owner"],
      },
    }

    if (targetRole !== "ALL") {
      userWhere.AND = [{ role: { notIn: ["platform_owner"] } }, { role: targetRole }]
    }

    if (targetStatus !== "ALL") {
      userWhere.status = targetStatus
    }

    if (targetPlan && targetPlan !== "ALL") {
      const companiesWithPlan = await prisma.company.findMany({
        where: {
          subscription: {
            plan: { name: targetPlan },
          },
        },
        select: { id: true },
      })
      userWhere.companyId = { in: companiesWithPlan.map((c) => c.id) }
    }

    const matchingUsers = await prisma.user.findMany({
      where: userWhere,
      select: { id: true, companyId: true },
    })

    const message = await prisma.adminMessage.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        type,
        targetRole: targetRole === "ALL" ? null : targetRole,
        targetPlan: targetPlan && targetPlan !== "ALL" ? targetPlan : null,
        targetStatus: targetStatus === "ALL" ? null : targetStatus,
        sentCount: matchingUsers.length,
        createdById: (session.user as any).id,
      },
    })

    const usersWithCompany = matchingUsers.filter((u): u is typeof u & { companyId: string } => u.companyId !== null)
    if (usersWithCompany.length > 0) {
      // Create announcements per unique company and capture IDs
      const uniqueCompanyIds = [...new Set(usersWithCompany.map((u) => u.companyId))]
      const announcementMap = new Map<string, string>()

      for (const cid of uniqueCompanyIds) {
        const announcement = await prisma.announcement.create({
          data: {
            title: title.trim(),
            content: content.trim(),
            priority: type === "ALERT" ? "HIGH" : "NORMAL",
            companyId: cid,
            createdById: (session.user as any).id,
          },
        })
        announcementMap.set(cid, announcement.id)
      }

      // Create notifications with per-announcement links
      await prisma.notification.createMany({
        data: usersWithCompany.map((u) => ({
          title: title.trim(),
          message: content.trim(),
          type,
          userId: u.id,
          companyId: u.companyId,
          link: `/company/announcements/${announcementMap.get(u.companyId)}`,
        })),
      })
    }

    return NextResponse.json({ success: true, sentCount: matchingUsers.length })
  } catch (error) {
    console.error("Error sending broadcast:", error)
    const message = error instanceof Error ? error.message : "Failed to send message"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
