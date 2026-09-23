import fs from 'fs'
import path from 'path'
import { DentalService } from '../services/dental.service.js'
import { logger } from '../utils/logger.js'

export class DentalController {
  /**
   * Get all X-Ray records for current tenant
   */
  static async getXrayRecords(req, res, next) {
    try {
      const tenantId = req.user.tenantId
      const { patientId, search } = req.query
      const records = await DentalService.getXrayRecords(tenantId, { patientId, search })
      return res.status(200).json({ success: true, data: records })
    } catch (error) {
      logger.error(`Error in getXrayRecords: ${error.message}`)
      next(error)
    }
  }

  /**
   * Upload & create X-Ray record
   */
  static async createXrayRecord(req, res, next) {
    try {
      const tenantId = req.user.tenantId
      const userId = req.user.id
      const file = req.file

      const record = await DentalService.createXrayRecord(
        tenantId,
        userId,
        req.body,
        file
      )

      return res.status(201).json({
        success: true,
        message: 'Radiograph uploaded and archived successfully',
        data: {
          id: record.id,
          code: record.code,
          type: record.type,
          region: record.region,
          status: record.status,
        },
      })
    } catch (error) {
      logger.error(`Error in createXrayRecord: ${error.message}`)
      next(error)
    }
  }

  /**
   * Stream/View uploaded file inline
   */
  static async getXrayRecordFile(req, res, next) {
    try {
      const tenantId = req.user.tenantId
      const { id } = req.params
      const record = await DentalService.getXrayRecordById(tenantId, id)

      res.setHeader('Content-Type', record.fileMime || 'application/octet-stream')
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(record.fileName)}"`)
      res.setHeader('Cache-Control', 'public, max-age=86400')

      if (record.fileData) {
        return res.send(record.fileData)
      }

      if (record.filePath && fs.existsSync(record.filePath)) {
        return res.sendFile(path.resolve(record.filePath))
      }

      return res.status(404).json({ success: false, error: 'File content not found' })
    } catch (error) {
      logger.error(`Error in getXrayRecordFile: ${error.message}`)
      next(error)
    }
  }

  /**
   * Download original radiograph file
   */
  static async downloadXrayRecordFile(req, res, next) {
    try {
      const tenantId = req.user.tenantId
      const { id } = req.params
      const record = await DentalService.getXrayRecordById(tenantId, id)

      res.setHeader('Content-Type', record.fileMime || 'application/octet-stream')
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(record.fileName)}"`)

      if (record.fileData) {
        return res.send(record.fileData)
      }

      if (record.filePath && fs.existsSync(record.filePath)) {
        return res.download(path.resolve(record.filePath), record.fileName)
      }

      return res.status(404).json({ success: false, error: 'File content not found' })
    } catch (error) {
      logger.error(`Error in downloadXrayRecordFile: ${error.message}`)
      next(error)
    }
  }

  /**
   * Delete X-Ray record
   */
  static async deleteXrayRecord(req, res, next) {
    try {
      const tenantId = req.user.tenantId
      const { id } = req.params
      const result = await DentalService.deleteXrayRecord(tenantId, id)
      return res.status(200).json({ success: true, message: 'X-Ray record deleted successfully', data: result })
    } catch (error) {
      logger.error(`Error in deleteXrayRecord: ${error.message}`)
      next(error)
    }
  }
}
