import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { generateBranchCode } from "@/lib/utils"
import { createStripeCustomer, createStripeSubscription } from "@/lib/subscription"
import { sendWelcomeEmail } from "@/lib/email"
import { validatePhone } from "@/lib/phone-validation"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password, companyName, businessTypes, country, registrationNumber, taxId, phone, mobileProviders, numberOfBranches, numberOfStaff } = body

    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    let normalizedPhone = phone
    if (phone) {
      const phoneResult = validatePhone(phone)
      if (!phoneResult.valid) {
        return NextResponse.json({ error: phoneResult.error }, { status: 400 })
      }
      normalizedPhone = phoneResult.normalized!
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

    const branchCount = numberOfBranches !== undefined ? Number(numberOfBranches) : 1
    const staffCount = numberOfStaff !== undefined ? Number(numberOfStaff) : 1

    if (branchCount < 1 || branchCount > 1000) {
      return NextResponse.json({ error: "Number of Branches must be between 1 and 1000" }, { status: 400 })
    }
    if (staffCount < 1 || staffCount > 2500) {
      return NextResponse.json({ error: "Number of Staff must be between 1 and 2500" }, { status: 400 })
    }

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
        phone: normalizedPhone,
        email,
        numberOfBranches: branchCount,
        numberOfStaff: staffCount,
        users: {
          create: {
            name,
            email,
            phone: normalizedPhone,
            password: hashedPassword,
            role: "company_owner",
            status: "ACTIVE",
            mustChangePassword: true,
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

      try {
        await sendWelcomeEmail(email, name, password)
      } catch (emailErr) {
        console.error("[signup] Welcome email failed:", emailErr)
      }

      return NextResponse.json({
        success: true,
        companyId: company.id,
        message: "Company created. Subscription is in trial period.",
      })
    } catch (stripeErr: any) {
      console.error("Stripe subscription creation failed:", stripeErr?.message || stripeErr)
      // Company was created but Stripe failed — create a local trial subscription instead
      try {
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

        try {
          await sendWelcomeEmail(email, name, password)
        } catch (emailErr) {
          console.error("[signup] Welcome email failed:", emailErr)
        }

        return NextResponse.json({
          success: true,
          companyId: company.id,
          message: "Company created with trial subscription.",
        })
      } catch (fallbackErr: any) {
        console.error("Fallback subscription creation also failed:", fallbackErr?.message || fallbackErr)
        return NextResponse.json({
          error: "Company created but subscription setup failed: " + (fallbackErr?.message || "unknown error"),
        }, { status: 500 })
      }
    }
  } catch (error: any) {
    console.error("Signup error:", error?.message || error, error?.stack || "")
    return NextResponse.json({
      error: error?.message || "Internal server error",
      ...(process.env.NODE_ENV === "development" && { stack: error?.stack }),
    }, { status: 500 })
  }
}
