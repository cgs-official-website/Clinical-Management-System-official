import { Router } from 'express'
import authRoutes from './auth.routes.js'
import superadminRoutes from './superadmin.routes.js'
import adminRoutes from './admin.routes.js'
import staffRoutes from './staff.routes.js'
import publicRoutes from './public.routes.js'
import docsRoutes from './docs.routes.js'
import permissionRoutes from './permission.routes.js'
import aiRoutes from './ai.routes.js'
import { PermissionController } from '../controllers/permission.controller.js'

import chatRoutes from './chat.routes.js'
import pharmacyRoutes from './pharmacy.routes.js'

const router = Router()

// Public CMS and Health
router.use('/', publicRoutes)

// OpenRouter AI Chatbot Endpoint
router.use('/chat', chatRoutes)

// OpenAPI Swagger Docs
router.use('/docs', docsRoutes)

// Authentication
router.use('/auth', authRoutes)

// AI Engine & Clinical Tools (OpenRouter Powered)
router.use('/ai', aiRoutes)

// Superadmin Platform Operations
router.use('/superadmin', superadminRoutes)

// Clinic Admin RBAC & Clinic Operations
router.use('/admin', adminRoutes)

// Dynamic RBAC Permission Engine
router.use('/permissions', permissionRoutes)
router.get('/modules', PermissionController.getModules)
router.get('/roles', PermissionController.getRoles)

import dentalRoutes from './dental.routes.js'

// Pharmacy & Inventory Management (Bulk Import, Stock Movements, Compliance)
router.use('/pharmacy', pharmacyRoutes)

// Dental Specialty & Radiographic Vault
router.use('/dental', dentalRoutes)

// Staff Clinical Operations (Patients, Appointments, Prescriptions, Billing, Inventory)
router.use('/staff', staffRoutes)

export default router
