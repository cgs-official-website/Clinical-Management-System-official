import { prisma } from '../src/config/prisma.js'
import { AuthService } from '../src/services/auth.service.js'
import { SuperadminService } from '../src/services/superadmin.service.js'
import { RegistrationService } from '../src/services/registration.service.js'

async function runVerification() {
  console.log('====================================================')
  console.log('STARTING CLINIC REGISTRATION & REJECTION FLOW TESTS')
  console.log('====================================================\n')

  // Step 1: Verify Categories
  console.log('1. Fetching clinic categories...')
  const categories = await SuperadminService.getClinicCategories()
  console.log(`Found ${categories.length} categories:`, categories.map(c => c.name))
  if (categories.length === 0) {
    throw new Error('No clinic categories found!')
  }

  const dentalCategory = categories.find(c => c.name.toLowerCase().includes('dental')) || categories[0]
  console.log(`Using category for test: "${dentalCategory.name}" (${dentalCategory.id})`)

  // Step 2: Register Clinic with Category
  const testSubdomain = `test-reject-${Date.now()}`
  const testEmail = `dr.${testSubdomain}@testclinic.io`
  console.log(`\n2. Submitting clinic registration for ${testEmail}...`)

  const regResult = await RegistrationService.registerClinic({
    clinicName: 'Test Apex Rejection Clinic',
    subdomain: testSubdomain,
    adminName: 'Dr. John Apex',
    email: testEmail,
    password: 'Password123!',
    phone: '+91 9988776655',
    clinic_category_id: dentalCategory.id,
  })

  console.log('Registration submitted successfully:', regResult.registrationId)

  // Verify status is PENDING in database
  const createdTenant = await prisma.tenant.findUnique({
    where: { subdomain: testSubdomain }
  })
  console.log(`Tenant created: ID ${createdTenant?.id}, status: ${createdTenant?.status}, categoryId: ${createdTenant?.clinicCategoryId}`)
  if (createdTenant?.status !== 'PENDING') {
    throw new Error(`Expected tenant status to be PENDING, got ${createdTenant?.status}`)
  }

  // Step 3: Test Login while PENDING
  console.log('\n3. Testing login while tenant is PENDING...')
  try {
    await AuthService.login(testEmail, 'Password123!')
    throw new Error('Expected login to fail for PENDING tenant!')
  } catch (err) {
    console.log(`Caught error as expected: code=${err.code}, status=${err.statusCode}, message="${err.message}"`)
    if (err.code !== 'TENANT_PENDING_APPROVAL') {
      throw new Error(`Expected TENANT_PENDING_APPROVAL, got ${err.code}`)
    }
  }

  // Step 4: Superadmin Rejects Tenant with Reason
  const rejectionReason = 'Incomplete state dental council registration certificate. Please re-submit with license.'
  console.log(`\n4. Superadmin rejecting clinic with reason: "${rejectionReason}"...`)

  const rejectResult = await SuperadminService.updateTenantStatus(
    createdTenant.id,
    'REJECTED',
    null,
    rejectionReason
  )
  console.log('Reject result:', rejectResult.status, 'rejectionReason:', rejectResult.rejectionReason)

  const rejectedTenant = await prisma.tenant.findUnique({
    where: { id: createdTenant.id }
  })
  if (rejectedTenant.status !== 'REJECTED' || rejectedTenant.rejectionReason !== rejectionReason) {
    throw new Error(`Tenant DB fields mismatch: status=${rejectedTenant.status}, reason=${rejectedTenant.rejectionReason}`)
  }

  // Step 5: Test Login while REJECTED
  console.log('\n5. Testing login while tenant is REJECTED...')
  try {
    await AuthService.login(testEmail, 'Password123!')
    throw new Error('Expected login to fail for REJECTED tenant!')
  } catch (err) {
    console.log(`Caught error as expected: code=${err.code}, status=${err.statusCode}, message="${err.message}"`)
    if (err.code !== 'TENANT_REJECTED') {
      throw new Error(`Expected TENANT_REJECTED, got ${err.code}`)
    }
    if (err.message !== rejectionReason) {
      throw new Error(`Expected error message to equal exact rejection reason, got "${err.message}"`)
    }
  }

  // Step 6: Test Approval & Transactional Role Seeding
  const testSubdomain2 = `test-approve-${Date.now()}`
  const testEmail2 = `dr.${testSubdomain2}@testclinic.io`
  console.log(`\n6. Submitting a second registration for category approval test: ${testEmail2}...`)

  await RegistrationService.registerClinic({
    clinicName: 'Test Approved Dental Care',
    subdomain: testSubdomain2,
    adminName: 'Dr. Dental Specialist',
    email: testEmail2,
    password: 'Password123!',
    phone: '+91 9988776644',
    clinic_category_id: dentalCategory.id,
  })

  const tenant2 = await prisma.tenant.findUnique({
    where: { subdomain: testSubdomain2 }
  })

  console.log(`Approving tenant ${tenant2.id} with category "${dentalCategory.name}"...`)
  const approveResult = await SuperadminService.updateTenantStatus(
    tenant2.id,
    'ACTIVE'
  )
  console.log('Approve result status:', approveResult.status)

  // Verify roles created for tenant2
  const seededRoles = await prisma.role.findMany({
    where: { tenantId: tenant2.id },
    include: { rolePerms: { include: { permission: true } } }
  })
  console.log(`Seeded ${seededRoles.length} roles for approved tenant:`)
  for (const r of seededRoles) {
    console.log(`  - Role: "${r.name}" (${r.rolePerms.length} permissions, isSystemRole=${r.isSystemRole})`)
  }

  const roleNames = seededRoles.map(r => r.name)
  if (!roleNames.includes('Clinical Administrator')) {
    throw new Error('Clinical Administrator role was not created!')
  }
  if (!roleNames.includes('Dentist')) {
    throw new Error('Category role "Dentist" was not created!')
  }

  // Step 7: Test Login for Approved Tenant Admin
  console.log(`\n7. Testing login for approved tenant admin ${testEmail2}...`)
  const loginSession = await AuthService.login(testEmail2, 'Password123!')
  console.log('Login successful! User ID:', loginSession.user.id, 'Role:', loginSession.user.role)
  console.log('Available permissions count:', loginSession.user.permissions?.length)

  // Cleanup test records
  console.log('\n8. Cleaning up test data...')
  await prisma.tenant.deleteMany({
    where: { subdomain: { in: [testSubdomain, testSubdomain2] } }
  }).catch(() => {})

  console.log('\n====================================================')
  console.log('ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ✅')
  console.log('====================================================')
}

runVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ VERIFICATION TEST FAILED:', err)
    process.exit(1)
  })
