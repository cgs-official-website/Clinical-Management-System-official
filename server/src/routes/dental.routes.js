import { Router } from 'express'
import multer from 'multer'
import { DentalController } from '../controllers/dental.controller.js'
import { authenticateToken } from '../middlewares/auth.middleware.js'
import { requirePermission } from '../middlewares/rbac.middleware.js'
import { ValidationError } from '../utils/errors.js'

// Configure multer for memory storage up to 50MB for DICOM/images/PDFs
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/dicom',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'application/pdf',
      'application/octet-stream',
    ]
    const ext = (file.originalname || '').toLowerCase()
    const isAllowedExt =
      ext.endsWith('.dcm') ||
      ext.endsWith('.png') ||
      ext.endsWith('.jpg') ||
      ext.endsWith('.jpeg') ||
      ext.endsWith('.pdf')

    if (allowedTypes.includes(file.mimetype) || isAllowedExt) {
      cb(null, true)
    } else {
      cb(new ValidationError('Only DICOM (.dcm), PNG, JPG, JPEG, and PDF files up to 50MB are permitted.'))
    }
  },
})

const router = Router()

router.use(authenticateToken)

// Dental X-Ray & Imaging Routes
router.get('/xrays', requirePermission('xray_records.view'), DentalController.getXrayRecords)
router.post('/xrays', requirePermission('xray_records.create'), upload.single('file'), DentalController.createXrayRecord)
router.get('/xrays/:id/file', requirePermission('xray_records.view'), DentalController.getXrayRecordFile)
router.get('/xrays/:id/download', requirePermission('xray_records.view'), DentalController.downloadXrayRecordFile)
router.delete('/xrays/:id', requirePermission('xray_records.delete'), DentalController.deleteXrayRecord)

export default router
