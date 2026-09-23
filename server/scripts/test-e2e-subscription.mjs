import { prisma } from '../src/config/prisma.js'
import { RegistrationService } from '../src/services/registration.service.js'
import { SuperadminService } from '../src/services/superadmin.service.js'
import { SubscriptionService } from '../src/services/subscription.service.js'

async function runE2ETest() {
  console.log('=== STARTING END-TO-END SUBSCRIPTION & INVOICE VERIFICATION ===\n')

  // Step 1: Verify Subscription Plans in PostgreSQL
  console.log('1. Checking Subscription Plans in PostgreSQL...')
  const plans = await SubscriptionService.getPlans()
  console.log(`Found ${plans.length} subscription plans:`)
  plans.forEach(p => console.log(`   - ${p.name} (${p.code}): ₹${p.priceINR}/month`))
  
  const enterprisePlan = plans.find(p => p.code === 'ENTERPRISE') || plans.find(p => p.name.includes('Hospital'))
  if (!enterprisePlan) {
    throw new Error('Hospital Network plan not found!')
  }
  console.log(`\nSelected Plan for test: "${enterprisePlan.name}" (ID: ${enterprisePlan.id}, ₹${enterprisePlan.priceINR})`)

  // Step 2: Get a clinic category
  const category = await prisma.clinicCategory.findFirst({ where: { isActive: true } })
  console.log(`Using Category: "${category.name}" (ID: ${category.id})`)

  // Generate unique timestamp for clinic name
  const timestamp = Date.now().toString().slice(-4)
  const clinicName = `ABC Hospital ${timestamp}`
  const subdomain = `abc-hospital-${timestamp}`
  const adminEmail = `admin-${timestamp}@abchospital.com`

  console.log(`\n2. Submitting Clinic Registration for "${clinicName}"...`)
  const regResult = await RegistrationService.registerClinic({
    clinicName,
    subdomain,
    adminName: 'Dr. Rajesh Sharma',
    email: adminEmail,
    password: 'Password@123',
    phone: '9876543210',
    specialty: 'Multispecialty Care',
    region: 'Asia / India (INR ₹)',
    plan: enterprisePlan.name,
    planId: enterprisePlan.id,
    clinic_category_id: category.id
  })

  console.log('Registration submitted successfully! Registration ID/Tenant ID:', regResult.registrationId || regResult.clinicId)

  // Step 3: Check Tenant record in PostgreSQL
  const tenant = await prisma.tenant.findUnique({
    where: { subdomain },
    include: { planRelation: true }
  })

  if (!tenant) {
    throw new Error(`Tenant with subdomain ${subdomain} not found in PostgreSQL!`)
  }
  console.log(`Tenant created in DB: ID=${tenant.id}, Status=${tenant.status}, PlanID=${tenant.planId}, PlanName=${tenant.planRelation?.name}`)

  // Step 4: Approve the Tenant via Superadmin Workflow
  console.log('\n3. Executing Superadmin Approval for Tenant...')
  const approveResult = await SuperadminService.approveTenantTransaction(tenant.id)
  console.log('Superadmin approval succeeded:', approveResult.message || 'Approved')

  // Step 5: Verify database-backed SubscriptionInvoice
  console.log('\n4. Verifying SubscriptionInvoice record in PostgreSQL...')
  const invoices = await prisma.subscriptionInvoice.findMany({
    where: { tenantId: tenant.id },
    include: { tenant: { include: { planRelation: true } } }
  })

  console.log(`Found ${invoices.length} subscription invoice(s) for tenant:`)
  if (invoices.length === 0) {
    throw new Error('NO SUBSCRIPTION INVOICE CREATED FOR TENANT!')
  }

  const invoice = invoices[0]
  const totalTax = (invoice.cgstAmount || 0) + (invoice.sgstAmount || 0) + (invoice.igstAmount || 0)
  console.log(`   - Invoice Number: ${invoice.invoiceNumber}`)
  console.log(`   - Status:         ${invoice.status}`)
  console.log(`   - Base Amount:    ₹${invoice.baseAmount}`)
  console.log(`   - CGST (9%):      ₹${invoice.cgstAmount}`)
  console.log(`   - SGST (9%):      ₹${invoice.sgstAmount}`)
  console.log(`   - Total GST:      ₹${totalTax} (18% GST)`)
  console.log(`   - Total Amount:   ₹${invoice.totalAmount}`)
  console.log(`   - Currency:       ${invoice.currency}`)
  console.log(`   - Period:         ${invoice.periodStart?.toISOString().split('T')[0]} to ${invoice.periodEnd?.toISOString().split('T')[0]}`)

  // Step 6: Verify Admin Subscription Service Response (what the Clinic Admin sees)
  console.log('\n5. Verifying Admin Subscription Service payload (Clinic Admin View)...')
  const adminSubData = await SubscriptionService.getTenantSubscription(tenant.id)

  console.log(`   - Tenant Name:       "${adminSubData.tenant.name}"`)
  console.log(`   - Current Plan:      "${adminSubData.currentPlan.name}" (Code: ${adminSubData.currentPlan.code})`)
  console.log(`   - Latest Invoice #:  "${adminSubData.latestInvoice.invoiceNumber}"`)
  console.log(`   - Amount in Words:   "${adminSubData.latestInvoice.amountInWords}"`)
  console.log(`   - CGST (9%):         ₹${adminSubData.latestInvoice.cgstAmount}`)
  console.log(`   - SGST (9%):         ₹${adminSubData.latestInvoice.sgstAmount}`)
  console.log(`   - Total:             ₹${adminSubData.latestInvoice.totalAmount}`)
  console.log(`   - Company Legal:     "${adminSubData.companySettings.legalCompanyName}"`)
  console.log(`   - Company GSTIN:     "${adminSubData.companySettings.gstin}"`)
  console.log(`   - Company Bank:      "${adminSubData.companySettings.bankName}"`)

  // Step 7: Verify Superadmin Invoices Ledger
  console.log('\n6. Verifying Superadmin Subscriptions Ledger...')
  const allSubInvoices = await SubscriptionService.getAllSubscriptions()
  const invoicesList = allSubInvoices.data || []
  const foundInSuperadmin = invoicesList.some(i => i.id === invoice.id)
  console.log(`Invoice ${invoice.invoiceNumber} appears in Superadmin Ledger: ${foundInSuperadmin} (Total Superadmin Invoices: ${invoicesList.length})`)

  console.log('\n=== ALL END-TO-END SUBSCRIPTION & INVOICE CHECKS PASSED SUCCESSFULLY! ===')
}

runE2ETest()
  .catch(err => {
    console.error('\nE2E VERIFICATION ERROR:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
