import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ensureEnterprisePlan } from "@/lib/migrate-to-enterprise"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = session.user as any

  try {
    const body = await request.json()
    const requestedBranches = parseInt(body.numberOfBranches) || 1
    const requestedStaff = parseInt(body.numberOfStaff) || 1
    const allCurrencies = [body.mainCurrency, ...(body.additionalCurrencies || [])].filter(Boolean)

    await ensureEnterprisePlan(user.companyId)

    const updateData: any = {
      numberOfBranches: requestedBranches,
      numberOfStaff: requestedStaff,
      mainCurrency: body.mainCurrency,
      additionalCurrencies: body.additionalCurrencies,
      address: body.address,
      phone: body.phone,
      website: body.website,
      onboardingComplete: true,
    }

    if (body.companyName) updateData.name = body.companyName
    if (body.registrationNumber) updateData.registrationNumber = body.registrationNumber
    if (body.taxId) updateData.taxId = body.taxId
    if (body.logo) updateData.logo = body.logo

    await prisma.company.update({
      where: { id: user.companyId },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      message: "Onboarding completed.",
      plan: "Enterprise",
      currencies: allCurrencies,
    })
  } catch (error) {
    console.error("[POST /api/onboarding] Failed:", error)
    const realMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      {
        success: false,
        errorCode: "ONBOARDING_FAILED",
        title: "Onboarding failed",
        message: `We couldn't complete onboarding. ${realMessage}`,
        error: realMessage,
        upgradeRequired: false,
      },
      { status: 500 }
    )
  }
}
