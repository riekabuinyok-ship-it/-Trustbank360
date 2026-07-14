import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_QvfAa1lcm0Uy@ep-super-water-abe2zqs2-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require",
    },
  },
})

async function main() {
  // List all companies with user counts
  const companies = await prisma.company.findMany({
    select: { id: true, name: true, _count: { select: { users: true, transfers: true, branches: true } } },
  })
  console.log("=== COMPANIES ===")
  for (const c of companies) {
    console.log(`  ${c.name} (${c.id}) — ${c._count.users} users, ${c._count.transfers} transfers, ${c._count.branches} branches`)
  }

  // Check all users and which company they belong to
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, companyId: true, branchId: true, role: true },
    orderBy: { createdAt: "desc" },
    take: 30,
  })
  console.log("\n=== USERS ===")
  for (const u of users) {
    const company = companies.find((c) => c.id === u.companyId)
    console.log(`  ${u.name} (${u.email}) | Company: ${company?.name || u.companyId} | Role: ${u.role} | Branch: ${u.branchId || "none"}`)
  }

  // The transfer from yesterday (July 13)
  const yesterdayTransfer = await prisma.transfer.findFirst({
    where: { transactionNumber: "TXN-20260713-1835" },
    include: {
      sender: { select: { fullName: true, phone: true, companyId: true } },
      receiver: { select: { fullName: true, phone: true, companyId: true } },
      issuedBy: { select: { name: true, companyId: true, branchId: true } },
      branchLink: true,
    },
  })

  if (yesterdayTransfer) {
    console.log("\n=== YESTERDAY'S TRANSFER (TXN-20260713-1835) ===")
    console.log(`  Transfer companyId: ${yesterdayTransfer.companyId}`)
    console.log(`  Sender: ${yesterdayTransfer.sender?.fullName} (company: ${yesterdayTransfer.sender?.companyId})`)
    console.log(`  Receiver: ${yesterdayTransfer.receiver?.fullName} (company: ${yesterdayTransfer.receiver?.companyId})`)
    console.log(`  Created by: ${yesterdayTransfer.issuedBy?.name} (company: ${yesterdayTransfer.issuedBy?.companyId}, branch: ${yesterdayTransfer.issuedBy?.branchId})`)
    console.log(`  BranchLink: ${JSON.stringify(yesterdayTransfer.branchLink)}`)
  }

  // Find transfers WITHOUT BranchTransaction
  const allTransfers = await prisma.transfer.findMany({
    select: { id: true, transactionNumber: true, companyId: true },
  })
  const branchLinks = await prisma.branchTransaction.findMany({
    select: { transferId: true },
  })
  const linkedTransferIds = new Set(branchLinks.map((bl) => bl.transferId))
  const unlinked = allTransfers.filter((t) => !linkedTransferIds.has(t.id))

  console.log(`\n=== TRANSFERS WITHOUT BRANCH LINK (${unlinked.length} of ${allTransfers.length}) ===`)
  for (const t of unlinked) {
    const company = companies.find((c) => c.id === t.companyId)
    console.log(`  ${t.transactionNumber} | Company: ${company?.name || t.companyId}`)
  }

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
