import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function seedSubscriptionPlans() {
  console.log('🌱 Seeding Subscription Plans & Company Settings...')

  const plans = [
    {
      name: 'Starter Practice',
      code: 'STARTER',
      priceINR: 12500,
      billingPeriod: 'monthly',
      description: 'Essential EHR & scheduling for private practices up to 5 doctors.',
      features: [
        'Up to 5 Doctors',
        'Full EHR & Prescriptions',
        'Basic Billing (INR)',
        'Standard Support'
      ],
      isActive: true,
    },
    {
      name: 'Professional Center',
      code: 'PRO',
      priceINR: 28500,
      billingPeriod: 'monthly',
      description: 'Comprehensive operational suite with dynamic RBAC, inventory & analytics.',
      features: [
        'Up to 25 Practitioners',
        'Dynamic Roles & Permissions',
        'Pharmacy Inventory & Billing',
        'Priority SLA'
      ],
      isActive: true,
    },
    {
      name: 'Hospital Network',
      code: 'ENTERPRISE',
      priceINR: 65000,
      billingPeriod: 'monthly',
      description: 'Dedicated multi-tenant infrastructure, custom audit feeds, and 24/7 dedicated support.',
      features: [
        'Unlimited Staff & Tenants',
        'Custom Modules & Workflows',
        'Dedicated Redis Cluster',
        '24/7 Phone & On-Site Support'
      ],
      isActive: true,
    },
  ]

  for (const plan of plans) {
    const existing = await prisma.subscriptionPlan.findUnique({
      where: { code: plan.code },
    })

    if (!existing) {
      await prisma.subscriptionPlan.create({ data: plan })
      console.log(`  ✅ Created Subscription Plan: ${plan.name} (₹${plan.priceINR.toLocaleString('en-IN')}/mo)`)
    } else {
      await prisma.subscriptionPlan.update({
        where: { code: plan.code },
        data: {
          name: plan.name,
          priceINR: plan.priceINR,
          billingPeriod: plan.billingPeriod,
          description: plan.description,
          features: plan.features,
          isActive: plan.isActive,
        },
      })
      console.log(`  🔄 Updated Subscription Plan: ${plan.name}`)
    }
  }

  // Seed default Company Settings for Zuna
  const existingCompany = await prisma.companySettings.findUnique({
    where: { id: 'default' },
  })

  if (!existingCompany) {
    await prisma.companySettings.create({
      data: {
        id: 'default',
        legalCompanyName: 'Zuna Healthcare Technologies Private Limited',
        tradeName: 'Zuna Clinical ERP',
        address: 'Building 4A, Tech Park, Outer Ring Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560103',
        country: 'India',
        gstin: '29AAAAZ0000A1Z5',
        pan: 'AAAAZ0000A',
        cin: 'U72200KA2026PTC123456',
        sacCode: '998313',
        contactEmail: 'billing@zuna.io',
        phone: '+91 80 4567 8900',
        website: 'https://zuna.io',
        bankName: 'HDFC Bank',
        accountName: 'Zuna Healthcare Technologies Pvt Ltd',
        accountNumber: '50200012345678',
        ifsc: 'HDFC0001234',
        branch: 'Koramangala, Bengaluru',
        upiId: 'zunaerp@hdfcbank',
        invoiceTerms: 'Payment is due within 15 days of invoice issue. Subscription renews automatically unless cancelled 7 days prior to billing cycle end.',
      },
    })
    console.log('  ✅ Created default Zuna Company Settings')
  } else {
    console.log('  ℹ️  Zuna Company Settings already present')
  }

  console.log('✨ Subscription Plans & Company Settings ready!')
}

// Run standalone if invoked directly
if (process.argv[1]?.includes('seed-subscription-plans.js')) {
  seedSubscriptionPlans()
    .catch((err) => {
      console.error('❌ Failed seeding subscription plans:', err)
      process.exit(1)
    })
    .finally(() => prisma.$disconnect())
}
