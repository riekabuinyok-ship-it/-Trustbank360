import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { generateBranchCode } from "@/lib/utils"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password, companyName, businessTypes, country, registrationNumber, taxId, phone, mobileProviders } = body

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 })
    }

    const types = businessTypes || ["MONEY_TRANSFER_COMPANY"]

    // Validate provider requirements based on business types
    if (types.includes("MOBILE_MONEY_AGENT") && (!mobileProviders || mobileProviders.length === 0)) {
      return NextResponse.json({ error: "Mobile Money Agents must select at least one provider" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const company = await prisma.company.create({
      data: {
        name: companyName,
        businessTypes: types,
        country,
        registrationNumber,
        taxId,
        phone,
        email,
        users: {
          create: {
            name,
            email,
            phone,
            password: hashedPassword,
            role: "company_owner",
            status: "ACTIVE",
          },
        },
        branches: {
          create: {
            name: `${companyName} - Head Office`,
            code: generateBranchCode(companyName, 0),
            country,
            city: "Main",
            isActive: true,
          },
        },
      },
      include: { branches: true, users: true },
    })

    // Create default wallets for main branch
    const currencies = ["SSP", "USD", "KES", "UGX", "EUR", "GBP", "AED"]
    await prisma.wallet.createMany({
      data: currencies.map((currency) => ({
        currency: currency as any,
        balance: 0,
        openingBalance: 0,
        branchId: company.branches[0].id,
        companyId: company.id,
      })),
    })

    // Link selected mobile money providers
    if (mobileProviders && mobileProviders.length > 0) {
      const providers = await prisma.mobileMoneyProvider.findMany({
        where: { code: { in: mobileProviders } },
      })
      if (providers.length === 0) {
        return NextResponse.json({ error: "No matching mobile money providers found" }, { status: 400 })
      }
      await prisma.companyMobileProvider.createMany({
        data: providers.map((p) => ({
          companyId: company.id,
          providerId: p.id,
        })),
      })

      // Create float wallets for each provider
      await prisma.floatWallet.createMany({
        data: providers.map((p) => ({
          companyId: company.id,
          providerId: p.id,
          currency: p.country,
          balance: 0,
        })),
      })
    }

    return NextResponse.json({ success: true, companyId: company.id })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
