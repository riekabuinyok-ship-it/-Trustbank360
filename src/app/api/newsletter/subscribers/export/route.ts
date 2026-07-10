import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== "platform_owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: { isActive: true },
      orderBy: { subscribedAt: "desc" },
    })

    const header = "email,name,subscribedAt\n"
    const rows = subscribers
      .map((s) => `${s.email},${s.name ? `"${s.name}"` : ""},${s.subscribedAt.toISOString()}`)
      .join("\n")

    return new NextResponse(header + rows, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="newsletter-subscribers-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error: any) {
    console.error("[newsletter/export] Error:", error?.message || error)
    return NextResponse.json({ error: "Failed to export subscribers" }, { status: 500 })
  }
}
