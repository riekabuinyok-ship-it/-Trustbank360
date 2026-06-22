const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function main() {
  console.log("Deleting Small Company and Medium Company plan records...")

  const oldPlans = await prisma.subscriptionPlan.findMany({
    where: { name: { in: ["Small Company", "Medium Company"] } },
    select: { id: true, name: true },
  })

  if (oldPlans.length === 0) {
    console.log("No old plan records found.")
    return
  }

  console.log(`Found ${oldPlans.length} old plan(s):`, oldPlans.map((p) => p.name).join(", "))

  for (const plan of oldPlans) {
    const subCount = await prisma.subscription.count({ where: { planId: plan.id } })
    if (subCount > 0) {
      console.log(`  Reassigning ${subCount} subscription(s) from "${plan.name}" to Enterprise...`)
      const enterprise = await prisma.subscriptionPlan.findFirst({ where: { name: "Enterprise" } })
      if (enterprise) {
        await prisma.subscription.updateMany({
          where: { planId: plan.id },
          data: { planId: enterprise.id },
        })
      }
    }
    await prisma.subscriptionPlan.delete({ where: { id: plan.id } })
    console.log(`  ✓ Deleted "${plan.name}"`)
  }

  console.log("✓ Cleanup complete")
}

main()
  .catch((err) => {
    console.error("Migration failed:", err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
