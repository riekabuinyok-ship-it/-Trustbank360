const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function main() {
  console.log("=== Data Integrity Scan ===")
  console.log("Checking all companies against their plan limits...\n")

  const companies = await prisma.company.findMany({
    include: {
      subscription: { include: { plan: true } },
      _count: { select: { branches: true, users: true } },
      wallets: true,
    },
  })

  let overLimitCount = 0
  const overLimitCompanies = []

  for (const company of companies) {
    if (!company.subscription || !company.subscription.plan) {
      console.log("?  " + company.name + ": No subscription found — skipping")
      continue
    }

    const plan = company.subscription.plan
    const issues = []
    let isOverLimit = false

    if (plan.maxBranches < 999999 && company._count.branches > plan.maxBranches) {
      issues.push("Branches: " + company._count.branches + " / " + plan.maxBranches + " (exceeds by " + (company._count.branches - plan.maxBranches) + ")")
      isOverLimit = true
    }

    if (plan.maxStaff < 999999 && company._count.users > plan.maxStaff) {
      issues.push("Staff: " + company._count.users + " / " + plan.maxStaff + " (exceeds by " + (company._count.users - plan.maxStaff) + ")")
      isOverLimit = true
    }

    if (plan.maxCurrencies < 999999) {
      const uniqueCurrencies = new Set(company.wallets.map(function (w) { return w.currency }))
      if (uniqueCurrencies.size > plan.maxCurrencies) {
        issues.push("Currencies: " + uniqueCurrencies.size + " / " + plan.maxCurrencies + " (exceeds by " + (uniqueCurrencies.size - plan.maxCurrencies) + ")")
        isOverLimit = true
      }
    }

    if (isOverLimit !== company.overLimit) {
      await prisma.company.update({
        where: { id: company.id },
        data: { overLimit: isOverLimit },
      })
    }

    if (isOverLimit) {
      overLimitCount++
      overLimitCompanies.push({ name: company.name, plan: plan.name, issues: issues })
    }
  }

  console.log("\n=== Scan Complete ===")
  console.log("Companies checked: " + companies.length)

  if (overLimitCount === 0) {
    console.log("All companies are within their plan limits.")
  } else {
    console.log("\n  " + overLimitCount + " company(ies) exceed their plan limits:\n")
    for (const c of overLimitCompanies) {
      console.log("  " + c.name + " (" + c.plan + "):")
      c.issues.forEach(function (i) { console.log("    - " + i) })
    }
    console.log("\nThese companies have been marked as over_limit. They will be blocked from creating new branches, staff, or currencies until they upgrade.")
  }
}

main()
  .catch(console.error)
  .finally(function () { return prisma.$disconnect() })
