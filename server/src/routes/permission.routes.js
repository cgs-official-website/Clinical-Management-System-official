import { Router } from 'express'
import { PermissionController } from '../controllers/permission.controller.js'
import { authenticateToken } from '../middlewares/auth.middleware.js'

const router = Router()

// Dynamic RBAC Permission Endpoints
router.get('/user/me', authenticateToken, PermissionController.getMyPermissions)
router.get('/:roleId', PermissionController.getPermissionsByRole)
router.post('/', PermissionController.bulkSavePermissions)

export default router
