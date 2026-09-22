import { PharmacyService } from '../services/pharmacy.service.js'
import { BadRequestError } from '../utils/errors.js'

export class PharmacyController {
  /**
   * GET /api/pharmacy/inventory/import-template
   * Download pre-formatted India-compliant Excel template
   */
  static async downloadTemplate(req, res, next) {
    try {
      const buffer = PharmacyService.generateTemplateBuffer()

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      res.setHeader('Content-Disposition', 'attachment; filename="Pharmacy_Inventory_Import_Template.xlsx"')
      res.setHeader('Content-Length', buffer.length)
      return res.end(buffer)
    } catch (err) {
      next(err)
    }
  }

  /**
   * POST /api/pharmacy/inventory/bulk-import
   * Multi-part file upload with parse/validation (preview) or transactional commit
   */
  static async bulkImport(req, res, next) {
    try {
      const tenantId = req.tenantId || req.user?.tenantId
      const actorId = req.user?.id || 'Admin'

      // Option A: Direct commit of already-validated rows via JSON
      if (req.body && (req.body.commit === true || req.body.commit === 'true') && Array.isArray(req.body.validRows)) {
        const createNewBatch = req.body.createNewBatch === true || req.body.createNewBatch === 'true'
        const result = await PharmacyService.commitBulkImport({
          validRows: req.body.validRows,
          tenantId,
          actorId,
          createNewBatch
        })
        return res.status(200).json(result)
      }

      // Option B: File upload via multipart/form-data
      if (!req.file) {
        throw new BadRequestError('Please provide an Excel (.xlsx) or CSV (.csv) file to import.')
      }

      const isDryRun = req.query.dryRun === 'true' || req.body.action === 'preview' || req.body.preview === 'true' || req.body.commit !== 'true'
      const createNewBatch = req.query.createNewBatch === 'true' || req.body.createNewBatch === 'true'

      const validationResult = await PharmacyService.parseAndValidate(
        req.file.buffer,
        tenantId,
        { createNewBatch }
      )

      // If preview / dry run mode (default step 1): return validation preview
      if (isDryRun) {
        return res.status(200).json({
          success: true,
          mode: 'preview',
          ...validationResult
        })
      }

      // If commit requested directly with file:
      const commitResult = await PharmacyService.commitBulkImport({
        validRows: validationResult.validRows,
        tenantId,
        actorId,
        createNewBatch
      })

      return res.status(200).json({
        success: true,
        mode: 'commit',
        summary: validationResult.summary,
        ...commitResult
      })
    } catch (err) {
      next(err)
    }
  }

  /**
   * POST /api/pharmacy/inventory/error-report
   * Generates and downloads an Excel spreadsheet with only the failed rows and error reasons
   */
  static async downloadErrorReport(req, res, next) {
    try {
      const { failedRows } = req.body
      if (!Array.isArray(failedRows) || failedRows.length === 0) {
        throw new BadRequestError('No failed rows provided to generate an error report.')
      }

      const buffer = PharmacyService.generateErrorReportBuffer(failedRows)

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      res.setHeader('Content-Disposition', 'attachment; filename="Pharmacy_Import_Errors_Report.xlsx"')
      res.setHeader('Content-Length', buffer.length)
      return res.end(buffer)
    } catch (err) {
      next(err)
    }
  }
}
