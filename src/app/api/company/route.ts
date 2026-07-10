import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { checkPlanLimit, PlanEnforcementError } from "@/lib/plan-enforcement"
import { validatePhone } from "@/lib/phone-validation"

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
      status: true,
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

  if (phone) {
    const phoneResult = validatePhone(phone)
    if (!phoneResult.valid) {
      return NextResponse.json({ error: phoneResult.error }, { status: 400 })
    }
    body.phone = phoneResult.normalized!
  }

  if (primaryColor !== undefined || secondaryColor !== undefined || logo !== undefined) {
    try {
      await checkPlanLimit({ companyId: user.companyId, feature: "customBranding" })
    } catch (error) {
      if (error instanceof PlanEnforcementError) {
        return NextResponse.json(error.toJSON(), { status: 403 })
      }
      throw error
    }
  }

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
