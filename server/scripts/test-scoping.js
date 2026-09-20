import { prisma } from '../src/config/prisma.js'
import { AdminService } from '../src/services/admin.service.js'

async function runTests() {
  console.log('=== RUNNING TENANT & CATEGORY SCOPING TESTS ===\n')

  const cardiologyTenant = await prisma.tenant.findFirst({
    where: { name: 'Aura Health Memorial' }
  })
  const dentalTenant = await prisma.tenant.findFirst({
    where: { name: 'super' }
  })

  console.log(`Cardiology Tenant ID: ${cardiologyTenant.id} (${cardiologyTenant.name})`)
  console.log(`Dental Tenant ID:     ${dentalTenant.id} (${dentalTenant.name})\n`)

  // 1. Departments test for Cardiology
  console.log('--- Test 1: Cardiology Departments ---')
  const cardioDepts = await AdminService.getDepartments(cardiologyTenant.id)
  console.log('Departments returned for Cardiology:', cardioDepts.map(d => d.name))
  const hasDentalInCardio = cardioDepts.some(d => d.name.toLowerCase().includes('dent') || d.name.toLowerCase().includes('oral'))
  if (hasDentalInCardio) {
    throw new Error('FAIL: Dental department found in Cardiology tenant departments!')
  }
  if (!cardioDepts.some(d => d.name === 'Cardiology')) {
    throw new Error('FAIL: Cardiology department missing for Cardiology tenant!')
  }
  console.log('PASS: Cardiology departments strictly scoped.\n')

  // 2. Departments test for Dental Care
  console.log('--- Test 2: Dental Care Departments ---')
  const dentalDepts = await AdminService.getDepartments(dentalTenant.id)
  console.log('Departments returned for Dental Care:', dentalDepts.map(d => d.name))
  const hasCardioInDental = dentalDepts.some(d => d.name.toLowerCase().includes('cardio') || d.name.toLowerCase().includes('cardiac'))
  if (hasCardioInDental) {
    throw new Error('FAIL: Cardiology department found in Dental tenant departments!')
  }
  if (!dentalDepts.some(d => d.name === 'General Dentistry')) {
    throw new Error('FAIL: General Dentistry department missing for Dental tenant!')
  }
  console.log('PASS: Dental Care departments strictly scoped.\n')

  // 3. Roles test for Cardiology
  console.log('--- Test 3: Cardiology Roles ---')
  const cardioRoles = await AdminService.getRoles(cardiologyTenant.id)
  console.log('Roles returned for Cardiology tenant:', cardioRoles.map(r => `${r.name} (${r.permissions.length} perms)`))
  const hasDentistInCardio = cardioRoles.some(r => r.name.toLowerCase().includes('dent'))
  if (hasDentistInCardio) {
    throw new Error('FAIL: Dentist role found in Cardiology tenant roles!')
  }
  console.log('PASS: Cardiology roles strictly scoped. Zero dental roles.\n')

  // 4. Roles test for Dental Care
  console.log('--- Test 4: Dental Care Roles ---')
  const dentalRoles = await AdminService.getRoles(dentalTenant.id)
  console.log('Roles returned for Dental tenant:', dentalRoles.map(r => `${r.name} (${r.permissions.length} perms)`))
  const hasPhysicianInDental = dentalRoles.some(r => r.name.includes('Senior Attending Physician') || r.name.includes('Cardiologist'))
  if (hasPhysicianInDental) {
    throw new Error('FAIL: Physician/Cardiologist role found in Dental tenant roles!')
  }
  console.log('PASS: Dental roles strictly scoped. Zero cardiology roles.\n')

  // 5. Submit validation: Invalid role rejection
  console.log('--- Test 5: Validation - Invalid Role for Clinic ---')
  const dentalRole = dentalRoles.find(r => r.name === 'Dentist')
  let roleRejected = false
  try {
    await AdminService.createStaff({
      tenantId: cardiologyTenant.id,
      name: 'Dr. Test Fraud',
      email: 'test.fraud@example.com',
      department: 'Cardiology',
      specialty: 'Test',
      roles: [dentalRole.id]
    })
  } catch (err) {
    if (err.message.includes('Invalid role for this clinic') && err.statusCode === 400) {
      roleRejected = true
      console.log('Caught expected 400 error:', err.message)
    } else {
      console.error('Unexpected error:', err)
    }
  }
  if (!roleRejected) {
    throw new Error('FAIL: Submitting Dental role to Cardiology tenant was NOT rejected with 400!')
  }
  console.log('PASS: Invalid role rejected with 400.\n')

  // 6. Submit validation: Invalid department rejection
  console.log('--- Test 6: Validation - Invalid Department for Category ---')
  const cardioRole = cardioRoles.find(r => r.name.includes('Physician') || r.name.includes('Administrator') || r.name.includes('Cardiologist'))
  let deptRejected = false
  try {
    await AdminService.createStaff({
      tenantId: cardiologyTenant.id,
      name: 'Dr. Test Dept Mismatch',
      email: 'test.deptmismatch@example.com',
      department: 'General Dentistry',
      specialty: 'Test',
      roles: [cardioRole.id]
    })
  } catch (err) {
    if (err.message.includes('Invalid department for this clinic category') && err.statusCode === 400) {
      deptRejected = true
      console.log('Caught expected 400 error:', err.message)
    } else {
      console.error('Unexpected error:', err)
    }
  }
  if (!deptRejected) {
    throw new Error('FAIL: Submitting Dental department to Cardiology tenant was NOT rejected with 400!')
  }
  console.log('PASS: Invalid department rejected with 400.\n')

  console.log('=== ALL BACKEND SCOPING TESTS PASSED SUCCESSFULLY! ===')
}

runTests()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('TEST ERROR:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
