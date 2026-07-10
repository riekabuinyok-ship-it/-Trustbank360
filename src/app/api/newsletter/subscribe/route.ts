import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, name } = body
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }
    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } })
    if (existing) {
      if (!existing.isActive) {
        await prisma.newsletterSubscriber.update({ where: { email }, data: { isActive: true, unsubscribedAt: null } })
      }
      return NextResponse.json({ success: true, message: "You're already subscribed!" })
    }
    await prisma.newsletterSubscriber.create({ data: { email, name: name || null } })
    return NextResponse.json({ success: true, message: "Subscribed successfully!" })
  } catch (error: any) {
    console.error("[newsletter/subscribe] Error:", error?.message || error)
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 })
  }
}
