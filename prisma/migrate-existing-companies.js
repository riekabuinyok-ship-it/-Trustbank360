// Migration script: assign Small Company plan to existing companies without a plan
const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

async function main() {
  console.log("Starting migration: assigning plans to companies without subscriptions...")

  const smallPlan = await prisma.subscriptionPlan.findFirst({
    where: { name: "Small Company", isActive: true },
  })

  if (!smallPlan) {
    console.error("ERROR: Small Company plan not found. Run seed first.")
    process.exit(1)
  }

  const companies = await prisma.company.findMany({
    where: { subscription: null },
  })

  console.log(`Found ${companies.length} companies without a subscription.`)

  const now = new Date()
  const trialEndsAt = new Date(now.getTime() + 30 * 86400000)

  for (const company of companies) {
    console.log(`  Assigning Small Company to ${company.name} (${company.id})`)

    await prisma.subscription.create({
      data: {
        companyId: company.id,
        planId: smallPlan.id,
        status: "TRIALING",
        startDate: now,
        trialEndsAt,
        endDate: trialEndsAt,
      },
    })

    await prisma.company.update({
      where: { id: company.id },
      data: {
        numberOfBranches: Math.min(company.numberOfBranches, smallPlan.maxBranches),
        numberOfStaff: Math.min(company.numberOfStaff, smallPlan.maxStaff),
      },
    })
  }

  // Also update existing subscriptions that might have old PENDING without a real Stripe sub
  const pendingSubs = await prisma.subscription.findMany({
    where: { status: "PENDING", stripeSubscriptionId: null },
    include: { company: true },
  })

  console.log(`Found ${pendingSubs.length} pending subscriptions without Stripe ID.`)

  for (const sub of pendingSubs) {
    console.log(`  Setting ${sub.company?.name || sub.companyId} to TRIALING with Small Company`)
    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        planId: smallPlan.id,
        status: "TRIALING",
        startDate: now,
        trialEndsAt,
        endDate: trialEndsAt,
      },
    })
  }

  console.log("Migration completed successfully!")
}

main()
  .catch((e) => {
    console.error("Migration failed:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
