const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('Admin@123', 12);

  // Create mobile money providers (skip if already exist)
  const providerData = [
    { name: 'MTN MoMo South Sudan', country: 'SSP', code: 'MTN_SS' },
    { name: 'm-Gurush', country: 'SSP', code: 'MGURUSH' },
    { name: 'NilePay', country: 'SSP', code: 'NILEPAY' },
    { name: 'DigiCash', country: 'SSP', code: 'DIGICASH' },
    { name: 'MTN MoMo Uganda', country: 'UGX', code: 'MTN_UG' },
    { name: 'Airtel Money Uganda', country: 'UGX', code: 'AIRTEL_UG' },
    { name: 'M-Pesa Kenya', country: 'KES', code: 'M_PESA' },
    { name: 'Airtel Money Kenya', country: 'KES', code: 'AIRTEL_KE' },
  ]
  const providers = await Promise.all(
    providerData.map((p) =>
      prisma.mobileMoneyProvider.upsert({
        where: { code: p.code },
        update: {},
        create: p,
      })
    )
  );

  // Create default subscription plan (single Enterprise plan)
  const planData = [
    { name: 'Enterprise', description: 'All features included. Unlimited branches, staff, and currencies.', price: 60, currency: 'USD', durationDays: 30, trialDays: 30, maxBranches: 999999, maxStaff: 999999, maxCurrencies: 999999, features: ['Unlimited Branches', 'Unlimited Staff Users', 'Unlimited Currencies', 'Unlimited Transfers', 'Branch Wallets', 'Advanced KYC/AML', 'Advanced Analytics', 'Custom Reports', '24/7 Dedicated Support', 'Dedicated Account Manager', 'Priority Processing', 'Full API Access', 'Custom Integrations', 'Custom Branding & Domain', 'Enterprise Security Features'], isActive: true },
  ]

  // Remove old plans (Small/Medium) if they exist
  await prisma.subscriptionPlan.deleteMany({
    where: { name: { in: ['Small Company', 'Medium Company'] } },
  })

  const plans = await Promise.all(
    planData.map(async (p) => {
      const existing = await prisma.subscriptionPlan.findFirst({ where: { name: p.name } })
      if (existing) {
        return prisma.subscriptionPlan.update({ where: { id: existing.id }, data: p })
      }
      return prisma.subscriptionPlan.create({ data: p })
    })
  );

  // Create company (skip if demo company exists)
  const existingCompany = await prisma.company.findFirst({ where: { name: 'TrustBank South Sudan Ltd' } })
  if (existingCompany) {
    console.log('Seed already run — plans updated successfully')
    console.log('Subscription Plans:')
    plans.forEach((p, i) => console.log(`  ${i + 1}. ${p.name} - $${p.price}/month`))
    return
  }

  const company = await prisma.company.create({
    data: {
      name: 'TrustBank South Sudan Ltd',
      businessTypes: ['MONEY_TRANSFER_COMPANY', 'MOBILE_MONEY_AGENT', 'FOREX_BUREAU'],
      country: 'South Sudan',
      registrationNumber: 'BRN-2024-001',
      taxId: 'TIN-12345',
      numberOfBranches: 3,
      numberOfStaff: 5,
      mainCurrency: 'SSP',
      additionalCurrencies: ['USD', 'KES', 'UGX', 'EUR', 'GBP'],
      address: '123 Business Avenue, Juba',
      phone: '+211 123 456 789',
      email: 'info@trustbank.com',
      onboardingComplete: true,
    },
  });

  // Create branches
  const branches = await Promise.all([
    prisma.branch.create({
      data: { name: 'TrustBank - Juba Main', code: 'JBM001', country: 'South Sudan', city: 'Juba', address: 'Downtown Juba', companyId: company.id },
    }),
    prisma.branch.create({
      data: { name: 'TrustBank - Nairobi', code: 'NBI002', country: 'Kenya', city: 'Nairobi', address: 'CBD Nairobi', companyId: company.id },
    }),
    prisma.branch.create({
      data: { name: 'TrustBank - Kampala', code: 'KLA003', country: 'Uganda', city: 'Kampala', address: 'Kampala Road', companyId: company.id },
    }),
  ]);

  // Create users
  const users = await Promise.all([
    prisma.user.create({ data: { name: 'John Admin', email: 'admin@trustbank.com', password, role: 'COMPANY_OWNER', status: 'ACTIVE', companyId: company.id, branchId: branches[0].id } }),
    prisma.user.create({ data: { name: 'Mary Manager', email: 'manager@trustbank.com', password, role: 'BRANCH_MANAGER', status: 'ACTIVE', companyId: company.id, branchId: branches[0].id } }),
    prisma.user.create({ data: { name: 'Peter Teller', email: 'teller@trustbank.com', password, role: 'TELLER', status: 'ACTIVE', companyId: company.id, branchId: branches[0].id } }),
    prisma.user.create({ data: { name: 'Sarah Compliance', email: 'compliance@trustbank.com', password, role: 'COMPLIANCE_OFFICER', status: 'ACTIVE', companyId: company.id, branchId: branches[0].id } }),
    prisma.user.create({ data: { name: 'Tom Auditor', email: 'auditor@trustbank.com', password, role: 'AUDITOR', status: 'ACTIVE', companyId: company.id, branchId: branches[0].id } }),
  ]);

  // Link company to mobile money providers
  const sspProviders = providers.filter(p => p.country === 'SSP');
  for (const p of sspProviders) {
    await prisma.companyMobileProvider.create({ data: { companyId: company.id, providerId: p.id } });
  }

  // Create exchange rates
  await prisma.exchangeRate.createMany({
    data: [
      { fromCurrency: 'SSP', toCurrency: 'USD', buyRate: 0.00115, sellRate: 0.00118, companyId: company.id, createdById: users[0].id },
      { fromCurrency: 'USD', toCurrency: 'SSP', buyRate: 850, sellRate: 870, companyId: company.id, createdById: users[0].id },
      { fromCurrency: 'USD', toCurrency: 'KES', buyRate: 150, sellRate: 155, companyId: company.id, createdById: users[0].id },
      { fromCurrency: 'USD', toCurrency: 'UGX', buyRate: 3700, sellRate: 3750, companyId: company.id, createdById: users[0].id },
      { fromCurrency: 'EUR', toCurrency: 'USD', buyRate: 1.08, sellRate: 1.10, companyId: company.id, createdById: users[0].id },
      { fromCurrency: 'GBP', toCurrency: 'USD', buyRate: 1.26, sellRate: 1.28, companyId: company.id, createdById: users[0].id },
      { fromCurrency: 'USD', toCurrency: 'AED', buyRate: 3.67, sellRate: 3.67, companyId: company.id, createdById: users[0].id },
    ],
  });

  // Create sample customers
  const customers = await Promise.all([
    prisma.customer.create({ data: { fullName: 'John Deng', phone: '+211 111 111 111', nationality: 'South Sudanese', companyId: company.id } }),
    prisma.customer.create({ data: { fullName: 'Mary Akol', phone: '+211 222 222 222', nationality: 'South Sudanese', companyId: company.id } }),
    prisma.customer.create({ data: { fullName: 'James Ochieng', phone: '+254 333 333 333', nationality: 'Kenyan', companyId: company.id } }),
  ]);

  // Create sample transfers with secret codes
  await Promise.all([
    prisma.transfer.create({
      data: {
        transactionNumber: 'TXN-20250614-0001',
        secretCode: 'TRU12345',
        transactionType: 'CASH_TO_CASH',
        amount: 500, currency: 'USD',
        commission: 10, commissionType: 'INCLUDED', totalAmount: 500,
        senderAmount: 500, receiverAmount: 490,
        status: 'COMPLETED',
        senderId: customers[0].id, receiverId: customers[1].id,
        companyId: company.id, issuedById: users[2].id, paidById: users[0].id, paidAt: new Date(),
      },
    }),
    prisma.transfer.create({
      data: {
        transactionNumber: 'TXN-20250614-0002',
        secretCode: 'TRU67890',
        transactionType: 'CASH_TO_MOBILE',
        amount: 120000, currency: 'SSP',
        commission: 2400, commissionType: 'SEPARATE', totalAmount: 122400,
        senderAmount: 122400, receiverAmount: 120000,
        mobileProviderId: providers[0].id,
        status: 'PENDING',
        senderId: customers[1].id, receiverId: customers[2].id,
        companyId: company.id, issuedById: users[2].id,
      },
    }),
    prisma.transfer.create({
      data: {
        transactionNumber: 'TXN-20250614-0003',
        secretCode: 'TRU54321',
        transactionType: 'MOBILE_TO_CASH',
        amount: 30000, currency: 'KES',
        commission: 600, commissionType: 'INCLUDED', totalAmount: 30000,
        senderAmount: 30000, receiverAmount: 29400,
        mobileProviderId: providers[6].id,
        status: 'PENDING',
        senderId: customers[2].id, receiverId: customers[0].id,
        companyId: company.id, issuedById: users[2].id,
      },
    }),
  ]);

  // Create branch links for transfers
  const allTransfers = await prisma.transfer.findMany();
  for (const t of allTransfers) {
    await prisma.branchTransaction.create({
      data: { transferId: t.id, senderBranchId: branches[0].id, receiverBranchId: branches[1].id },
    });
  }

  // Create platform admin user (no company association - manages all companies)
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

  // Create default platform settings
  await prisma.platformSetting.create({
    data: {
      platformName: 'Trustbank360',
      primaryColor: '#0F4C81',
      secondaryColor: '#00A86B',
      bankInstructions: 'Please transfer the amount to the following bank account and send proof of payment to payments@trustbank360.com or via WhatsApp.',
      bankAccountName: 'Trustbank360 Ltd',
      bankAccountNumber: '1001234567',
      bankName: 'Equity Bank',
      currencySettings: 'USD,SSP,UGX,KES',
    },
  });

  console.log('Seed completed!');
  console.log('');
  console.log('Login credentials:');
  console.log('  Email: admin@trustbank.com');
  console.log('  Password: Admin@123');
  console.log('  Email: platform@trustbank360.com (Platform Admin)');
  console.log('  Password: Admin@123');
  console.log('');
  console.log('Test Secret Codes:');
  console.log('  TRU12345 (Completed)');
  console.log('  TRU67890 (Pending - Incoming)');
  console.log('  TRU54321 (Pending - Incoming)');
  console.log('');
  console.log('Mobile Money Providers seeded:');
  console.log('  SSP: MTN MoMo, m-Gurush, NilePay, DigiCash');
  console.log('  UGX: MTN MoMo Uganda, Airtel Money Uganda');
  console.log('  KES: M-Pesa Kenya, Airtel Money Kenya');
  console.log('');
  console.log('Subscription Plans:');
  plans.forEach((p, i) => console.log(`  ${i + 1}. ${p.name} - $${p.price}/month`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
