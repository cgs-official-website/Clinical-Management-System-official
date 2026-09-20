import { prisma } from '../src/config/prisma.js'
import { SuperadminService } from '../src/services/superadmin.service.js'
import { RegistrationService } from '../src/services/registration.service.js'
import { RbacModuleService } from '../src/services/rbacModule.service.js'
import { RbacService } from '../src/services/rbac.service.js'
import { AuthService } from '../src/services/auth.service.js'

async function runTest() {
  console.log('=== STARTING PHYSIOTHERAPY CATEGORY ERP APPROVAL TEST ===\n')

  // Warm-up database connection
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await prisma.$queryRaw`SELECT 1`
      break
    } catch (err) {
      if (attempt === 5) throw err
      console.log(`Database connection warm-up attempt ${attempt} failed, retrying in 2s...`)
      await new Promise((r) => setTimeout(r, 2000))
    }
  }

  // 1. Fetch Physiotherapy category
  const physioCategory = await prisma.clinicCategory.findUnique({
    where: { name: 'Physiotherapy' },
    include: {
      categoryModules: {
        include: { module: true },
        orderBy: { displayOrder: 'asc' },
      },
      roleTemplates: true,
    },
  })

  if (!physioCategory) {
    throw new Error('Physiotherapy category not found in DB!')
  }
  console.log(`[PASS] Found Physiotherapy category (ID: ${physioCategory.id}) with isActive: ${physioCategory.isActive}`)
  console.log(`[PASS] Found ${physioCategory.categoryModules.length} category modules linked in ClinicCategoryModule.`)
  if (physioCategory.categoryModules.length !== 10) {
    throw new Error(`Expected exactly 10 category modules, but found ${physioCategory.categoryModules.length}`)
  }

  const expected10Modules = [
    { key: 'patients', order: 1 },
    { key: 'appointments', order: 2 },
    { key: 'treatment_session_plans', order: 3 },
    { key: 'exercise_program_tracker', order: 4 },
    { key: 'progress_recovery_notes', order: 5 },
    { key: 'prescriptions', order: 6 },
    { key: 'billing', order: 7 },
    { key: 'inventory', order: 8 },
    { key: 'reports', order: 9 },
    { key: 'staff', order: 10 },
  ]

  for (let i = 0; i < expected10Modules.length; i++) {
    const cm = physioCategory.categoryModules[i]
    const expected = expected10Modules[i]
    if (cm.module.key !== expected.key || cm.displayOrder !== expected.order) {
      throw new Error(`Module mismatch at index ${i}: expected ${expected.key} (order ${expected.order}), got ${cm.module.key} (order ${cm.displayOrder})`)
    }
  }
  console.log('[PASS] All 10 Physiotherapy modules verified in exact specified order!')

  // 2. Verify public category API returns Physiotherapy
  const publicCategories = await prisma.clinicCategory.findMany({
    where: { isActive: true },
    select: { id: true, name: true, isActive: true },
  })
  const foundInPublic = publicCategories.find((c) => c.name === 'Physiotherapy')
  if (!foundInPublic) {
    throw new Error('Physiotherapy category not found among active public categories!')
  }
  console.log('[PASS] Physiotherapy returned by public clinic categories query.')

  // 3. Register a test clinic under "Physiotherapy"
  const testSubdomain = `test-physio-${Date.now()}`
  const testEmail = `admin.${testSubdomain}@physiotest.org`
  const testPassword = 'Password123!'

  console.log(`\nSubmitting clinic registration for subdomain: ${testSubdomain}...`)
  const regResult = await RegistrationService.registerClinic({
    clinicName: 'Active Motion Physical Therapy & Rehab',
    subdomain: testSubdomain,
    adminName: 'Dr. Marcus Vance PT, DPT',
    email: testEmail,
    password: testPassword,
    phone: '+1 555-482-9102',
    clinic_category_id: physioCategory.id,
    plan: 'Professional',
  })

  console.log(`[PASS] Registration submitted. ID: ${regResult.registrationId}`)

  // Verify created tenant in DB has status PENDING and clinicCategoryId set
  const tenant = await prisma.tenant.findUnique({
    where: { subdomain: testSubdomain },
    include: { users: true },
  })

  if (!tenant) throw new Error('Tenant was not created in DB!')
  if (tenant.status !== 'PENDING') throw new Error(`Expected tenant status PENDING, got ${tenant.status}`)
  if (tenant.clinicCategoryId !== physioCategory.id) {
    throw new Error(`Expected tenant.clinicCategoryId to match ${physioCategory.id}, got ${tenant.clinicCategoryId}`)
  }
  console.log(`[PASS] Tenant created (ID: ${tenant.id}) with clinicCategoryId: ${tenant.clinicCategoryId} and status: PENDING`)

  // 4. Superadmin Approves Tenant
  console.log('\nExecuting Superadmin approval transaction...')
  const approvalResult = await SuperadminService.updateTenantStatus(tenant.id, 'ACTIVE')
  console.log(`[PASS] Approval completed. Tenant status: ${approvalResult.status}`)

  // 5. Verify TenantModule records
  const tenantModules = await prisma.tenantModule.findMany({
    where: { tenantId: tenant.id },
    include: { module: true },
  })
  const enabledTenantModules = tenantModules.filter((tm) => tm.isEnabled)
  console.log(`[VERIFY] Enabled TenantModules count: ${enabledTenantModules.length}`)

  if (enabledTenantModules.length !== 10) {
    throw new Error(`Expected exactly 10 enabled TenantModules, got ${enabledTenantModules.length}`)
  }

  const enabledKeys = enabledTenantModules.map((tm) => tm.module.key)
  console.log('Enabled module keys for tenant:', enabledKeys)

  for (const item of expected10Modules) {
    if (!enabledKeys.includes(item.key)) {
      throw new Error(`Expected module key '${item.key}' missing from enabled TenantModules!`)
    }
  }

  // Confirm NO Dental Care modules are enabled
  const dentalModules = ['dental_chart', 'treatment_plans', 'xray_records', 'orthodontics', 'implant_registry', 'lab_orders']
  for (const dKey of dentalModules) {
    if (enabledKeys.includes(dKey)) {
      throw new Error(`Dental module '${dKey}' was unexpectedly found in Physiotherapy TenantModule!`)
    }
  }
  console.log('[PASS] TenantModule strictly contains the 10 Physiotherapy modules and NO Dental Care modules!')

  // 6. Verify provisioned roles and permissions
  const provisionedRoles = await prisma.role.findMany({
    where: { tenantId: tenant.id },
    include: {
      rolePerms: {
        include: { permission: { include: { module: true, action: true } } },
      },
    },
  })

  console.log(`[VERIFY] Provisioned roles count: ${provisionedRoles.length}`)
  const roleNames = provisionedRoles.map((r) => r.name)
  console.log('Provisioned role names:', roleNames)

  if (!roleNames.includes('Clinical Administrator')) {
    throw new Error('Clinical Administrator system role was not provisioned!')
  }
  if (!roleNames.includes('Physiotherapist')) {
    throw new Error('Physiotherapist role was not provisioned!')
  }
  if (!roleNames.includes('Physiotherapy Assistant')) {
    throw new Error('Physiotherapy Assistant role was not provisioned!')
  }
  if (!roleNames.includes('Billing Officer')) {
    throw new Error('Billing Officer role was not provisioned!')
  }
  if (!roleNames.includes('Front Desk')) {
    throw new Error('Front Desk role was not provisioned!')
  }
  console.log('[PASS] All category role templates successfully provisioned for the approved tenant!')

  // Check Clinical Administrator permissions count
  const adminRole = provisionedRoles.find((r) => r.name === 'Clinical Administrator')
  console.log(`[VERIFY] Clinical Administrator role has ${adminRole.rolePerms.length} permissions.`)
  if (adminRole.rolePerms.length < 40) {
    throw new Error(`Expected Clinical Administrator to have at least 40 permissions (10 modules x 4+ actions), got ${adminRole.rolePerms.length}`)
  }

  // 7. Verify RbacModuleService.getPermissionsByRole returns EXACTLY the 10 modules
  const resolvedPermissions = await RbacModuleService.getPermissionsByRole(adminRole.id, {
    tenantId: tenant.id,
    canViewOnly: true,
  })

  console.log(`[VERIFY] RbacModuleService returned ${resolvedPermissions.length} permitted modules for admin:`)
  for (const p of resolvedPermissions) {
    console.log(`  - ${p.module_name} (${p.module_key}): route="${p.module_route}", order=${p.display_order}`)
  }

  if (resolvedPermissions.length !== 10) {
    throw new Error(`Expected exactly 10 permitted modules in sidebar, got ${resolvedPermissions.length}`)
  }

  const resolvedKeys = resolvedPermissions.map((p) => p.module_key)
  for (const item of expected10Modules) {
    if (!resolvedKeys.includes(item.key)) {
      throw new Error(`Expected permitted module key '${item.key}' missing from resolved sidebar modules!`)
    }
  }

  for (const dKey of dentalModules) {
    if (resolvedKeys.includes(dKey)) {
      throw new Error(`Dental module '${dKey}' was unexpectedly found in resolved sidebar modules!`)
    }
  }
  console.log('[PASS] RbacModuleService returned exactly the 10 Physiotherapy modules and 0 Dental modules!')

  // 8. Verify RbacService module isolation check
  const isTrackerEnabled = await RbacService.isModuleEnabledForTenant(tenant.id, 'exercise_program_tracker')
  console.log(`[VERIFY] isModuleEnabledForTenant('exercise_program_tracker'): ${isTrackerEnabled}`)
  if (!isTrackerEnabled) {
    throw new Error("Expected 'exercise_program_tracker' to be enabled for Physiotherapy clinic!")
  }

  const isDentalChartEnabled = await RbacService.isModuleEnabledForTenant(tenant.id, 'dental_chart')
  console.log(`[VERIFY] isModuleEnabledForTenant('dental_chart'): ${isDentalChartEnabled}`)
  if (isDentalChartEnabled) {
    throw new Error("Expected 'dental_chart' (Dental Care module) to NOT be enabled for Physiotherapy clinic!")
  }
  console.log('[PASS] Module isolation verified: Dental Care module is denied, Physiotherapy module is permitted.')

  // 9. Verify login as approved tenant admin
  console.log(`\nTesting login as approved tenant admin: ${testEmail}...`)
  const loginSession = await AuthService.login(testEmail, testPassword)
  console.log('[PASS] Login successful! User ID:', loginSession.user.id, 'Role:', loginSession.user.role)
  console.log('User effective permissions count:', loginSession.user.permissions?.length)

  const accessToken = loginSession.tokens?.accessToken || loginSession.accessToken
  if (!accessToken) {
    throw new Error('Access token was not returned on login!')
  }

  // 10. Clean up test tenant
  console.log('\nCleaning up test tenant data...')
  await prisma.tenant.delete({ where: { id: tenant.id } })
  console.log('[PASS] Test tenant cleaned up successfully.')

  console.log('\n=== ALL PHYSIOTHERAPY VERIFICATION TESTS PASSED SUCCESSFULLY! ===\n')
}

runTest()
  .catch((e) => {
    console.error('\n❌ TEST FAILED:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
