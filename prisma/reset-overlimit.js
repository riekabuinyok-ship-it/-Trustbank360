const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function main() {
  console.log("Resetting overLimit on all companies...")
  const result = await prisma.company.updateMany({
    where: { overLimit: true },
    data: { overLimit: false },
  })
  console.log(`✓ Reset overLimit on ${result.count} companies`)
}

main()
  .catch((err) => {
    console.error("Migration failed:", err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
