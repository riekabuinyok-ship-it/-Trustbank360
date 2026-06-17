const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function updatePlans() {
  const updates = [
    {
      name: "Small Company",
      price: 10,
      description: "For small money transfer businesses",
      features: ["Up to 2 Branches", "Up to 5 Staff Users", "Basic Money Transfers", "Customer Management", "Basic Reports", "Email Support", "Secure Cloud Hosting", "Branch Wallets", "Advanced Compliance", "API Access", "Custom Branding", "Up to 2 Active Currencies"],
    },
    {
      name: "Medium Company",
      price: 30,
      description: "For growing remittance agencies",
      features: ["Up to 10 Branches", "Up to 25 Staff Users", "Unlimited Transfers", "Branch Wallets", "KYC & Compliance", "Advanced Reports", "Priority Email & Chat Support", "Branch Performance Analytics", "Audit Logs", "Basic API Access", "Custom Branding", "Up to 6 Active Currencies"],
    },
    {
      name: "Enterprise",
      price: 60,
      description: "For large-scale financial institutions",
      features: ["Unlimited Branches", "Unlimited Staff Users", "Unlimited Transfers", "Branch Wallets", "Advanced KYC/AML", "Advanced Analytics", "Custom Reports", "24/7 Dedicated Support", "Dedicated Account Manager", "Priority Processing", "Full API Access", "Custom Integrations", "Custom Branding & Domain", "Enterprise Security Features", "Unlimited Currencies"],
    },
  ]

  for (const plan of updates) {
    const existing = await prisma.subscriptionPlan.findFirst({ where: { name: plan.name } })
    if (existing) {
      await prisma.subscriptionPlan.update({ where: { id: existing.id }, data: plan })
      console.log(`Updated "${plan.name}" (${plan.price}/mo)`)
    } else {
      await prisma.subscriptionPlan.create({ data: { ...plan, currency: "USD", durationDays: 30, isActive: true } })
      console.log(`Created "${plan.name}" (${plan.price}/mo)`)
    }
  }

  // Delete old plans that don't match new pricing
  const oldPlans = await prisma.subscriptionPlan.findMany({ where: { name: { in: ["Starter", "Professional"] } } })
  for (const p of oldPlans) {
    await prisma.subscriptionPlan.delete({ where: { id: p.id } })
    console.log(`Deleted old plan "${p.name}"`)
  }

  console.log("Done! Plans updated successfully.")
  await prisma.$disconnect()
}

updatePlans().catch((e) => { console.error(e); process.exit(1) })
