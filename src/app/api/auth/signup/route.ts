import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { generateBranchCode } from "@/lib/utils"
import { createStripeCustomer, createStripeSubscription } from "@/lib/subscription"
import { getAllowedCurrencies } from "@/lib/plan-config"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password, companyName, businessTypes, country, registrationNumber, taxId, phone, mobileProviders } = body

    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const plan = await prisma.subscriptionPlan.findFirst({ where: { name: "Enterprise" } })
    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: "Enterprise plan is not configured. Please contact support." }, { status: 500 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 })
    }

    const types = businessTypes || ["MONEY_TRANSFER_COMPANY"]

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
        numberOfBranches: 1,
        numberOfStaff: 1,
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

    // Create default wallets for main branch with all Enterprise currencies
    const initialCurrencies = getAllowedCurrencies()
    await prisma.wallet.createMany({
      data: initialCurrencies.map((currency) => ({
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

      await prisma.floatWallet.createMany({
        data: providers.map((p) => ({
          companyId: company.id,
          providerId: p.id,
          currency: p.country,
          balance: 0,
        })),
      })
    }

    // Create Stripe customer and subscription with trial
    try {
      const customer = await createStripeCustomer(company.id, email, name)
      const stripeSub = await createStripeSubscription(company.id, plan.id, customer.id)

      const trialEndsAt = new Date(Date.now() + plan.trialDays * 86400000)

      await prisma.subscription.create({
        data: {
          companyId: company.id,
          planId: plan.id,
          status: "TRIALING",
          paymentMethod: "STRIPE",
          startDate: new Date(),
          trialEndsAt,
          endDate: trialEndsAt,
          stripeCustomerId: customer.id,
          stripeSubscriptionId: stripeSub.id,
        },
      })

      return NextResponse.json({
        success: true,
        companyId: company.id,
        message: "Company created. Subscription is in trial period.",
      })
    } catch (stripeErr: any) {
      console.error("Stripe subscription creation failed:", stripeErr)
      // Company was created but Stripe failed — create a local trial subscription instead
      const trialEndsAt = new Date(Date.now() + plan.trialDays * 86400000)
      await prisma.subscription.create({
        data: {
          companyId: company.id,
          planId: plan.id,
          status: "TRIALING",
          startDate: new Date(),
          trialEndsAt,
          endDate: trialEndsAt,
        },
      })

      return NextResponse.json({
        success: true,
        companyId: company.id,
        message: "Company created with trial subscription.",
      })
    }
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
