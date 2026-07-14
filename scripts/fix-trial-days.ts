import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_QvfAa1lcm0Uy@ep-super-water-abe2zqs2-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require",
    },
  },
})

async function main() {
  const subscriptions = await prisma.subscription.findMany({
    where: { status: "TRIALING" },
    include: { plan: { select: { name: true, trialDays: true } } },
  })

  console.log(`Found ${subscriptions.length} active trial subscription(s)`)

  for (const sub of subscriptions) {
    const start = sub.startDate
    if (!start) continue
    const correctEnd = new Date(start.getTime() + 30 * 86400000)
    const currentEnd = sub.trialEndsAt

    console.log(`\nSubscription ${sub.id}:`)
    console.log(`  Plan: ${sub.plan.name} (${sub.plan.trialDays} days configured)`)
    console.log(`  Start: ${start.toISOString()}`)
    console.log(`  Current trialEndsAt: ${currentEnd?.toISOString()}`)
    console.log(`  Corrected trialEndsAt: ${correctEnd.toISOString()}`)

    if (currentEnd && Math.abs(currentEnd.getTime() - correctEnd.getTime()) > 86400000) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          trialEndsAt: correctEnd,
          endDate: correctEnd,
        },
      })
      console.log(`  ✓ Updated to 30-day trial`)
    } else {
      console.log(`  Already correct or close enough, skipping`)
    }
  }

  console.log("\nDone!")
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
