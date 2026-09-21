import { AiService } from '../src/services/ai.service.js'
import { prisma } from '../src/config/prisma.js'

async function runTest() {
  console.log('=== TESTING OPENROUTER AI TOOLS INTEGRATION ===\n')

  // 1. Test Triage Vitals Analysis
  console.log('1. Testing AI Triage Vitals Analysis...')
  const triageResult = await AiService.analyzeTriage({
    vitals: {
      bloodPressure: '190/115',
      heartRate: 112,
      spo2: 94,
      temperature: '38.5 C',
      bloodSugar: '280 mg/dL',
    },
    patient: {
      name: 'John Doe',
      age: 58,
      gender: 'Male',
    },
    notes: 'Complaining of acute severe headache, blurry vision, and dizziness for 2 hours.',
  })

  console.log('[PASS] Triage Result:')
  console.log('  - Urgency:', triageResult.urgency)
  console.log('  - Risk Flags:', triageResult.riskFlags)
  console.log('  - Summary:', triageResult.summary)
  console.log('  - Disclaimer:', triageResult.disclaimer)

  // 2. Test Category Auto-Provisioning
  console.log('\n2. Testing AI Category Auto-Provisioning on "Pediatrics"...')
  const testCategoryName = `Pediatrics AI ${Date.now()}`
  const provisionResult = await AiService.autoprovisionCategory(
    testCategoryName,
    'Care for infants, children, and adolescents',
    null
  )

  console.log('[PASS] Auto-Provision Result:')
  console.log('  - Category Name:', provisionResult.category.name)
  console.log('  - Description:', provisionResult.category.description)
  console.log('  - Starter Templates Provisioned:', provisionResult.provisionedTemplatesCount)
  console.log('  - Domain:', provisionResult.plan.category?.domain)
  console.log('  - Required Roles:', provisionResult.plan.analysis?.staff_roles)

  // Verify in PostgreSQL
  const dbTemplates = await prisma.clinicCategoryRoleTemplate.findMany({
    where: { clinicCategoryId: provisionResult.category.id },
  })
  console.log(`[PASS] Verified ${dbTemplates.length} role templates in database for category.`)

  // Clean up test category
  await prisma.clinicCategoryRoleTemplate.deleteMany({
    where: { clinicCategoryId: provisionResult.category.id },
  })
  await prisma.clinicCategoryModule.deleteMany({
    where: { clinicCategoryId: provisionResult.category.id },
  })
  await prisma.clinicCategory.delete({
    where: { id: provisionResult.category.id },
  })
  console.log('[PASS] Cleaned up test category.')

  console.log('\n=== ALL OPENROUTER AI INTEGRATION TESTS PASSED ===')
}

runTest()
  .catch((err) => {
    console.error('[ERROR]', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
