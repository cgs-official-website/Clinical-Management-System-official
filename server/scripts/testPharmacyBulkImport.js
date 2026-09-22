import * as XLSX from 'xlsx'
import { prisma } from '../src/config/prisma.js'
import { PharmacyService, TEMPLATE_COLUMNS } from '../src/services/pharmacy.service.js'

async function runTest() {
  console.log('🧪 Starting Pharmacy Bulk Import Verification Test...')

  // 1. Resolve tenant
  const tenant = await prisma.tenant.findFirst()
  if (!tenant) {
    console.error('❌ No tenant found in database')
    process.exit(1)
  }
  const tenantId = tenant.id
  console.log(`🏢 Testing with Tenant: "${tenant.name}" (${tenantId})`)

  // 2. Generate 10-row dataset according to user specification:
  // 7 valid rows, 2 expired dates, 1 invalid Schedule Classification
  const testRows = [
    [
      'Paracetamol 650mg Test', 'Dolo Test', 'Analgesic', 'Tablet', '650mg', 'Micro Labs',
      'BCH-TEST-001', '01/01/2026', '31/12/2028', 'OTC', '30049060', 'Strip', '15 Tab',
      20.00, 30.00, 12, 100, 20, 'Distributor A', 'Normal', 'No', 'LIC-001', 35.00
    ],
    [
      'Augmentin 625 Duo Test', 'Augmentin Test', 'Antibiotics', 'Tablet', '625mg', 'GSK',
      'BCH-TEST-002', '01/02/2026', '30/06/2027', 'H', '30041010', 'Strip', '10 Tab',
      150.00, 200.00, 12, 50, 10, 'Distributor B', 'Cool & Dry', 'Yes', 'LIC-002', 210.00
    ],
    [
      'Restyl 0.5mg Test', 'Restyl Test', 'Sedatives', 'Tablet', '0.5mg', 'Cipla',
      'BCH-TEST-003', '01/03/2026', '28/02/2028', 'H1', '30049099', 'Strip', '15 Tab',
      40.00, 55.00, 12, 40, 15, 'Distributor C', 'Below 25C', 'Yes', 'LIC-003', 60.00
    ],
    [
      'Cetirizine 10mg Test', 'Cetzine Test', 'Antiallergic', 'Tablet', '10mg', 'Dr Reddys',
      'BCH-TEST-004', '15/01/2026', '30/11/2027', 'OTC', '30049060', 'Strip', '10 Tab',
      18.00, 28.00, 12, 200, 30, 'Distributor A', 'Normal', 'No', 'LIC-004', 30.00
    ],
    [
      'Metformin 500mg Test', 'Glycomet Test', 'Antidiabetic', 'Tablet', '500mg', 'USV Ltd',
      'BCH-TEST-005', '10/02/2026', '31/01/2028', 'G', '30049030', 'Strip', '20 Tab',
      25.00, 38.00, 12, 150, 25, 'Distributor D', 'Normal', 'Yes', 'LIC-005', 40.00
    ],
    [
      'Pantoprazole 40mg Test', 'Pan 40 Test', 'Antacid', 'Tablet', '40mg', 'Alkem',
      'BCH-TEST-006', '01/02/2026', '31/08/2027', 'H', '30049099', 'Strip', '15 Tab',
      60.00, 95.00, 12, 80, 20, 'Distributor B', 'Cool & Dry', 'Yes', 'LIC-006', 100.00
    ],
    [
      'Ciprofloxacin 500mg Test', 'Ciplox Test', 'Antibiotics', 'Tablet', '500mg', 'Cipla',
      'BCH-TEST-007', '01/01/2026', '31/12/2027', 'H', '30042010', 'Strip', '10 Tab',
      35.00, 50.00, 12, 90, 15, 'Distributor C', 'Normal', 'Yes', 'LIC-007', 55.00
    ],
    // ERROR ROW 1: Expired date (2023)
    [
      'Expired Drug Alpha', 'Old Med 1', 'Analgesic', 'Tablet', '500mg', 'Pharma Old',
      'BCH-EXP-001', '01/01/2021', '01/01/2023', 'OTC', '30049060', 'Strip', '10 Tab',
      10.00, 15.00, 12, 30, 5, 'Old Dist', 'Normal', 'No', 'LIC-EXP1', 20.00
    ],
    // ERROR ROW 2: Expired date (May 2024)
    [
      'Expired Drug Beta', 'Old Med 2', 'Antibiotics', 'Capsule', '250mg', 'Pharma Old',
      'BCH-EXP-002', '10/01/2022', '15/05/2024', 'H', '30041010', 'Strip', '10 Tab',
      50.00, 75.00, 12, 20, 5, 'Old Dist', 'Normal', 'Yes', 'LIC-EXP2', 80.00
    ],
    // ERROR ROW 3: Invalid Schedule Classification ("SCHEDULE-INVALID")
    [
      'Invalid Schedule Drug', 'Unknown Med', 'General', 'Syrup', '100ml', 'Generic Ltd',
      'BCH-INV-001', '01/01/2026', '31/12/2027', 'SCHEDULE-INVALID', '30049000', 'Bottle', '1 Bottle',
      30.00, 45.00, 12, 50, 10, 'Generic Dist', 'Normal', 'No', 'LIC-INV1', 50.00
    ]
  ]

  // Create Excel workbook buffer
  const wb = XLSX.utils.book_new()
  const wsData = [
    ['PHARMACY IMPORT TEST SPREADSHEET'],
    [],
    TEMPLATE_COLUMNS,
    ...testRows
  ]
  const ws = XLSX.utils.aoa_to_sheet(wsData)
  XLSX.utils.book_append_sheet(wb, ws, 'TestSheet')
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  console.log(`📦 Generated test Excel buffer: ${buffer.length} bytes`)

  // 3. Test parseAndValidate (Dry-run / Preview)
  console.log('\n--- Step 1: Parsing and Validating ---')
  const preview = await PharmacyService.parseAndValidate(buffer, tenantId)
  console.log('Preview Summary:', preview.summary)

  // Assertions
  if (preview.summary.totalRows !== 10) {
    throw new Error(`Expected 10 total rows, got ${preview.summary.totalRows}`)
  }
  if (preview.summary.validRowsCount !== 7) {
    throw new Error(`Expected 7 valid rows, got ${preview.summary.validRowsCount}`)
  }
  if (preview.summary.errorRowsCount !== 3) {
    throw new Error(`Expected 3 error rows, got ${preview.summary.errorRowsCount}`)
  }
  console.log('✅ Validation count check passed: 7 Valid, 3 Errors!')

  // Check specific error messages
  const failedRows = preview.rows.filter(r => !r.isValid)
  const expiredRow1 = failedRows.find(r => r.data.batchNumber === 'BCH-EXP-001')
  const expiredRow2 = failedRows.find(r => r.data.batchNumber === 'BCH-EXP-002')
  const invalidSchedRow = failedRows.find(r => r.data.batchNumber === 'BCH-INV-001')

  if (!expiredRow1 || !expiredRow1.errors.some(e => e.includes('Cannot import expired stock (Section 27, D&C Act compliance)'))) {
    throw new Error('Expected Section 27 D&C Act compliance error on Expired Drug Alpha')
  }
  console.log('✅ Expired Drug 1 correctly flagged with Section 27 D&C Act compliance message')

  if (!expiredRow2 || !expiredRow2.errors.some(e => e.includes('Cannot import expired stock (Section 27, D&C Act compliance)'))) {
    throw new Error('Expected Section 27 D&C Act compliance error on Expired Drug Beta')
  }
  console.log('✅ Expired Drug 2 correctly flagged with Section 27 D&C Act compliance message')

  if (!invalidSchedRow || !invalidSchedRow.errors.some(e => e.includes('Schedule Classification must be one of'))) {
    throw new Error('Expected invalid Schedule Classification error on Invalid Schedule Drug')
  }
  console.log('✅ Invalid Schedule Drug correctly flagged')

  // Check Schedule H1 prescription required auto-assignment and warning
  const h1Row = preview.validRows.find(r => r.data.schedule === 'H1')
  if (!h1Row || !h1Row.data.prescriptionRequired || !h1Row.warnings.some(w => w.includes('Schedule H1 register'))) {
    throw new Error('Schedule H1 validation failed to enforce prescription requirement or warning note')
  }
  console.log('✅ Schedule H1 drug successfully enforced prescription requirement and register warning')

  // 4. Test commitBulkImport (Confirming import of ONLY the 7 valid rows)
  console.log('\n--- Step 2: Committing Valid Rows ---')
  const commitResult = await PharmacyService.commitBulkImport({
    validRows: preview.validRows,
    tenantId,
    actorId: 'test-admin-user'
  })
  console.log('Commit Result:', commitResult)

  if (commitResult.importedCount !== 7) {
    throw new Error(`Expected 7 items imported, got ${commitResult.importedCount}`)
  }
  console.log('✅ Successfully committed 7 valid items to database!')

  // Check stock movement records in DB
  const movements = await prisma.stockMovement.findMany({
    where: { importBatchId: commitResult.importBatchId }
  })
  console.log(`✅ Verified ${movements.length} StockMovement records logged with import batch ${commitResult.importBatchId}`)
  if (movements.length !== 7) {
    throw new Error(`Expected 7 StockMovement records, found ${movements.length}`)
  }

  // 5. Test Duplicate check: Re-importing same batch should update existing stock
  console.log('\n--- Step 3: Duplicate Import Check ---')
  const previewDuplicate = await PharmacyService.parseAndValidate(buffer, tenantId, { createNewBatch: false })
  const duplicateValidRow = previewDuplicate.validRows.find(r => r.data.batchNumber === 'BCH-TEST-001')
  if (!duplicateValidRow || !duplicateValidRow.isDuplicate) {
    throw new Error('Expected BCH-TEST-001 to be recognized as duplicate existing record')
  }
  console.log('✅ Duplicate detection passed: recognized existing batch and will update stock')

  // Commit update
  const commitUpdate = await PharmacyService.commitBulkImport({
    validRows: [duplicateValidRow],
    tenantId,
    actorId: 'test-admin-user',
    createNewBatch: false
  })
  if (commitUpdate.updatedCount !== 1) {
    throw new Error('Expected 1 existing record updated')
  }
  console.log('✅ Duplicate update committed: existing record updated (+100 stock)')

  // 6. Test Error Report generation
  console.log('\n--- Step 4: Error Report Generation ---')
  const errorReportBuffer = PharmacyService.generateErrorReportBuffer(failedRows)
  if (!errorReportBuffer || errorReportBuffer.length === 0) {
    throw new Error('Failed to generate error report buffer')
  }
  console.log(`✅ Error report generated successfully (${errorReportBuffer.length} bytes)`)

  // 7. Test Template buffer generation
  console.log('\n--- Step 5: Template Generation ---')
  const templateBuffer = PharmacyService.generateTemplateBuffer()
  if (!templateBuffer || templateBuffer.length === 0) {
    throw new Error('Failed to generate template buffer')
  }
  console.log(`✅ Template generated successfully (${templateBuffer.length} bytes)`)

  // Cleanup test records
  console.log('\n--- Step 6: Cleaning up test data ---')
  const testBatchNumbers = testRows.map(r => r[6])
  await prisma.stockMovement.deleteMany({
    where: { batchNumber: { in: testBatchNumbers } }
  })
  await prisma.inventoryItem.deleteMany({
    where: { batchNumber: { in: testBatchNumbers } }
  })
  console.log('🧹 Cleaned up test items and stock movements.')

  console.log('\n🎉 ALL PHARMACY BULK IMPORT TESTS PASSED SUCCESSFULLY!')
}

runTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test failed with error:', err)
    process.exit(1)
  })
