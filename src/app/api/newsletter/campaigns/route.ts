import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendCampaignEmail } from "@/lib/email"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== "platform_owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const campaigns = await prisma.newsletterCampaign.findMany({ orderBy: { createdAt: "desc" } })
    return NextResponse.json({ campaigns })
  } catch (error: any) {
    console.error("[newsletter/campaigns] Error:", error?.message || error)
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== "platform_owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const body = await request.json()
    const { subject, content, sendTo } = body
    if (!subject || !content) {
      return NextResponse.json({ error: "Subject and content are required" }, { status: 400 })
    }

    let targets: { email: string }[] = []
    if (sendTo === "ALL") {
      targets = await prisma.newsletterSubscriber.findMany({
        where: { isActive: true },
        select: { email: true },
      })
    } else if (Array.isArray(sendTo)) {
      targets = sendTo.map((e: string) => ({ email: e }))
    }

    let sentCount = 0
    for (const t of targets) {
      try {
        await sendCampaignEmail(t.email, subject, content)
        sentCount++
      } catch (err) {
        console.error(`[campaign] Failed to send to ${t.email}:`, err)
      }
    }

    const campaign = await prisma.newsletterCampaign.create({
      data: { subject, content, status: "SENT", sentCount, sentAt: new Date() },
    })

    return NextResponse.json({ success: true, campaign })
  } catch (error: any) {
    console.error("[newsletter/campaigns] POST error:", error?.message || error)
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 })
  }
}
