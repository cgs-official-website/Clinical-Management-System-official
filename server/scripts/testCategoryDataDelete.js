import { prisma } from '../src/config/prisma.js'
import { SuperadminService } from '../src/services/superadmin.service.js'

async function runTest() {
  console.log('=== TEST: CATEGORY DATA DELETE FUNCTIONALITY ===\n')

  // 1. Create a dummy category with role templates and category module mappings
  const testCatName = `Test Specialty Category ${Date.now()}`
  console.log(`1. Creating test category: "${testCatName}"...`)
  const category = await prisma.clinicCategory.create({
    data: {
      name: testCatName,
      description: 'Temporary category for data delete verification',
      isActive: true,
      roleTemplates: {
        create: [
          { roleName: 'Specialist Doctor', module: 'patients', action: 'view' },
          { roleName: 'Specialist Doctor', module: 'patients', action: 'create' },
          { roleName: 'Nurse Assistant', module: 'appointments', action: 'view' },
        ],
      },
    },
  })
  console.log(`[PASS] Created category with ID: ${category.id}`)

  // Get any existing module from DB to link
  const anyModule = await prisma.module.findFirst()
  if (anyModule) {
    await prisma.clinicCategoryModule.create({
      data: {
        clinicCategoryId: category.id,
        moduleId: anyModule.id,
        displayOrder: 1,
      },
    })
    console.log(`[PASS] Linked module ${anyModule.key} in ClinicCategoryModule`)
  }

  // 2. Create a test tenant linked to this category
  const testSubdomain = `test-del-cat-${Date.now()}`
  const tenant = await prisma.tenant.create({
    data: {
      name: `Clinic for ${testCatName}`,
      subdomain: testSubdomain,
      status: 'ACTIVE',
      clinicCategoryId: category.id,
    },
  })
  console.log(`[PASS] Created test tenant (ID: ${tenant.id}) linked to category ID: ${category.id}`)

  // Verify counts prior to deletion
  const preTemplates = await prisma.clinicCategoryRoleTemplate.count({
    where: { clinicCategoryId: category.id },
  })
  const preModules = await prisma.clinicCategoryModule.count({
    where: { clinicCategoryId: category.id },
  })
  console.log(`[INFO] Pre-delete counts: ${preTemplates} role templates, ${preModules} category modules, 1 tenant attached.`)

  // 3. Execute SuperadminService.deleteClinicCategory (Deleting entire category data)
  console.log('\n2. Executing SuperadminService.deleteClinicCategory()...')
  const result = await SuperadminService.deleteClinicCategory(category.id, 'test-superadmin-actor')
  console.log('[PASS] Delete returned:', result)

  // 4. Verify cascade & detachment
  const deletedCat = await prisma.clinicCategory.findUnique({ where: { id: category.id } })
  if (deletedCat) {
    throw new Error('FAILED: Category still exists in database!')
  }
  console.log('[PASS] Category record deleted from database.')

  const postTemplates = await prisma.clinicCategoryRoleTemplate.count({
    where: { clinicCategoryId: category.id },
  })
  if (postTemplates !== 0) {
    throw new Error(`FAILED: Expected 0 role templates, found ${postTemplates}`)
  }
  console.log('[PASS] All role template blueprints for category deleted.')

  const postModules = await prisma.clinicCategoryModule.count({
    where: { clinicCategoryId: category.id },
  })
  if (postModules !== 0) {
    throw new Error(`FAILED: Expected 0 category modules, found ${postModules}`)
  }
  console.log('[PASS] All category module blueprints for category deleted.')

  const updatedTenant = await prisma.tenant.findUnique({ where: { id: tenant.id } })
  if (!updatedTenant || updatedTenant.clinicCategoryId !== null) {
    throw new Error(`FAILED: Tenant was not detached! clinicCategoryId is ${updatedTenant?.clinicCategoryId}`)
  }
  console.log('[PASS] Attached clinic tenant safely detached (clinicCategoryId is null).')

  // Clean up test tenant
  await prisma.tenant.delete({ where: { id: tenant.id } })
  console.log('[PASS] Cleaned up test tenant.')

  console.log('\n=== ALL TESTS PASSED SUCCESSFULLY ===')
}

runTest()
  .catch((err) => {
    console.error('[ERROR]', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
