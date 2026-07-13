import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (session?.user) {
      const user = session.user as any
      await prisma.user.update({
        where: { id: user.id },
        data: { lastActiveAt: new Date() },
      }).catch((err: any) => {
        console.error("[heartbeat] DB update error:", err?.message || err)
      })
      return NextResponse.json({ ok: true, authenticated: true, userId: user.id })
    }

    // Unauthenticated requests are allowed (for serverless warmup)
    return NextResponse.json({ ok: true, authenticated: false })
  } catch (error: any) {
    console.error("[heartbeat] Error:", error?.message || error)
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 })
  }
}
