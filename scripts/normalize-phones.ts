// Script to normalize all existing phone numbers in the database to E.164 format
// Run with: npx tsx scripts/normalize-phones.ts

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const PHONE_PATTERNS: Record<string, { code: string; digits: number }> = {
  "+211": { code: "+211", digits: 9 },
  "+256": { code: "+256", digits: 9 },
  "+254": { code: "+254", digits: 9 },
}

const LOCAL_TO_INTL: Record<string, string> = {
  "0": "+211",
}

function stripNonDigits(phone: string): string {
  return phone.replace(/[^\d]/g, "")
}

function normalizePhone(phone: string): string | null {
  if (!phone || phone.trim() === "") return null

  const cleaned = phone.replace(/[\s\-().]/g, "")

  for (const [prefix, config] of Object.entries(PHONE_PATTERNS)) {
    if (cleaned.startsWith(prefix)) {
      const subscriber = cleaned.slice(prefix.length)
      if (subscriber.length === config.digits && /^\d+$/.test(subscriber)) {
        return `${prefix}${subscriber}`
      }
    }
  }

  if (cleaned.startsWith("0") && cleaned.length === 10) {
    const local = cleaned.slice(1)
    if (/^\d{9}$/.test(local)) {
      return `+211${local}`
    }
  }

  return null
}

async function main() {
  console.log("=== Phone Number Normalization Script ===\n")

  let totalUpdated = 0
  let totalSkipped = 0
  let totalFailed = 0

  // 1. Normalize Company phones
  console.log("1. Normalizing Company phones...")
  const companies = await prisma.company.findMany({
    where: { phone: { not: null } },
    select: { id: true, name: true, phone: true },
  })

  for (const company of companies) {
    if (!company.phone) continue
    const normalized = normalizePhone(company.phone)
    if (normalized && normalized !== company.phone) {
      await prisma.company.update({
        where: { id: company.id },
        data: { phone: normalized },
      })
      console.log(`  Company "${company.name}": "${company.phone}" -> "${normalized}"`)
      totalUpdated++
    } else if (!normalized) {
      console.log(`  Company "${company.name}": INVALID "${company.phone}" - cannot normalize`)
      totalFailed++
    } else {
      totalSkipped++
    }
  }

  // 2. Normalize User phones
  console.log("\n2. Normalizing User phones...")
  const users = await prisma.user.findMany({
    where: { phone: { not: null } },
    select: { id: true, name: true, email: true, phone: true },
  })

  for (const user of users) {
    if (!user.phone) continue
    const normalized = normalizePhone(user.phone)
    if (normalized && normalized !== user.phone) {
      await prisma.user.update({
        where: { id: user.id },
        data: { phone: normalized },
      })
      console.log(`  User "${user.name}" (${user.email}): "${user.phone}" -> "${normalized}"`)
      totalUpdated++
    } else if (!normalized) {
      console.log(`  User "${user.name}" (${user.email}): INVALID "${user.phone}" - cannot normalize`)
      totalFailed++
    } else {
      totalSkipped++
    }
  }

  // 3. Normalize Customer phones
  console.log("\n3. Normalizing Customer phones...")
  const customers = await prisma.customer.findMany({
    where: { phone: { not: "" } },
    select: { id: true, fullName: true, phone: true },
  })

  for (const customer of customers) {
    if (!customer.phone) continue
    const normalized = normalizePhone(customer.phone)
    if (normalized && normalized !== customer.phone) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: { phone: normalized },
      })
      console.log(`  Customer "${customer.fullName}": "${customer.phone}" -> "${normalized}"`)
      totalUpdated++
    } else if (!normalized) {
      console.log(`  Customer "${customer.fullName}": INVALID "${customer.phone}" - cannot normalize`)
      totalFailed++
    } else {
      totalSkipped++
    }
  }

  // 4. Normalize Branch phones
  console.log("\n4. Normalizing Branch phones...")
  const branches = await prisma.branch.findMany({
    where: { contactPhone: { not: null } },
    select: { id: true, name: true, contactPhone: true },
  })

  for (const branch of branches) {
    if (!branch.contactPhone) continue
    const normalized = normalizePhone(branch.contactPhone)
    if (normalized && normalized !== branch.contactPhone) {
      await prisma.branch.update({
        where: { id: branch.id },
        data: { contactPhone: normalized },
      })
      console.log(`  Branch "${branch.name}": "${branch.contactPhone}" -> "${normalized}"`)
      totalUpdated++
    } else if (!normalized) {
      console.log(`  Branch "${branch.name}": INVALID "${branch.contactPhone}" - cannot normalize`)
      totalFailed++
    } else {
      totalSkipped++
    }
  }

  console.log("\n=== Summary ===")
  console.log(`Updated: ${totalUpdated}`)
  console.log(`Skipped (already normalized): ${totalSkipped}`)
  console.log(`Failed (invalid format): ${totalFailed}`)
  console.log("Done!")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
