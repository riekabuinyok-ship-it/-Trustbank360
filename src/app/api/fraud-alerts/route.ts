import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  const alerts = await prisma.fraudAlert.findMany({
    where: { companyId: user.companyId, resolved: false },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json(alerts)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  try {
    const body = await request.json()
    const alert = await prisma.fraudAlert.create({
      data: {
        type: body.type,
        severity: body.severity || "MEDIUM",
        description: body.description,
        companyId: user.companyId,
        customerId: body.customerId,
        transferId: body.transferId,
      },
    })
    return NextResponse.json(alert)
  } catch {
    return NextResponse.json({ error: "Failed to create alert" }, { status: 500 })
  }
}
