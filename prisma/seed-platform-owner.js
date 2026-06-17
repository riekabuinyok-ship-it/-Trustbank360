const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: 'riekabuinyok@gmail.com' } });
  if (existing) {
    // Update existing user to platform_owner with null company
    const password = await bcrypt.hash('Admin@123', 12);
    await prisma.user.update({
      where: { email: 'riekabuinyok@gmail.com' },
      data: {
        name: 'Riek Abuinyok',
        role: 'platform_owner',
        companyId: null,
        branchId: null,
        status: 'ACTIVE',
        ...(existing.password !== password ? { password } : {}),
      },
    });
    console.log('Updated riekabuinyok@gmail.com to platform_owner');
    return;
  }

  const password = await bcrypt.hash('Admin@123', 12);
  await prisma.user.create({
    data: {
      name: 'Riek Abuinyok',
      email: 'riekabuinyok@gmail.com',
      password,
      role: 'platform_owner',
      status: 'ACTIVE',
      companyId: null,
      branchId: null,
    },
  });
  console.log('Platform owner created: riekabuinyok@gmail.com');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
