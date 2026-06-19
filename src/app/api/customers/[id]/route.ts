import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  const { id } = await params
  const customer = await prisma.customer.findFirst({
    where: { id, companyId: user.companyId },
    include: {
      _count: { select: { transfersAsSender: true, transfersAsReceiver: true } },
    },
  })

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 })
  }

  return NextResponse.json(customer)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  const { id } = await params
  const customer = await prisma.customer.findFirst({
    where: { id, companyId: user.companyId },
  })

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 })
  }

  try {
    const body = await request.json()
    const data: any = {}

    if (body.verificationStatus) data.verificationStatus = body.verificationStatus
    if (body.riskLevel) data.riskLevel = body.riskLevel
    if (body.notes !== undefined) data.notes = body.notes

    const updated = await prisma.customer.update({
      where: { id },
      data,
    })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "CUSTOMER_UPDATED",
        resource: "CUSTOMER",
        details: `Updated customer ${customer.fullName}: ${JSON.stringify(data)}`,
        companyId: user.companyId,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Customer update error:", error)
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 })
  }
}
