const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    const r = await prisma.commissionSetting.findFirst()
    console.log('OK:', JSON.stringify(r))
  } catch (e) {
    console.log('ERROR:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
