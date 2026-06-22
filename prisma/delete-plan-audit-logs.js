const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function main() {
  console.log("Clearing PlanAuditLog table...")
  const result = await prisma.planAuditLog.deleteMany({})
  console.log(`✓ Deleted ${result.count} plan audit log entries`)
}

main()
  .catch((err) => {
    console.error("Migration failed:", err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
