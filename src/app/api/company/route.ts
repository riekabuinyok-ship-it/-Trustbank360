import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  const company = await prisma.company.findUnique({
    where: { id: user.companyId },
    select: {
      id: true,
      name: true,
      businessTypes: true,
      country: true,
      mainCurrency: true,
      registrationNumber: true,
      email: true,
      phone: true,
      address: true,
      website: true,
      logo: true,
      primaryColor: true,
      secondaryColor: true,
      isActive: true,
    },
  })

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 })
  }

  return NextResponse.json(company)
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  const body = await request.json()
  const { name, email, phone, address, website, primaryColor, secondaryColor, logo } = body

  const updatedCompany = await prisma.company.update({
    where: { id: user.companyId },
    data: {
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(address !== undefined && { address }),
      ...(website !== undefined && { website }),
      ...(primaryColor !== undefined && { primaryColor }),
      ...(secondaryColor !== undefined && { secondaryColor }),
      ...(logo !== undefined && { logo }),
    },
  })

  return NextResponse.json(updatedCompany)
}
