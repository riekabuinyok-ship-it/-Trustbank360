const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Step 1: Count affected users before migration
  const beforeRows = await prisma.$queryRawUnsafe(
    `SELECT role, COUNT(*)::int AS count FROM users GROUP BY role ORDER BY role`
  );

  console.log('Current users:');
  let totalBefore = 0;
  for (const row of beforeRows) {
    console.log(`  ${row.role}: ${row.count}`);
    totalBefore += row.count;
  }
  console.log(`  Total: ${totalBefore}`);

  if (totalBefore === 0) {
    console.log('\nNo users found.');
    return;
  }

  // Step 2: Run the role migration using CASE statement
  const updateSql = `UPDATE "users" SET "role" = CASE "role"
    WHEN 'PLATFORM_ADMIN' THEN 'platform_owner'
    WHEN 'SUPER_ADMIN' THEN 'platform_owner'
    WHEN 'COMPANY_OWNER' THEN 'company_owner'
    WHEN 'COMPANY_ADMIN' THEN 'company_admin'
    WHEN 'BRANCH_MANAGER' THEN 'branch_manager'
    WHEN 'TELLER' THEN 'teller'
    WHEN 'COMPLIANCE_OFFICER' THEN 'compliance_officer'
    WHEN 'AUDITOR' THEN 'auditor'
    ELSE "role"
  END`;

  const updated = await prisma.$executeRawUnsafe(updateSql);
  console.log(`\nRoles updated: ${updated}`);

  // Step 3: Set companyId to NULL for platform owners
  const nullified = await prisma.$executeRawUnsafe(
    `UPDATE "users" SET "companyId" = NULL WHERE "role" = 'platform_owner'`
  );
  console.log(`Platform owners detached from company: ${nullified}`);

  // Step 4: Final summary
  const afterRows = await prisma.$queryRawUnsafe(
    `SELECT role, COUNT(*)::int AS count FROM "users" GROUP BY role ORDER BY role`
  );

  console.log('\nFinal role distribution:');
  let totalAfter = 0;
  for (const row of afterRows) {
    console.log(`  ${row.role}: ${row.count}`);
    totalAfter += row.count;
  }
  console.log(`  Total: ${totalAfter}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
