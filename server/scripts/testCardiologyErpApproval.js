import { prisma } from '../src/config/prisma.js'
import { SuperadminService } from '../src/services/superadmin.service.js'
import { RbacModuleService } from '../src/services/rbacModule.service.js'
import { RbacService } from '../src/services/rbac.service.js'
import { RegistrationService } from '../src/services/registration.service.js'
import { AuthService } from '../src/services/auth.service.js'

async function runCardiologyApprovalTest() {
  console.log('=== STARTING CARDIOLOGY ERP MODULE SWITCHING TEST ===\n')

  // Retry loop for DB connection warm-up
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await prisma.$queryRaw`SELECT 1`
      break
    } catch (e) {
      console.log(`DB connection attempt ${attempt} waiting...`)
      await new Promise((r) => setTimeout(r, 1000))
    }
  }

  // 1. Verify Category "Cardiology" exists and is active
  const category = await prisma.clinicCategory.findUnique({
    where: { name: 'Cardiology' },
    include: {
      categoryModules: {
        include: { module: true },
        orderBy: { displayOrder: 'asc' },
      },
      roleTemplates: true,
    },
  })

  if (!category) {
    throw new Error('FAIL: "Cardiology" category was not found in DB!')
  }
  if (!category.isActive) {
    throw new Error('FAIL: "Cardiology" category is not active!')
  }
  console.log(`[PASS] Found active "Cardiology" category (ID: ${category.id})`)

  // 2. Verify exactly the 12 modules are linked in exact order 1 to 12
  const expectedModules = [
    { key: 'patients', order: 1 },
    { key: 'appointments', order: 2 },
    { key: 'ecg_records', order: 3 },
    { key: 'echo_reports', order: 4 },
    { key: 'cath_lab_scheduling', order: 5 },
    { key: 'cardiac_risk_assessment', order: 6 },
    { key: 'implant_registry', order: 7 },
    { key: 'prescriptions', order: 8 },
    { key: 'billing', order: 9 },
    { key: 'inventory', order: 10 },
    { key: 'reports', order: 11 },
    { key: 'staff', order: 12 },
  ]

  console.log(`[VERIFY] Checking 12 linked modules for Cardiology:`)
  if (category.categoryModules.length !== 12) {
    throw new Error(`FAIL: Expected 12 modules linked, but found ${category.categoryModules.length}`)
  }

  for (let i = 0; i < expectedModules.length; i++) {
    const exp = expectedModules[i]
    const actual = category.categoryModules[i]
    if (actual.module.key !== exp.key || actual.displayOrder !== exp.order) {
      throw new Error(
        `FAIL at index ${i}: expected (${exp.key}, order ${exp.order}), got (${actual.module.key}, order ${actual.displayOrder})`
      )
    }
    console.log(`  [OK] #${actual.displayOrder}: ${actual.module.name} (${actual.module.key})`)
  }
  console.log('[PASS] Exactly 12 modules linked to Cardiology with orders 1-12!\n')

  // 3. Verify Role Templates for all personas
  const roleNames = [
    'Clinic Administrator',
    'Cardiologist',
    'Cardiac Nurse',
    'Cath Lab Technician',
    'Billing Officer',
    'Front Desk',
  ]
  console.log(`[VERIFY] Checking role templates for: ${roleNames.join(', ')}`)
  for (const rName of roleNames) {
    const tpls = category.roleTemplates.filter((t) => t.roleName === rName)
    if (tpls.length === 0) {
      throw new Error(`FAIL: No role templates found for "${rName}" in Cardiology!`)
    }
    console.log(`  [OK] ${rName}: ${tpls.length} template permission rows`)
  }
  console.log('[PASS] All Cardiology role templates verified!\n')

  // 4. Register a test Cardiology clinic via RegistrationService
  const timestamp = Date.now()
  const testSubdomain = `cardio-test-${timestamp}`
  const testEmail = `admin.${testSubdomain}@cardiohealth.org`
  const testPassword = 'Password123!'

  console.log(`[TEST] Submitting clinic registration for subdomain: ${testSubdomain}...`)
  const regResult = await RegistrationService.registerClinic({
    clinicName: `Apex Cardiology Institute ${timestamp}`,
    subdomain: testSubdomain,
    adminName: 'Dr. Michael Chang, MD',
    email: testEmail,
    password: testPassword,
    phone: '+1 555-882-1920',
    clinic_category_id: category.id,
    plan: 'ENTERPRISE',
  })
  console.log(`[PASS] Registration created. ID: ${regResult.registrationId}`)

  // Verify created tenant in DB has status PENDING and clinicCategoryId set
  const tenant = await prisma.tenant.findUnique({
    where: { subdomain: testSubdomain },
    include: { users: true },
  })
  if (!tenant) throw new Error('Tenant was not created in DB!')
  if (tenant.status !== 'PENDING') throw new Error(`Expected tenant status PENDING, got ${tenant.status}`)
  if (tenant.clinicCategoryId !== category.id) {
    throw new Error(`Expected clinicCategoryId ${category.id}, got ${tenant.clinicCategoryId}`)
  }
  console.log(`[PASS] Verified created tenant: ${tenant.id} with category ${category.name}`)

  // 5. Execute Superadmin Approval Transaction
  console.log(`\n[TEST] Approving clinic via SuperadminService.updateTenantStatus(ACTIVE)...`)
  await SuperadminService.updateTenantStatus(tenant.id, 'ACTIVE')
  console.log(`[PASS] Superadmin approval transaction completed successfully!`)

  // 6. Verify TenantModule provisioning (must be exactly 12 enabled modules)
  const tenantModules = await prisma.tenantModule.findMany({
    where: { tenantId: tenant.id, isEnabled: true },
    include: { module: true },
  })
  console.log(`[VERIFY] Active TenantModules for approved clinic: ${tenantModules.length}`)
  if (tenantModules.length !== 12) {
    throw new Error(`FAIL: Expected 12 enabled modules for tenant, got ${tenantModules.length}`)
  }
  const tenantModuleKeys = tenantModules.map((tm) => tm.module.key)
  for (const exp of expectedModules) {
    if (!tenantModuleKeys.includes(exp.key)) {
      throw new Error(`FAIL: Expected module "${exp.key}" is missing from TenantModule!`)
    }
  }
  console.log('[PASS] TenantModule contains exactly the 12 enabled Cardiology modules!\n')

  // 7. Verify provisioned roles and permissions
  const provisionedRoles = await prisma.role.findMany({
    where: { tenantId: tenant.id },
    include: {
      rolePerms: {
        include: {
          permission: {
            include: { module: true, action: true },
          },
        },
      },
    },
  })
  console.log(`[VERIFY] Provisioned roles for tenant: ${provisionedRoles.length}`)
  for (const r of provisionedRoles) {
    console.log(`  - ${r.name}: ${r.rolePerms.length} permissions assigned`)
  }

  // Clinical Administrator must have full permissions on all 12 modules
  const adminRole = provisionedRoles.find((r) => r.name === 'Clinical Administrator')
  if (!adminRole) {
    throw new Error('FAIL: "Clinical Administrator" role was not created!')
  }
  if (adminRole.rolePerms.length < 48) {
    throw new Error(
      `FAIL: Clinical Administrator has only ${adminRole.rolePerms.length} permissions (expected >= 48)`
    )
  }
  console.log(`[PASS] Clinical Administrator role has ${adminRole.rolePerms.length} permissions!\n`)

  // 8. Query RbacModuleService.getPermissionsByRole
  console.log(`[VERIFY] Querying RbacModuleService.getPermissionsByRole for admin...`)
  const permittedModules = await RbacModuleService.getPermissionsByRole('Clinical Administrator', {
    tenantId: tenant.id,
    canViewOnly: true,
  })

  console.log(`[VERIFY] Total permitted modules returned: ${permittedModules.length}`)
  if (permittedModules.length !== 12) {
    throw new Error(`FAIL: Expected 12 permitted modules, got ${permittedModules.length}`)
  }

  console.log('Permitted modules returned by RbacModuleService:')
  permittedModules.forEach((p, idx) => {
    console.log(`  ${idx + 1}. ${p.module_name} (key: ${p.module_key}, route: ${p.module_route})`)
  })

  // 9. Verify Module Isolation via RbacService.isModuleEnabledForTenant
  console.log(`\n[VERIFY] Verifying strict cross-category isolation:`)
  const isEcgEnabled = await RbacService.isModuleEnabledForTenant(tenant.id, 'ecg_records')
  const isDentalChartEnabled = await RbacService.isModuleEnabledForTenant(tenant.id, 'dental_chart')
  const isPhysioTrackerEnabled = await RbacService.isModuleEnabledForTenant(tenant.id, 'exercise_program_tracker')
  const isImplantRegistryEnabled = await RbacService.isModuleEnabledForTenant(tenant.id, 'implant_registry')

  console.log(`  - ecg_records enabled: ${isEcgEnabled} (expected: true)`)
  console.log(`  - dental_chart enabled: ${isDentalChartEnabled} (expected: false)`)
  console.log(`  - exercise_program_tracker enabled: ${isPhysioTrackerEnabled} (expected: false)`)
  console.log(`  - implant_registry enabled: ${isImplantRegistryEnabled} (expected: true)`)

  if (!isEcgEnabled) throw new Error('FAIL: ecg_records should be enabled for Cardiology!')
  if (isDentalChartEnabled) throw new Error('FAIL: dental_chart should NOT be enabled for Cardiology!')
  if (isPhysioTrackerEnabled) throw new Error('FAIL: exercise_program_tracker should NOT be enabled for Cardiology!')
  if (!isImplantRegistryEnabled) throw new Error('FAIL: implant_registry should be enabled for Cardiology!')

  console.log('[PASS] Cross-category isolation strictly enforced!\n')

  // 10. Test Login as Approved Clinic Admin
  console.log(`[TEST] Logging in as approved clinic admin: ${testEmail}...`)
  const loginSession = await AuthService.login(testEmail, testPassword)
  console.log(`[PASS] Login successful! Role: ${loginSession.user?.role || loginSession.user?.userType}`)

  // 11. Clean up test tenant
  console.log(`\n[CLEANUP] Removing test tenant ${tenant.id}...`)
  await prisma.rolePermission.deleteMany({
    where: { role: { tenantId: tenant.id } },
  })
  await prisma.userRole.deleteMany({
    where: { user: { tenantId: tenant.id } },
  })
  await prisma.role.deleteMany({
    where: { tenantId: tenant.id },
  })
  await prisma.tenantModule.deleteMany({
    where: { tenantId: tenant.id },
  })
  await prisma.user.deleteMany({
    where: { tenantId: tenant.id },
  })
  await prisma.tenant.delete({
    where: { id: tenant.id },
  })
  console.log('[PASS] Test tenant cleaned up successfully.\n')

  console.log('=== ALL CARDIOLOGY ERP MODULE TESTS PASSED WITH 100% SUCCESS! ===')
}

runCardiologyApprovalTest()
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.error('TEST FAILED:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
