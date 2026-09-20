import { prisma } from '../src/config/prisma.js'
import { RegistrationService } from '../src/services/registration.service.js'
import { SuperadminService } from '../src/services/superadmin.service.js'
import { AuthService } from '../src/services/auth.service.js'

async function runVerification() {
  console.log('====================================================')
  console.log('VERIFYING MULTI-STATE REGISTRATION & REAL-TIME STATUS')
  console.log('====================================================')

  const timestamp = Date.now()
  const emailPending = `dr.pending-${timestamp}@statustest.io`
  const emailApproved = `dr.approved-${timestamp}@statustest.io`
  const emailRejected = `dr.rejected-${timestamp}@statustest.io`

  let category = await prisma.clinicCategory.findFirst({ where: { isActive: true } })
  if (!category) {
    category = await prisma.clinicCategory.create({
      data: { name: 'General Physician Clinic', description: 'Primary Care' },
    })
  }

  // ----------------------------------------------------
  // TEST 1: Register clinic and verify PENDING status
  // ----------------------------------------------------
  console.log('\n1. Submitting new clinic registration...')
  const regPendingRes = await RegistrationService.registerClinic({
    clinicName: `Pending Clinic ${timestamp}`,
    subdomain: `pending-${timestamp}`,
    adminName: 'Dr. Pending',
    email: emailPending,
    password: 'Password123!',
    phone: '+91 9876543210',
    clinic_category_id: category.id,
  })

  const regPendingId = regPendingRes.registrationId
  console.log(`Registered pending clinic: ${regPendingId}`)

  const statusPending = await RegistrationService.getRegistrationStatus(regPendingId)
  console.log('Queried status:', statusPending.status)
  if (statusPending.status !== 'pending') {
    throw new Error(`Expected status 'pending', got '${statusPending.status}'`)
  }
  console.log('✅ PASS: getRegistrationStatus returns pending state with clinic details:', {
    clinicName: statusPending.registration.clinicName,
    subdomain: statusPending.registration.subdomain,
  })

  // ----------------------------------------------------
  // TEST 2: Register & Reject clinic, verify REJECTED status
  // ----------------------------------------------------
  console.log('\n2. Submitting clinic for rejection test...')
  const regRejectedRes = await RegistrationService.registerClinic({
    clinicName: `Rejected Clinic ${timestamp}`,
    subdomain: `rejected-${timestamp}`,
    adminName: 'Dr. Rejected',
    email: emailRejected,
    password: 'Password123!',
    phone: '+91 9876543211',
    clinic_category_id: category.id,
  })

  const regRejectedId = regRejectedRes.registrationId
  const rejectionReasonText = 'Missing valid medical council registration certificate and clinic establishment license.'
  console.log(`Rejecting registration ${regRejectedId} with reason: "${rejectionReasonText}"...`)

  await RegistrationService.rejectRegistration(regRejectedId, rejectionReasonText)

  const statusRejected = await RegistrationService.getRegistrationStatus(regRejectedId)
  console.log('Queried status after rejection:', statusRejected.status)
  if (statusRejected.status !== 'rejected') {
    throw new Error(`Expected status 'rejected', got '${statusRejected.status}'`)
  }
  if (!statusRejected.rejectionReason || !statusRejected.rejectionReason.includes('Missing valid medical council')) {
    throw new Error(`Expected rejectionReason to match, got: ${statusRejected.rejectionReason}`)
  }
  if (!statusRejected.rejectedAt) {
    throw new Error('Expected rejectedAt timestamp to be present')
  }
  console.log('✅ PASS: getRegistrationStatus returns rejected state with reason & rejectedAt:', {
    status: statusRejected.status,
    rejectionReason: statusRejected.rejectionReason,
    rejectedAt: statusRejected.rejectedAt,
    clinicName: statusRejected.registration?.clinicName,
  })

  // Also verify login attempt throws TenantRejectedError with complete metadata
  try {
    await AuthService.login(emailRejected, 'Password123!')
    throw new Error('Expected login to fail with TenantRejectedError')
  } catch (err) {
    if (err.code !== 'TENANT_REJECTED') {
      throw new Error(`Expected code TENANT_REJECTED, got: ${err.code}`)
    }
    if (!err.details?.rejectionReason) {
      throw new Error('Expected err.details to include rejectionReason')
    }
    console.log('✅ PASS: Login rejected tenant throws TENANT_REJECTED with full details payload:', {
      code: err.code,
      message: err.message,
      details: err.details,
    })
  }

  // ----------------------------------------------------
  // TEST 3: Register & Approve clinic, verify APPROVED status & auto-generated tokens
  // ----------------------------------------------------
  console.log('\n3. Submitting clinic for approval test...')
  const regApprovedRes = await RegistrationService.registerClinic({
    clinicName: `Approved Clinic ${timestamp}`,
    subdomain: `approved-${timestamp}`,
    adminName: 'Dr. Approved',
    email: emailApproved,
    password: 'Password123!',
    phone: '+91 9876543212',
    clinic_category_id: category.id,
  })

  const regApprovedId = regApprovedRes.registrationId
  console.log(`Approving registration ${regApprovedId}...`)
  await RegistrationService.approveRegistration(regApprovedId)

  const statusApproved = await RegistrationService.getRegistrationStatus(regApprovedId)
  console.log('Queried status after approval:', statusApproved.status)
  if (statusApproved.status !== 'approved') {
    throw new Error(`Expected status 'approved', got '${statusApproved.status}'`)
  }
  if (!statusApproved.tokens?.accessToken) {
    throw new Error('Expected valid accessToken to be generated for approved status')
  }
  if (!statusApproved.user?.email) {
    throw new Error('Expected user profile to be returned for approved status')
  }
  console.log('✅ PASS: getRegistrationStatus returns approved state with generated tokens for auto-login:', {
    status: statusApproved.status,
    clinicName: statusApproved.clinic?.name,
    userEmail: statusApproved.user?.email,
    hasAccessToken: !!statusApproved.tokens?.accessToken,
    hasRefreshToken: !!statusApproved.tokens?.refreshToken,
  })

  // ----------------------------------------------------
  // CLEANUP
  // ----------------------------------------------------
  console.log('\n4. Cleaning up test tenants...')
  await prisma.user.deleteMany({
    where: {
      email: { in: [emailPending, emailApproved, emailRejected] },
    },
  }).catch(() => {})

  await prisma.tenant.deleteMany({
    where: {
      subdomain: { in: [`pending-${timestamp}`, `approved-${timestamp}`, `rejected-${timestamp}`] },
    },
  }).catch(() => {})

  console.log('\n====================================================')
  console.log('ALL MULTI-STATE STATUS TESTS PASSED SUCCESSFULLY! ✅')
  console.log('====================================================')
}

runVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Verification failed:', err)
    process.exit(1)
  })
