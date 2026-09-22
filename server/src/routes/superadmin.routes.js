import { Router } from 'express'
import { z } from 'zod'
import { SuperadminController } from '../controllers/superadmin.controller.js'
import { NotificationController } from '../controllers/notification.controller.js'
import { authenticateToken, requireSuperadmin } from '../middlewares/auth.middleware.js'
import { validateRequest } from '../middlewares/validate.middleware.js'

const router = Router()

// All superadmin routes require authentication & superadmin flag
router.use(authenticateToken, requireSuperadmin)

const createTenantSchema = z.object({
  name: z.string().min(2, 'Clinic name is required'),
  slug: z.string().optional(),
  email: z.string().email('Valid clinic email is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
  plan: z.enum(['STARTER', 'PRO', 'ENTERPRISE', 'TRIAL']).default('PRO'),
  adminName: z.string().min(2, 'Admin full name is required'),
  adminEmail: z.string().email('Valid admin email is required'),
  adminPassword: z.string().min(8, 'Password must be at least 8 characters')
})

const updateStatusSchema = z.object({
  isActive: z.boolean()
})

router.get('/dashboard/stats', SuperadminController.getStats)
router.get('/kpis', SuperadminController.getStats)
router.get('/pending-registrations', SuperadminController.getPendingRegistrations)
router.post('/registrations/:id/approve', SuperadminController.approveRegistration)
router.post('/registrations/:id/reject', SuperadminController.rejectRegistration)
router.get('/tenants', SuperadminController.getTenants)
router.post('/tenants', validateRequest({ body: createTenantSchema }), SuperadminController.createTenant)
router.patch('/tenants/:id/status', SuperadminController.updateTenantStatus)
router.get('/clinics', SuperadminController.getTenants)
router.post('/clinics', SuperadminController.createTenant)
router.put('/clinics/:id', SuperadminController.updateTenantStatus)
router.patch('/clinics/:id/status', SuperadminController.updateTenantStatus)
router.delete('/clinics/:id', SuperadminController.decommissionTenant)

// Clinic Categories & Role Templates
router.get('/clinic-categories', SuperadminController.getClinicCategories)
router.post('/clinic-categories', SuperadminController.createClinicCategory)
router.get('/clinic-categories/:id', SuperadminController.getClinicCategoryById)
router.put('/clinic-categories/:id', SuperadminController.updateClinicCategory)
router.delete('/clinic-categories/:id', SuperadminController.deleteClinicCategory)
router.get('/clinic-categories/:id/role-templates', SuperadminController.getCategoryRoleTemplates)
router.post('/clinic-categories/:id/role-templates', SuperadminController.setCategoryRoleTemplates)

router.get('/admins', SuperadminController.getAdmins)
router.post('/admins', SuperadminController.createAdmin)
router.put('/admins/:id', SuperadminController.updateAdmin)
router.get('/settings', SuperadminController.getSettings)
router.put('/settings', SuperadminController.updateSettings)
router.get('/audit-logs', SuperadminController.getAuditLogs)
router.get('/health', SuperadminController.getHealth)

// Superadmin DB Notifications
router.get('/notifications', NotificationController.getNotifications)
router.patch('/notifications/:id/read', NotificationController.markAsRead)
router.post('/notifications/mark-all-read', NotificationController.markAllAsRead)

export default router
