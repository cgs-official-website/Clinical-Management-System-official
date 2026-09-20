import { Router } from 'express'
import { z } from 'zod'
import { ClinicalController } from '../controllers/clinical.controller.js'
import { authenticateToken } from '../middlewares/auth.middleware.js'
import { requirePermission, requireAnyPermission } from '../middlewares/rbac.middleware.js'
import { validateRequest } from '../middlewares/validate.middleware.js'

const router = Router()

router.use(authenticateToken)

/* =========================================================================
 * VALIDATION SCHEMAS
 * ========================================================================= */
const createPatientSchema = z.object({
  fullName: z.string().optional(),
  name: z.string().optional(),
  email: z.string().optional().or(z.literal('')).or(z.null()),
  phone: z.string().optional().or(z.literal('')),
  dob: z.string().optional(),
  age: z.any().optional(),
  gender: z.string().optional().default('Female'),
  bloodGroup: z.string().optional(),
  address: z.string().optional().or(z.literal('')).or(z.null()),
  emergencyContact: z.string().optional(),
  allergies: z.any().optional(),
  chronicConditions: z.any().optional(),
  medicalHistory: z.any().optional(),
  primaryDoctor: z.string().optional()
}).refine(data => !!(data.fullName || data.name), {
  message: 'Full name is required',
  path: ['fullName']
})

const createAppointmentSchema = z.object({
  patientId: z.string().optional(),
  patientName: z.string().optional(),
  name: z.string().optional(),
  patientPhone: z.string().optional(),
  doctorId: z.string().optional(),
  doctorName: z.string().optional(),
  staffId: z.string().optional(),
  scheduledAt: z.string().optional(),
  dateTime: z.string().optional(),
  durationMinutes: z.any().optional().default(30),
  type: z.string().optional().default('In-Person Consultation'),
  room: z.string().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().optional()
}).refine(data => !!(data.patientId || data.patientName || data.name), {
  message: 'Patient ID or Patient Name is required',
  path: ['patientId']
})

const createPrescriptionSchema = z.object({
  patientId: z.string().optional(),
  patientName: z.string().optional(),
  name: z.string().optional(),
  doctorId: z.string().optional(),
  diagnosis: z.string().min(2, 'Diagnosis is required'),
  notes: z.string().optional(),
  items: z.array(z.any()).optional(),
  medications: z.array(z.any()).optional()
}).refine(data => !!(data.patientId || data.patientName || data.name), {
  message: 'Patient ID or Patient Name is required',
  path: ['patientId']
})

const createInvoiceSchema = z.object({
  patientId: z.string().optional(),
  patientName: z.string().optional(),
  name: z.string().optional(),
  patientPhone: z.string().optional(),
  taxRate: z.number().min(0).default(18),
  amount: z.any().optional(),
  insuranceCoverage: z.any().optional(),
  patientResponsibility: z.any().optional(),
  notes: z.string().optional(),
  paymentMethod: z.string().optional(),
  status: z.string().optional(),
  items: z.array(z.any()).optional()
}).refine(data => !!(data.patientId || data.patientName || data.name), {
  message: 'Patient ID or Patient Name is required',
  path: ['patientId']
})

const createInventoryItemSchema = z.object({
  name: z.string().min(2, 'Item name is required'),
  sku: z.string().optional(),
  itemCode: z.string().optional(),
  category: z.string().optional().default('General Supplies'),
  quantity: z.any().optional(),
  stockQuantity: z.any().optional(),
  unit: z.string().default('Units'),
  minThreshold: z.any().optional(),
  minReorderThreshold: z.any().optional(),
  unitPrice: z.any().optional(),
  sellingPrice: z.any().optional(),
  unitCost: z.any().optional(),
  batchNumber: z.string().optional(),
  expiryDate: z.string().optional()
})

/* =========================================================================
 * PATIENTS
 * ========================================================================= */
router.get('/patients', requirePermission('patients.view'), ClinicalController.getPatients)
router.get('/patients/:id', requirePermission('patients.view'), ClinicalController.getPatientById)
router.post('/patients', requirePermission('patients.create'), validateRequest({ body: createPatientSchema }), ClinicalController.createPatient)
router.patch('/patients/:id', requirePermission('patients.edit'), ClinicalController.updatePatient)
router.delete('/patients/:id', requirePermission('patients.delete'), ClinicalController.deletePatient)

/* =========================================================================
 * APPOINTMENTS
 * ========================================================================= */
router.get('/appointments', requirePermission('appointments.view'), ClinicalController.getAppointments)
router.post('/appointments', requirePermission('appointments.create'), validateRequest({ body: createAppointmentSchema }), ClinicalController.createAppointment)
router.patch('/appointments/:id', requirePermission('appointments.edit'), ClinicalController.updateAppointment)

/* =========================================================================
 * OUTPATIENT TRIAGE & TOKEN QUEUE (RECEPTION -> DOCTOR -> PHARMACY)
 * ========================================================================= */
router.get('/triage', requireAnyPermission('patients.view', 'appointments.view', 'prescriptions.view', 'inventory.view'), ClinicalController.getTriageQueue)
router.post('/triage', requireAnyPermission('patients.create', 'patients.edit', 'appointments.create'), ClinicalController.recordTriage)

/* =========================================================================
 * PRESCRIPTIONS
 * ========================================================================= */
router.get('/prescriptions', requireAnyPermission('prescriptions.view', 'inventory.view', 'patients.view', 'appointments.view'), ClinicalController.getPrescriptions)
router.post('/prescriptions', requirePermission('prescriptions.create'), validateRequest({ body: createPrescriptionSchema }), ClinicalController.createPrescription)
router.patch('/prescriptions/:id', requireAnyPermission('prescriptions.edit', 'prescriptions.create'), ClinicalController.updatePrescription)
router.patch('/prescriptions/:id/fulfill', requireAnyPermission('inventory.edit', 'inventory.create', 'prescriptions.edit', 'prescriptions.view'), ClinicalController.fulfillPrescription)

/* =========================================================================
 * BILLING & INVOICES (ALL AMOUNTS IN INR ₹)
 * ========================================================================= */
router.get('/invoices', requirePermission('billing.view'), ClinicalController.getInvoices)
router.get('/billing', requirePermission('billing.view'), ClinicalController.getInvoices)
router.post('/invoices', requirePermission('billing.create'), validateRequest({ body: createInvoiceSchema }), ClinicalController.createInvoice)
router.post('/billing', requirePermission('billing.create'), validateRequest({ body: createInvoiceSchema }), ClinicalController.createInvoice)
router.patch('/invoices/:id/status', requirePermission('billing.edit'), ClinicalController.updateInvoiceStatus)
router.patch('/billing/:id/status', requirePermission('billing.edit'), ClinicalController.updateInvoiceStatus)

/* =========================================================================
 * INVENTORY
 * ========================================================================= */
router.get('/inventory', requirePermission('inventory.view'), ClinicalController.getInventory)
router.post('/inventory', requirePermission('inventory.create'), validateRequest({ body: createInventoryItemSchema }), ClinicalController.createInventoryItem)
router.patch('/inventory/:id', requirePermission('inventory.edit'), ClinicalController.updateInventoryItem)

/* =========================================================================
 * REPORTS & ANALYTICS
 * ========================================================================= */
router.get('/reports', ClinicalController.getStaffReports)

/* =========================================================================
 * STAFF TRANSPARENCY
 * ========================================================================= */
router.get('/staff/me/permissions', ClinicalController.getMyPermissions)

export default router
