import * as XLSX from 'xlsx'
import { prisma } from '../config/prisma.js'
import { AuditService } from './audit.service.js'
import { NotFoundError, BadRequestError } from '../utils/errors.js'

// Standard India-compliant column definitions
export const TEMPLATE_COLUMNS = [
  'Drug Name*',
  'Brand Name',
  'Category',
  'Dosage Form',
  'Strength',
  'Manufacturer',
  'Batch Number*',
  'Manufacturing Date*',
  'Expiry Date*',
  'Schedule Classification*',
  'HSN Code',
  'Unit of Measure',
  'Pack Size',
  'Purchase Price*',
  'Selling Price (MRP)*',
  'GST %',
  'Opening Stock Qty*',
  'Reorder Level',
  'Supplier Name',
  'Storage Condition',
  'Prescription Required (Yes/No)',
  'Manufacturer License Number',
  'DPCO Ceiling Price'
]

// 3 Realistic Indian Pharmacy Sample Rows
export const SAMPLE_ROWS = [
  [
    'Paracetamol 650mg Tablets',
    'Dolo 650',
    'Analgesic / Antipyretic',
    'Tablet',
    '650 mg',
    'Micro Labs Ltd',
    'ML-2026-D1',
    '15/01/2026',
    '31/12/2028',
    'OTC',
    '30049060',
    'Strip',
    '15 Tablets',
    24.50,
    32.00,
    12,
    500,
    100,
    'MedSupply India Distributors',
    'Store below 30°C in dry place',
    'No',
    'KD-4512-A',
    34.00
  ],
  [
    'Amoxicillin and Potassium Clavulanate 625mg',
    'Augmentin 625 Duo',
    'Antibiotics',
    'Tablet',
    '625 mg',
    'GlaxoSmithKline Pharmaceuticals',
    'GSK-8891-B',
    '10/02/2026',
    '30/06/2027',
    'H',
    '30041010',
    'Strip',
    '10 Tablets',
    165.00,
    215.00,
    12,
    200,
    50,
    'Apex Pharma Logistics',
    'Store in cool, dry place protect from moisture',
    'Yes',
    'MH-1029-B',
    220.00
  ],
  [
    'Alprazolam 0.5mg Tablets',
    'Restyl 0.5',
    'Sedative / Anxiolytic',
    'Tablet',
    '0.5 mg',
    'Cipla Ltd',
    'CIP-X-442',
    '01/03/2026',
    '28/02/2028',
    'H1',
    '30049099',
    'Strip',
    '15 Tablets',
    42.00,
    58.00,
    12,
    150,
    30,
    'Metro Lifecare Agency',
    'Store below 25°C in original pack',
    'Yes',
    'GA-2041-C',
    60.00
  ]
]

export class PharmacyService {
  /**
   * Helper to normalize tenant ID from clinic-xxx or fallback
   */
  static async resolveTenantId(tenantId) {
    let targetTenantId = tenantId
    if (!targetTenantId || targetTenantId.startsWith('clinic-')) {
      const firstTenant = await prisma.tenant.findFirst({ select: { id: true } })
      if (firstTenant) targetTenantId = firstTenant.id
    }
    return targetTenantId
  }

  /**
   * Generates a pre-formatted Excel template buffer with instructions and sample rows
   */
  static generateTemplateBuffer() {
    const wb = XLSX.utils.book_new()

    // Instruction Banner
    const instructionData = [
      ['PHARMACY INVENTORY BULK IMPORT TEMPLATE (INDIA D&C ACT COMPLIANT)'],
      ['INSTRUCTIONS & GUIDELINES:'],
      ['1. Columns marked with an asterisk (*) are strictly MANDATORY.'],
      ['2. Date Format: Please use DD/MM/YYYY or YYYY-MM-DD for Manufacturing Date and Expiry Date.'],
      ['3. Expiry Date MUST be in the future (Section 27, Drugs & Cosmetics Act). Expired stock will be rejected.'],
      ['4. Schedule Classification MUST be one of: OTC, H, H1, X, G.'],
      ['5. Schedule H1 and X drugs automatically enforce Prescription Required = Yes and require entry in Schedule registers.'],
      ['6. Purchase Price, Selling Price (MRP), Opening Stock Qty, and GST % must be valid non-negative numbers.'],
      ['7. Duplicate Check: If Drug Name + Batch Number matches an existing record, existing stock will be updated by default.'],
      ['8. Maximum 5,000 rows per import file. Supported formats: .xlsx, .csv (Max 5MB).'],
      [],
      TEMPLATE_COLUMNS,
      ...SAMPLE_ROWS
    ]

    const ws = XLSX.utils.aoa_to_sheet(instructionData)

    // Set reasonable column widths
    const colWidths = [
      { wch: 32 }, // Drug Name*
      { wch: 22 }, // Brand Name
      { wch: 24 }, // Category
      { wch: 14 }, // Dosage Form
      { wch: 14 }, // Strength
      { wch: 28 }, // Manufacturer
      { wch: 16 }, // Batch Number*
      { wch: 18 }, // Manufacturing Date*
      { wch: 16 }, // Expiry Date*
      { wch: 24 }, // Schedule Classification*
      { wch: 14 }, // HSN Code
      { wch: 16 }, // Unit of Measure
      { wch: 14 }, // Pack Size
      { wch: 16 }, // Purchase Price*
      { wch: 20 }, // Selling Price (MRP)*
      { wch: 10 }, // GST %
      { wch: 18 }, // Opening Stock Qty*
      { wch: 14 }, // Reorder Level
      { wch: 26 }, // Supplier Name
      { wch: 28 }, // Storage Condition
      { wch: 28 }, // Prescription Required
      { wch: 24 }, // Manufacturer License Number
      { wch: 18 }  // DPCO Ceiling Price
    ]
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, 'Inventory Template')

    // Write to binary buffer
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  }

  /**
   * Parse date from various formats (string DD/MM/YYYY, YYYY-MM-DD, Excel serial number, or Date)
   */
  static parseDate(val) {
    if (!val) return null
    if (val instanceof Date && !isNaN(val.getTime())) {
      return val
    }
    if (typeof val === 'number') {
      // Excel serial date code
      const parsed = XLSX.SSF.parse_date_code(val)
      if (parsed) {
        return new Date(parsed.y, parsed.m - 1, parsed.d)
      }
    }
    if (typeof val === 'string') {
      const trimmed = val.trim()
      if (!trimmed) return null

      // DD/MM/YYYY or DD-MM-YYYY
      const dmyMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
      if (dmyMatch) {
        const day = parseInt(dmyMatch[1], 10)
        const month = parseInt(dmyMatch[2], 10) - 1
        const year = parseInt(dmyMatch[3], 10)
        const d = new Date(year, month, day)
        if (!isNaN(d.getTime())) return d
      }

      // YYYY-MM-DD or YYYY/MM/DD
      const ymdMatch = trimmed.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/)
      if (ymdMatch) {
        const year = parseInt(ymdMatch[1], 10)
        const month = parseInt(ymdMatch[2], 10) - 1
        const day = parseInt(ymdMatch[3], 10)
        const d = new Date(year, month, day)
        if (!isNaN(d.getTime())) return d
      }

      // Fallback standard parse
      const standardDate = new Date(trimmed)
      if (!isNaN(standardDate.getTime())) return standardDate
    }
    return null
  }

  /**
   * Normalize and find column keys in parsed row object
   */
  static extractFieldValue(row, fieldNames) {
    for (const name of fieldNames) {
      if (row[name] !== undefined && row[name] !== null && String(row[name]).trim() !== '') {
        return row[name]
      }
      // Try lowercase without spaces and punctuation
      const cleanTarget = name.toLowerCase().replace(/[^a-z0-9]/g, '')
      for (const key of Object.keys(row)) {
        const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '')
        if (cleanKey === cleanTarget) {
          if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
            return row[key]
          }
        }
      }
    }
    return null
  }

  /**
   * Parse uploaded buffer (XLSX or CSV) and execute row-by-row validation against tenant database
   */
  static async parseAndValidate(buffer, tenantId, options = {}) {
    const targetTenantId = await this.resolveTenantId(tenantId)
    const createNewBatch = options.createNewBatch === true || options.createNewBatch === 'true'

    // Parse workbook
    let workbook
    try {
      workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
    } catch (err) {
      throw new BadRequestError('Failed to read spreadsheet. File must be a valid .xlsx or .csv document.')
    }

    const firstSheetName = workbook.SheetNames[0]
    if (!firstSheetName) {
      throw new BadRequestError('Spreadsheet contains no sheets.')
    }
    const worksheet = workbook.Sheets[firstSheetName]

    // Read sheet to raw rows
    const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })
    if (!rawRows || rawRows.length === 0) {
      throw new BadRequestError('Spreadsheet is empty.')
    }

    // Locate header row (search for 'Drug Name' or 'Drug Name*')
    let headerRowIndex = -1
    for (let i = 0; i < Math.min(rawRows.length, 25); i++) {
      const row = rawRows[i]
      if (Array.isArray(row)) {
        const hasDrugName = row.some(cell => 
          typeof cell === 'string' && cell.toLowerCase().includes('drug name')
        )
        if (hasDrugName) {
          headerRowIndex = i
          break
        }
      }
    }

    if (headerRowIndex === -1) {
      throw new BadRequestError(
        'Could not locate the header row. Please make sure the header row contains "Drug Name*" matching the template.'
      )
    }

    const headers = rawRows[headerRowIndex].map(h => String(h || '').trim())
    const dataRows = rawRows.slice(headerRowIndex + 1)

    if (dataRows.length === 0) {
      throw new BadRequestError('No medication rows found in the uploaded file.')
    }
    if (dataRows.length > 5000) {
      throw new BadRequestError('Maximum row limit exceeded (5,000 rows max per file).')
    }

    // Fetch existing inventory for duplicate checks in this tenant
    const existingItems = await prisma.inventoryItem.findMany({
      where: targetTenantId ? { tenantId: targetTenantId } : {},
      select: {
        id: true,
        itemCode: true,
        name: true,
        batchNumber: true,
        stockQuantity: true,
        unitCost: true,
        sellingPrice: true,
        expiryDate: true,
        schedule: true
      }
    })

    // Index existing items by name (lowercase trimmed) + batchNumber (lowercase trimmed)
    const existingMap = new Map()
    for (const item of existingItems) {
      if (item.name && item.batchNumber) {
        const key = `${item.name.trim().toLowerCase()}:::${item.batchNumber.trim().toLowerCase()}`
        existingMap.set(key, item)
      }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const parsedRows = []
    let validCount = 0
    let errorCount = 0
    let warningCount = 0

    // Validate row-by-row
    for (let idx = 0; idx < dataRows.length; idx++) {
      const rawRow = dataRows[idx]
      const rowNum = headerRowIndex + 1 + idx + 1

      // Skip completely empty rows
      if (!rawRow || !rawRow.some(cell => cell !== '' && cell !== null && cell !== undefined)) {
        continue
      }

      // Map row array to object using headers
      const rowObj = {}
      headers.forEach((h, i) => {
        if (h) rowObj[h] = rawRow[i]
      })

      const errors = []
      const warnings = []

      // 1. Drug Name*
      const drugName = this.extractFieldValue(rowObj, ['Drug Name*', 'Drug Name', 'Item Name', 'Name'])
      if (!drugName || String(drugName).trim().length < 2) {
        errors.push('Drug Name is required (minimum 2 characters).')
      }

      // 2. Batch Number*
      const batchNumber = this.extractFieldValue(rowObj, ['Batch Number*', 'Batch Number', 'Batch No', 'Batch'])
      if (!batchNumber || String(batchNumber).trim() === '') {
        errors.push('Batch Number is required.')
      }

      // 3. Manufacturing Date*
      const rawMfg = this.extractFieldValue(rowObj, ['Manufacturing Date*', 'Manufacturing Date', 'Mfg Date', 'Mfg'])
      const mfgDate = this.parseDate(rawMfg)
      if (!mfgDate) {
        errors.push('Manufacturing Date is required (format: DD/MM/YYYY).')
      }

      // 4. Expiry Date* (Compliance with Section 27, D&C Act)
      const rawExp = this.extractFieldValue(rowObj, ['Expiry Date*', 'Expiry Date', 'Exp Date', 'Expiry'])
      const expiryDate = this.parseDate(rawExp)
      if (!expiryDate) {
        errors.push('Expiry Date is required (format: DD/MM/YYYY).')
      } else {
        const expMidnight = new Date(expiryDate)
        expMidnight.setHours(23, 59, 59, 999)
        if (expMidnight < today) {
          errors.push('Cannot import expired stock (Section 27, D&C Act compliance).')
        } else if (mfgDate && expiryDate < mfgDate) {
          errors.push('Expiry Date cannot be earlier than Manufacturing Date.')
        }
      }

      // 5. Schedule Classification* (OTC, H, H1, X, G)
      const rawSchedule = this.extractFieldValue(rowObj, ['Schedule Classification*', 'Schedule Classification', 'Schedule'])
      const validSchedules = ['OTC', 'H', 'H1', 'X', 'G']
      let schedule = String(rawSchedule || '').trim().toUpperCase()
      // Normalize common entries like 'SCHEDULE H' -> 'H'
      if (schedule.startsWith('SCHEDULE ')) {
        schedule = schedule.replace('SCHEDULE ', '').trim()
      }
      if (!schedule || !validSchedules.includes(schedule)) {
        errors.push(`Schedule Classification must be one of: ${validSchedules.join(', ')}. Received: "${rawSchedule || ''}".`)
      }

      // 6. Prescription Required
      const rawPrescriptionReq = this.extractFieldValue(rowObj, [
        'Prescription Required (Yes/No)',
        'Prescription Required',
        'Rx Required',
        'Prescription'
      ])
      let prescriptionRequired = false
      if (rawPrescriptionReq) {
        const pStr = String(rawPrescriptionReq).trim().toLowerCase()
        prescriptionRequired = pStr === 'yes' || pStr === 'y' || pStr === 'true' || pStr === '1'
      }

      // Rule: Schedule H1 or X requires Prescription Required = true + notification
      if (schedule === 'H1' || schedule === 'X') {
        prescriptionRequired = true
        warnings.push(`Schedule ${schedule} medicine: Requires mandatory record in Schedule ${schedule} register on dispensing.`)
      }

      // 7. Purchase Price*
      const rawPurchasePrice = this.extractFieldValue(rowObj, ['Purchase Price*', 'Purchase Price', 'Unit Cost', 'Cost Price'])
      const purchasePrice = parseFloat(rawPurchasePrice)
      if (isNaN(purchasePrice) || purchasePrice < 0) {
        errors.push('Purchase Price must be a valid non-negative number.')
      }

      // 8. Selling Price (MRP)*
      const rawSellingPrice = this.extractFieldValue(rowObj, ['Selling Price (MRP)*', 'Selling Price', 'MRP', 'Selling Price MRP'])
      const sellingPrice = parseFloat(rawSellingPrice)
      if (isNaN(sellingPrice) || sellingPrice < 0) {
        errors.push('Selling Price (MRP) must be a valid non-negative number.')
      }

      // 9. Opening Stock Qty*
      const rawStockQty = this.extractFieldValue(rowObj, ['Opening Stock Qty*', 'Opening Stock Qty', 'Quantity', 'Stock Quantity'])
      const stockQty = parseInt(rawStockQty, 10)
      if (isNaN(stockQty) || stockQty < 0) {
        errors.push('Opening Stock Qty must be a valid non-negative integer.')
      }

      // Optional fields parsing
      const brandName = this.extractFieldValue(rowObj, ['Brand Name', 'Brand']) || null
      const category = this.extractFieldValue(rowObj, ['Category']) || 'General Supplies'
      const dosageForm = this.extractFieldValue(rowObj, ['Dosage Form', 'Form']) || null
      const strength = this.extractFieldValue(rowObj, ['Strength']) || null
      const manufacturer = this.extractFieldValue(rowObj, ['Manufacturer', 'Mfr']) || null
      const hsnCode = this.extractFieldValue(rowObj, ['HSN Code', 'HSN']) || null
      const unit = this.extractFieldValue(rowObj, ['Unit of Measure', 'Unit', 'UOM']) || 'Units'
      const packSize = this.extractFieldValue(rowObj, ['Pack Size', 'Packing']) || null

      // GST %
      const rawGst = this.extractFieldValue(rowObj, ['GST %', 'GST', 'Tax %'])
      let gstRate = 12
      if (rawGst !== null && rawGst !== undefined && rawGst !== '') {
        const parsedGst = parseFloat(rawGst)
        if (isNaN(parsedGst) || parsedGst < 0 || parsedGst > 100) {
          errors.push('GST % must be a number between 0 and 100.')
        } else {
          gstRate = parsedGst
        }
      }

      // Reorder Level
      const rawReorder = this.extractFieldValue(rowObj, ['Reorder Level', 'Min Threshold', 'Min Reorder Threshold'])
      let minReorderThreshold = 50
      if (rawReorder !== null && rawReorder !== undefined && rawReorder !== '') {
        const parsedReorder = parseInt(rawReorder, 10)
        if (isNaN(parsedReorder) || parsedReorder < 0) {
          errors.push('Reorder Level must be a non-negative integer.')
        } else {
          minReorderThreshold = parsedReorder
        }
      }

      const supplierName = this.extractFieldValue(rowObj, ['Supplier Name', 'Supplier']) || null
      const storageCondition = this.extractFieldValue(rowObj, ['Storage Condition', 'Storage']) || null
      const mfrLicenseNumber = this.extractFieldValue(rowObj, ['Manufacturer License Number', 'Mfg Lic No', 'Drug License']) || null

      // DPCO Ceiling Price check (optional column)
      const rawCeiling = this.extractFieldValue(rowObj, ['DPCO Ceiling Price', 'Ceiling Price', 'NLEM Ceiling Price'])
      let dpcoCeilingPrice = null
      if (rawCeiling !== null && rawCeiling !== undefined && rawCeiling !== '') {
        const parsedCeiling = parseFloat(rawCeiling)
        if (!isNaN(parsedCeiling) && parsedCeiling > 0) {
          dpcoCeilingPrice = parsedCeiling
          if (sellingPrice > dpcoCeilingPrice) {
            warnings.push(`Exceeds DPCO ceiling price (MRP: ₹${sellingPrice.toFixed(2)} vs Ceiling: ₹${dpcoCeilingPrice.toFixed(2)}).`)
          }
        }
      }

      // Duplicate Check against DB
      let isDuplicate = false
      let existingRecord = null
      if (drugName && batchNumber) {
        const matchKey = `${String(drugName).trim().toLowerCase()}:::${String(batchNumber).trim().toLowerCase()}`
        if (existingMap.has(matchKey)) {
          isDuplicate = true
          existingRecord = existingMap.get(matchKey)
          if (!createNewBatch) {
            warnings.push(
              `Existing batch found (${existingRecord.itemCode}). Stock will be updated (+${stockQty || 0} to existing ${existingRecord.stockQuantity}).`
            )
          } else {
            warnings.push(`Existing batch found. Will be created as a new distinct batch record.`)
          }
        }
      }

      const isValid = errors.length === 0
      if (isValid) {
        validCount++
      } else {
        errorCount++
      }
      if (warnings.length > 0) {
        warningCount++
      }

      parsedRows.push({
        rowNumber: rowNum,
        isValid,
        errors,
        warnings,
        isDuplicate,
        existingId: existingRecord?.id || null,
        existingItemCode: existingRecord?.itemCode || null,
        data: {
          name: String(drugName || '').trim(),
          brandName: brandName ? String(brandName).trim() : null,
          category,
          dosageForm: dosageForm ? String(dosageForm).trim() : null,
          strength: strength ? String(strength).trim() : null,
          manufacturer: manufacturer ? String(manufacturer).trim() : null,
          batchNumber: String(batchNumber || '').trim(),
          mfgDate: mfgDate ? mfgDate.toISOString() : null,
          expiryDate: expiryDate ? expiryDate.toISOString() : null,
          schedule,
          hsnCode: hsnCode ? String(hsnCode).trim() : null,
          unit,
          packSize: packSize ? String(packSize).trim() : null,
          unitCost: purchasePrice || 0,
          sellingPrice: sellingPrice || 0,
          gstRate,
          stockQuantity: stockQty || 0,
          minReorderThreshold,
          supplierName: supplierName ? String(supplierName).trim() : null,
          storageCondition: storageCondition ? String(storageCondition).trim() : null,
          prescriptionRequired,
          mfrLicenseNumber: mfrLicenseNumber ? String(mfrLicenseNumber).trim() : null,
          dpcoCeilingPrice
        }
      })
    }

    return {
      summary: {
        totalRows: parsedRows.length,
        validRowsCount: validCount,
        errorRowsCount: errorCount,
        warningRowsCount: warningCount
      },
      rows: parsedRows,
      validRows: parsedRows.filter(r => r.isValid)
    }
  }

  /**
   * Commit validated rows to the database in a single atomic transaction
   */
  static async commitBulkImport({ validRows, tenantId, actorId, createNewBatch = false }) {
    if (!validRows || validRows.length === 0) {
      throw new BadRequestError('No valid rows available to import.')
    }

    const targetTenantId = await this.resolveTenantId(tenantId)
    const importBatchId = `IMP-PHARM-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
    const now = new Date()

    let createdCount = 0
    let updatedCount = 0

    // Execute atomic transaction
    await prisma.$transaction(async (tx) => {
      for (const item of validRows) {
        const { data, isDuplicate, existingId } = item

        if (isDuplicate && existingId && !createNewBatch) {
          // UPDATE EXISTING INVENTORY ITEM
          const existing = await tx.inventoryItem.findUnique({ where: { id: existingId } })
          if (existing) {
            const newStockQty = existing.stockQuantity + (data.stockQuantity || 0)
            const updated = await tx.inventoryItem.update({
              where: { id: existingId },
              data: {
                stockQuantity: newStockQty,
                unitCost: data.unitCost || existing.unitCost,
                sellingPrice: data.sellingPrice || existing.sellingPrice,
                expiryDate: data.expiryDate ? new Date(data.expiryDate) : existing.expiryDate,
                mfgDate: data.mfgDate ? new Date(data.mfgDate) : existing.mfgDate,
                schedule: data.schedule || existing.schedule,
                brandName: data.brandName || existing.brandName,
                prescriptionRequired: data.prescriptionRequired,
                importBatchId,
                importedBy: actorId || 'Admin',
                importedAt: now,
                status: newStockQty > existing.minReorderThreshold ? 'Optimal' : 'Low Stock'
              }
            })

            // Create Stock Movement Log Entry
            await tx.stockMovement.create({
              data: {
                tenantId: targetTenantId,
                inventoryItemId: updated.id,
                type: 'Bulk Import',
                quantityIn: data.stockQuantity || 0,
                quantityOut: 0,
                balance: newStockQty,
                batchNumber: data.batchNumber,
                handledBy: actorId || 'Admin',
                importBatchId,
                notes: `Bulk import update batch ${importBatchId}. Stock increased by ${data.stockQuantity}.`
              }
            })

            updatedCount++
            continue
          }
        }

        // CREATE NEW INVENTORY ITEM
        const prefix = data.schedule === 'H1' || data.schedule === 'X' ? 'RX' : 'MED'
        const codeSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
        const sanitizedName = (data.name || 'DRUG').substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, 'X')
        const itemCode = `${prefix}-${sanitizedName}-${codeSuffix}-${Date.now().toString().slice(-4)}`

        const newItem = await tx.inventoryItem.create({
          data: {
            tenantId: targetTenantId,
            itemCode,
            name: data.name,
            brandName: data.brandName,
            category: data.category || 'General Supplies',
            dosageForm: data.dosageForm,
            strength: data.strength,
            manufacturer: data.manufacturer,
            batchNumber: data.batchNumber,
            mfgDate: data.mfgDate ? new Date(data.mfgDate) : null,
            expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
            schedule: data.schedule || 'OTC',
            hsnCode: data.hsnCode,
            unit: data.unit || 'Units',
            packSize: data.packSize,
            unitCost: data.unitCost || 0,
            sellingPrice: data.sellingPrice || 0,
            gstRate: data.gstRate ?? 12,
            stockQuantity: data.stockQuantity || 0,
            minReorderThreshold: data.minReorderThreshold || 50,
            supplierName: data.supplierName,
            storageCondition: data.storageCondition,
            prescriptionRequired: data.prescriptionRequired ?? false,
            mfrLicenseNumber: data.mfrLicenseNumber,
            dpcoCeilingPrice: data.dpcoCeilingPrice,
            importBatchId,
            importedBy: actorId || 'Admin',
            importedAt: now,
            status: (data.stockQuantity || 0) > (data.minReorderThreshold || 50) ? 'Optimal' : 'Low Stock'
          }
        })

        // Initial Stock Movement Log entry
        await tx.stockMovement.create({
          data: {
            tenantId: targetTenantId,
            inventoryItemId: newItem.id,
            type: 'Bulk Import',
            quantityIn: data.stockQuantity || 0,
            quantityOut: 0,
            balance: data.stockQuantity || 0,
            batchNumber: data.batchNumber,
            handledBy: actorId || 'Admin',
            importBatchId,
            notes: `Initial stock opening via Bulk Import batch ${importBatchId}`
          }
        })

        createdCount++
      }
    })

    // Audit Log for compliance traceability
    await AuditService.log({
      tenantId: targetTenantId,
      actorUserId: actorId || null,
      action: 'PHARMACY_INVENTORY_BULK_IMPORT',
      entityType: 'InventoryItem',
      entityId: importBatchId,
      afterState: {
        importBatchId,
        totalImported: createdCount + updatedCount,
        newRecordsCreated: createdCount,
        existingRecordsUpdated: updatedCount,
        timestamp: now.toISOString()
      }
    }).catch(err => console.error('AuditLog emission error:', err))

    return {
      success: true,
      importBatchId,
      importedCount: createdCount + updatedCount,
      createdCount,
      updatedCount,
      message: `Successfully imported ${createdCount + updatedCount} stock items (${createdCount} new, ${updatedCount} updated).`
    }
  }

  /**
   * Generates an Error Report (.xlsx) containing only failed rows and exact failure reasons
   */
  static generateErrorReportBuffer(failedRows) {
    const wb = XLSX.utils.book_new()

    const headers = [
      'Row #',
      'Failure Reasons / Compliance Violations',
      ...TEMPLATE_COLUMNS
    ]

    const errorData = [
      ['PHARMACY INVENTORY BULK IMPORT - FAILED ROWS REPORT'],
      ['Correct the highlighted errors below and re-upload the file.'],
      [],
      headers
    ]

    failedRows.forEach(r => {
      const d = r.data || {}
      errorData.push([
        r.rowNumber || '-',
        (r.errors || []).join(' | '),
        d.name || '',
        d.brandName || '',
        d.category || '',
        d.dosageForm || '',
        d.strength || '',
        d.manufacturer || '',
        d.batchNumber || '',
        d.mfgDate ? new Date(d.mfgDate).toLocaleDateString('en-GB') : '',
        d.expiryDate ? new Date(d.expiryDate).toLocaleDateString('en-GB') : '',
        d.schedule || '',
        d.hsnCode || '',
        d.unit || '',
        d.packSize || '',
        d.unitCost ?? '',
        d.sellingPrice ?? '',
        d.gstRate ?? '',
        d.stockQuantity ?? '',
        d.minReorderThreshold ?? '',
        d.supplierName || '',
        d.storageCondition || '',
        d.prescriptionRequired ? 'Yes' : 'No',
        d.mfrLicenseNumber || '',
        d.dpcoCeilingPrice ?? ''
      ])
    })

    const ws = XLSX.utils.aoa_to_sheet(errorData)
    ws['!cols'] = [
      { wch: 8 },
      { wch: 45 },
      ...TEMPLATE_COLUMNS.map(() => ({ wch: 20 }))
    ]

    XLSX.utils.book_append_sheet(wb, ws, 'Failed Rows')
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  }
}
