import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  const setting = await prisma.commissionSetting.findUnique({
    where: { companyId: user.companyId },
  })
  if (!setting) {
    const created = await prisma.commissionSetting.create({
      data: { companyId: user.companyId, mode: "PERCENTAGE", value: 2 },
    })
    return NextResponse.json(created)
  }
  return NextResponse.json(setting)
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  if (user.role !== "COMPANY_OWNER" && user.role !== "company_owner" && user.role !== "COMPANY_ADMIN" && user.role !== "company_admin") {
    return NextResponse.json({ error: "Only company owners and admins can change commission settings" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { mode, value, minFee } = body

    const updated = await prisma.commissionSetting.upsert({
      where: { companyId: user.companyId },
      update: { mode, value: parseFloat(value), minFee: minFee ? parseFloat(minFee) : null },
      create: { companyId: user.companyId, mode, value: parseFloat(value), minFee: minFee ? parseFloat(minFee) : null },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Commission settings error:", error)
    return NextResponse.json({ error: "Failed to update commission settings" }, { status: 500 })
  }
}
