import { Router } from 'express'
import multer from 'multer'
import { PharmacyController } from '../controllers/pharmacy.controller.js'
import { authenticateToken } from '../middlewares/auth.middleware.js'
import { requireAnyPermission } from '../middlewares/rbac.middleware.js'
import { BadRequestError } from '../utils/errors.js'

const router = Router()

// Configure multer for memory storage up to 5MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.xlsx', '.xls', '.csv']
    const originalName = (file.originalname || '').toLowerCase()
    const isAllowedExt = allowedExtensions.some(ext => originalName.endsWith(ext))
    
    if (isAllowedExt || file.mimetype.includes('spreadsheet') || file.mimetype.includes('excel') || file.mimetype.includes('csv')) {
      cb(null, true)
    } else {
      cb(new BadRequestError('Only Excel (.xlsx, .xls) and CSV (.csv) files are allowed (max 5MB).'))
    }
  }
})

// Authentication required for all pharmacy endpoints
router.use(authenticateToken)

// GET /api/pharmacy/inventory/import-template
router.get(
  '/inventory/import-template',
  requireAnyPermission('inventory.view', 'inventory.create', 'inventory.edit'),
  PharmacyController.downloadTemplate
)

// POST /api/pharmacy/inventory/bulk-import
router.post(
  '/inventory/bulk-import',
  requireAnyPermission('inventory.create', 'inventory.edit'),
  upload.single('file'),
  PharmacyController.bulkImport
)

// POST /api/pharmacy/inventory/error-report
router.post(
  '/inventory/error-report',
  requireAnyPermission('inventory.view', 'inventory.create', 'inventory.edit'),
  PharmacyController.downloadErrorReport
)

export default router
