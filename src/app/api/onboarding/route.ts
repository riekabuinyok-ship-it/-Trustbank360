import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = session.user as any
  const body = await request.json()

  try {
    await prisma.company.update({
      where: { id: user.companyId },
      data: {
        numberOfBranches: parseInt(body.numberOfBranches),
        numberOfStaff: parseInt(body.numberOfStaff),
        mainCurrency: body.mainCurrency,
        additionalCurrencies: body.additionalCurrencies,
        address: body.address,
        phone: body.phone,
        website: body.website,
        onboardingComplete: true,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to complete onboarding" }, { status: 500 })
  }
}
