const { PrismaClient } = require("@prisma/client")
const p = new PrismaClient()
async function main() {
  await p.$executeRawUnsafe(`ALTER TABLE "transfers" ALTER COLUMN "status" DROP DEFAULT`)
  await p.$executeRawUnsafe(`ALTER TABLE "transfers" ALTER COLUMN "status" TYPE text`)
  await p.$executeRawUnsafe(`UPDATE "transfers" SET "status" = 'PENDING' WHERE "status" NOT IN ('PENDING', 'COMPLETED', 'CANCELLED', 'REVERSED')`)
  console.log("Migration complete")
  await p.$disconnect()
}
main().catch((e) => { console.error(e); p.$disconnect() })
