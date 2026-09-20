import { Router } from 'express'
import { z } from 'zod'
import { AdminController } from '../controllers/admin.controller.js'
import { authenticateToken } from '../middlewares/auth.middleware.js'
import { requirePermission, requireAnyPermission } from '../middlewares/rbac.middleware.js'
import { validateRequest } from '../middlewares/validate.middleware.js'

const router = Router()

router.use(authenticateToken)

const createRoleSchema = z.object({
  name: z.string().min(2, 'Role name is required'),
  displayName: z.string().optional(),
  description: z.string().optional(),
  permissions: z.union([z.array(z.string()), z.array(z.any())]).optional()
})

const updateRolePermsSchema = z.object({
  permissions: z.union([z.array(z.string()), z.array(z.any())])
})

const createTemplateSchema = z.object({
  keyword: z.string().min(1, 'Keyword is required'),
  module: z.string().min(1, 'Module is required'),
  action: z.string().min(1, 'Action is required'),
  isWildcard: z.boolean().optional()
})

const updateTemplateSchema = z.object({
  keyword: z.string().optional(),
  module: z.string().optional(),
  action: z.string().optional(),
  isWildcard: z.boolean().optional()
})

const assignRoleSchema = z.object({
  userId: z.string().uuid('Valid user UUID required')
})

// KPI Dashboard
router.get('/dashboard/stats', requirePermission('reports.view'), AdminController.getStats)
router.get('/kpis', requirePermission('reports.view'), AdminController.getStats)

// Dynamic Modules & RBAC Matrix
router.get('/modules', requirePermission('roles.view'), AdminController.getModulesAndPermissions)
router.get('/permission-modules', requirePermission('roles.view'), AdminController.getModulesAndPermissions)
router.get('/roles/suggest-permissions', requireAnyPermission('roles.view', 'roles.create'), AdminController.suggestRolePermissions)

// Role Templates & Offline Keyword Mappings
router.get('/roles/templates', requirePermission('roles.view'), AdminController.getRoleTemplates)
router.post('/roles/templates', requirePermission('roles.edit'), validateRequest({ body: createTemplateSchema }), AdminController.createRoleTemplate)
router.post('/roles/templates/reset', requirePermission('roles.edit'), AdminController.resetRoleTemplates)
router.put('/roles/templates/:id', requirePermission('roles.edit'), validateRequest({ body: updateTemplateSchema }), AdminController.updateRoleTemplate)
router.delete('/roles/templates/:id', requirePermission('roles.edit'), AdminController.deleteRoleTemplate)

router.get('/roles', requirePermission('roles.view'), AdminController.getRoles)
router.post('/roles', requirePermission('roles.create'), validateRequest({ body: createRoleSchema }), AdminController.createRole)
router.post('/roles/:id/permissions', requirePermission('roles.edit'), AdminController.updateRolePermissions)
router.put('/roles/:id', requirePermission('roles.edit'), AdminController.updateRolePermissions)
router.put('/roles/:id/permissions', requirePermission('roles.edit'), AdminController.updateRolePermissions)
router.patch('/roles/:id/permissions', requirePermission('roles.edit'), validateRequest({ body: updateRolePermsSchema }), AdminController.updateRolePermissions)
router.delete('/roles/:id', requirePermission('roles.delete'), AdminController.deleteRole)

// Staff Directory & Management
router.get('/staff', requirePermission('staff.view'), AdminController.getStaff)
router.post('/staff', requirePermission('staff.create'), AdminController.createStaff)
router.put('/staff/:id', requirePermission('staff.edit'), AdminController.updateStaff)
router.delete('/staff/:id', requirePermission('staff.delete'), AdminController.deleteStaff)
router.post('/roles/:id/assign', requirePermission('staff.edit'), validateRequest({ body: assignRoleSchema }), AdminController.assignRole)
router.delete('/roles/:id/assign', requirePermission('staff.edit'), validateRequest({ body: assignRoleSchema }), AdminController.unassignRole)

// Departments
router.get('/departments', AdminController.getDepartments)

// Clinical Configuration & Environment Setup
router.get('/clinical-config', requirePermission('clinical_config.view'), AdminController.getClinicalConfig)
router.put('/clinical-config', requirePermission('clinical_config.edit'), AdminController.updateClinicalConfig)
router.post('/environment-setup', AdminController.saveEnvironmentSetup)

// Clinical Reports & Analytics
router.get('/reports', requirePermission('reports.view'), AdminController.getReports)

export default router
