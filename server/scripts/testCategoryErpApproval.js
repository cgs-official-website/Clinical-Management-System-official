import { prisma } from '../src/config/prisma.js'
import { SuperadminService } from '../src/services/superadmin.service.js'
import { RbacModuleService } from '../src/services/rbacModule.service.js'
import { RbacService } from '../src/services/rbac.service.js'

async function runTest() {
  console.log('=== STARTING CATEGORY-DRIVEN ERP APPROVAL TEST ===')

  // 1. Fetch Dental Care category
  const dentalCategory = await prisma.clinicCategory.findUnique({
    where: { name: 'Dental Care' },
    include: {
      categoryModules: {
        include: { module: true },
        orderBy: { displayOrder: 'asc' },
      },
    },
  })

  if (!dentalCategory) {
    throw new Error('Dental Care category not found in DB!')
  }
  console.log(`[PASS] Found Dental Care category (ID: ${dentalCategory.id}) with ${dentalCategory.categoryModules.length} category modules.`)
  if (dentalCategory.categoryModules.length !== 13) {
    throw new Error(`Expected exactly 13 category modules, but found ${dentalCategory.categoryModules.length}`)
  }

  // 2. Create a test tenant registered under "Dental Care" in PENDING status
  const testSubdomain = `test-dental-${Date.now()}`
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Smile Dental Specialist Hospital',
      subdomain: testSubdomain,
      status: 'PENDING',
      clinicCategoryId: dentalCategory.id,
      users: {
        create: {
          email: `${testSubdomain}@dentaltest.com`,
          fullName: 'Dr. Rahul Sharma DDS',
          passwordHash: '$2b$10$abcdefghijklmnopqrstuv',
          userType: 'ADMIN',
          status: 'INVITED',
        },
      },
    },
    include: { users: true },
  })

  console.log(`[PASS] Created test tenant (ID: ${tenant.id}, subdomain: ${testSubdomain}) with status: ${tenant.status}`)

  // 3. Execute Superadmin Approval Transaction
  console.log('Executing Superadmin approval transaction...')
  const approvalResult = await SuperadminService.updateTenantStatus(tenant.id, 'ACTIVE')
  console.log(`[PASS] Approval completed. Tenant status: ${approvalResult.status}`)

  // 4. Verify TenantModule records in PostgreSQL
  const tenantModules = await prisma.tenantModule.findMany({
    where: { tenantId: tenant.id },
    include: { module: true },
    orderBy: { module: { key: 'asc' } },
  })

  console.log(`[VERIFY] Total TenantModule rows for tenant: ${tenantModules.length}`)
  const enabledModules = tenantModules.filter((tm) => tm.isEnabled)
  console.log(`[VERIFY] Enabled TenantModules count: ${enabledModules.length}`)

  if (enabledModules.length !== 13) {
    throw new Error(`Expected exactly 13 enabled TenantModules, but found ${enabledModules.length}`)
  }

  const expectedKeys = [
    'patients',
    'appointments',
    'dental_chart',
    'treatment_plans',
    'xray_records',
    'orthodontics',
    'implant_registry',
    'prescriptions',
    'billing',
    'inventory',
    'lab_orders',
    'reports',
    'staff',
  ]

  const enabledKeys = enabledModules.map((tm) => tm.module.key)
  console.log('Enabled module keys in DB:', enabledKeys)

  for (const key of expectedKeys) {
    if (!enabledKeys.includes(key)) {
      throw new Error(`Expected module key '${key}' was not found in enabled TenantModules!`)
    }
  }
  console.log('[PASS] All 13 Dental Care modules are enabled in TenantModule!')

  // 5. Verify Clinical Administrator role & permissions
  const adminRole = await prisma.role.findFirst({
    where: { tenantId: tenant.id, name: 'Clinical Administrator' },
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

  if (!adminRole) {
    throw new Error('Clinical Administrator role was not provisioned!')
  }
  console.log(`[PASS] Clinical Administrator role created with ${adminRole.rolePerms.length} permissions.`)

  // 6. Verify RbacModuleService.getPermissionsByRole filters to strictly enabled modules
  const resolvedPermissions = await RbacModuleService.getPermissionsByRole(adminRole.id, {
    tenantId: tenant.id,
    canViewOnly: true,
  })

  console.log(`[VERIFY] RbacModuleService returned ${resolvedPermissions.length} permitted modules.`)
  const permittedKeys = resolvedPermissions.map((p) => p.module_key || p.module_id)
  console.log('Permitted modules returned to frontend:', resolvedPermissions.map(p => `${p.module_name} (${p.module_route})`))

  if (resolvedPermissions.length !== 13) {
    throw new Error(`Expected exactly 13 permitted modules in sidebar/dashboard, but got ${resolvedPermissions.length}`)
  }
  console.log('[PASS] RbacModuleService returned exactly the 13 Dental Care modules!')

  // 7. Verify module isolation checks (RbacService.isModuleEnabledForTenant)
  const isDentalChartEnabled = await RbacService.isModuleEnabledForTenant(tenant.id, 'dental_chart')
  console.log(`[VERIFY] isModuleEnabledForTenant('dental_chart'): ${isDentalChartEnabled}`)
  if (!isDentalChartEnabled) {
    throw new Error("Expected 'dental_chart' to be enabled for Dental Care clinic!")
  }

  const isEcgEnabled = await RbacService.isModuleEnabledForTenant(tenant.id, 'ecg_records')
  console.log(`[VERIFY] isModuleEnabledForTenant('ecg_records'): ${isEcgEnabled}`)
  if (isEcgEnabled) {
    throw new Error("Expected 'ecg_records' (Cardiology module) to NOT be enabled for Dental Care clinic!")
  }
  console.log('[PASS] Module isolation verified: Cardiology module is denied (403), Dental Care module is allowed.')

  // 8. Clean up test tenant
  await prisma.tenant.delete({ where: { id: tenant.id } })
  console.log(`[PASS] Test tenant cleaned up successfully.`)

  console.log('=== ALL TESTS PASSED SUCCESSFULLY! ===')
}

runTest()
  .catch((e) => {
    console.error('[FAIL] Test failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
