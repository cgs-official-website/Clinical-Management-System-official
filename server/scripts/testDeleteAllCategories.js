import { prisma } from '../src/config/prisma.js'
import { SuperadminService } from '../src/services/superadmin.service.js'

async function runTest() {
  console.log('=== TEST: DELETE ALL CATEGORY DATA ===\n')

  // 1. Create two test categories
  const cat1 = await prisma.clinicCategory.create({
    data: { name: `Batch Cat 1 ${Date.now()}` },
  })
  const cat2 = await prisma.clinicCategory.create({
    data: { name: `Batch Cat 2 ${Date.now()}` },
  })
  console.log(`[PASS] Created categories: ${cat1.id}, ${cat2.id}`)

  // 2. Execute deleteAllClinicCategories
  const result = await SuperadminService.deleteAllClinicCategories(null)
  console.log('[PASS] deleteAllClinicCategories returned:', result)

  const remaining = await prisma.clinicCategory.count()
  console.log(`[PASS] Remaining categories in DB: ${remaining}`)
  if (remaining !== 0) {
    throw new Error(`Expected 0 categories, found ${remaining}`)
  }

  // Restore seeded categories if needed so test environment has categories
  const defaultCategories = [
    { name: 'General Practice', description: 'Primary outpatient medical consultations' },
    { name: 'Dental Care', description: 'Dentistry, orthodontics, oral hygiene' },
    { name: 'Cardiology', description: 'Heart and cardiovascular care' },
  ]
  for (const dc of defaultCategories) {
    await prisma.clinicCategory.create({
      data: { name: dc.name, description: dc.description, isActive: true },
    })
  }
  console.log('[PASS] Restored baseline categories for continued normal operation.')
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
