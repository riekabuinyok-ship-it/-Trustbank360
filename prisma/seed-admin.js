const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Check if platform admin already exists
  const existing = await prisma.user.findUnique({ where: { email: 'platform@trustbank360.com' } });
  if (existing) {
    console.log('Platform admin already exists.');
    return;
  }

  // Find any company to associate the admin with (needed for FK constraint)
  const company = await prisma.company.findFirst();
  if (!company) {
    console.error('No company exists. Please run seed first (npm run db:seed).');
    process.exit(1);
  }

  const password = await bcrypt.hash('Admin@123', 12);

  await prisma.user.create({
    data: {
      name: 'Platform Admin',
      email: 'platform@trustbank360.com',
      password,
      role: 'PLATFORM_ADMIN',
      status: 'ACTIVE',
      companyId: company.id,
    },
  });

  // Ensure PlatformSetting exists
  const existingSettings = await prisma.platformSetting.findFirst();
  if (!existingSettings) {
    await prisma.platformSetting.create({
      data: {
        platformName: 'Trustbank360',
        primaryColor: '#0F4C81',
        secondaryColor: '#00A86B',
        currencySettings: 'USD,SSP,UGX,KES',
      },
    });
  }

  // Ensure subscription plans exist
  const planCount = await prisma.subscriptionPlan.count();
  if (planCount === 0) {
    await prisma.subscriptionPlan.createMany({
      data: [
        { name: 'Small Company', description: 'For small money transfer businesses', price: 10, currency: 'USD', durationDays: 30, features: ['Up to 2 Branches', 'Up to 5 Staff Users', 'Basic Money Transfers', 'Customer Management', 'Basic Reports', 'Email Support', 'Secure Cloud Hosting', 'Branch Wallets', 'Advanced Compliance', 'API Access', 'Custom Branding', 'Up to 2 Active Currencies'] },
        { name: 'Medium Company', description: 'For growing remittance agencies', price: 30, currency: 'USD', durationDays: 30, features: ['Up to 10 Branches', 'Up to 25 Staff Users', 'Unlimited Transfers', 'Branch Wallets', 'KYC & Compliance', 'Advanced Reports', 'Priority Email & Chat Support', 'Branch Performance Analytics', 'Audit Logs', 'Basic API Access', 'Custom Branding', 'Up to 6 Active Currencies'] },
        { name: 'Enterprise', description: 'For large-scale financial institutions', price: 60, currency: 'USD', durationDays: 30, features: ['Unlimited Branches', 'Unlimited Staff Users', 'Unlimited Transfers', 'Branch Wallets', 'Advanced KYC/AML', 'Advanced Analytics', 'Custom Reports', '24/7 Dedicated Support', 'Dedicated Account Manager', 'Priority Processing', 'Full API Access', 'Custom Integrations', 'Custom Branding & Domain', 'Enterprise Security Features', 'Unlimited Currencies'] },
      ],
    });
  }

  console.log('Platform admin created successfully!');
  console.log('  Email: platform@trustbank360.com');
  console.log('  Password: Admin@123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
