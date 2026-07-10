import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { validatePhone } from "@/lib/phone-validation"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q") || ""

  const customers = await prisma.customer.findMany({
    where: {
      companyId: user.companyId,
      OR: [
        { fullName: { contains: query, mode: "insensitive" } },
        { phone: { contains: query } },
        { idNumber: { contains: query } },
      ],
    },
    include: { _count: { select: { transfersAsSender: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json(customers)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  try {
    const body = await request.json()

    let normalizedPhone = body.phone
    if (body.phone) {
      const phoneResult = validatePhone(body.phone)
      if (!phoneResult.valid) {
        return NextResponse.json({ error: phoneResult.error }, { status: 400 })
      }
      normalizedPhone = phoneResult.normalized!
    }

    const customer = await prisma.customer.create({
      data: {
        fullName: body.fullName,
        phone: normalizedPhone,
        nationality: body.nationality,
        idType: body.idType,
        idNumber: body.idNumber,
        notes: body.notes,
        companyId: user.companyId,
      },
    })

    return NextResponse.json(customer)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 })
  }
}
