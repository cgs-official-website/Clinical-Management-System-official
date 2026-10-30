import { Router } from 'express'
import { z } from 'zod'
import { DentalController } from '../controllers/dental.controller.js'
import { authenticateToken } from '../middlewares/auth.middleware.js'
import { requirePermission } from '../middlewares/rbac.middleware.js'
import { validateRequest } from '../middlewares/validate.middleware.js'

const router = Router()
router.use(authenticateToken)

/* ------------------------------ Validation ------------------------------ */
const TOOTH_STATUS = ['HEALTHY', 'CARIES', 'RESTORED', 'CROWN', 'ROOT_CANAL', 'IMPLANT', 'MISSING']
const SURFACES = ['M', 'O', 'D', 'B', 'L', 'All']
const optStr = z.string().trim().max(2000).optional().nullable().transform((v) => v || null)
const money = z.coerce.number().min(0).max(100000000)

const probingSchema = z
    .object({
        DB: z.coerce.number().int().min(0).max(15),
        B: z.coerce.number().int().min(0).max(15),
        MB: z.coerce.number().int().min(0).max(15),
        DL: z.coerce.number().int().min(0).max(15),
        L: z.coerce.number().int().min(0).max(15),
        ML: z.coerce.number().int().min(0).max(15),
    })
    .optional()
    .nullable()

const saveChartSchema = z.object({
    teeth: z
        .array(
            z.object({
                toothNo: z.coerce.number().int().min(1).max(32),
                status: z.enum(TOOTH_STATUS),
                surfaces: z.array(z.enum(SURFACES)).default([]),
                notes: optStr,
                probingDepths: probingSchema,
            })
        )
        .max(32),
})

const planItemSchema = z.object({
    phase: z.string().trim().min(1).max(120).default('Phase 1'),
    code: optStr,
    description: z.string().trim().min(1).max(300),
    toothNo: optStr,
    fee: money.default(0),
    insuranceCoverage: money.default(0),
    status: z.enum(['PLANNED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED']).default('PLANNED'),
})

const createPlanSchema = z.object({
    patientId: z.string().min(1),
    name: z.string().trim().min(1).max(200),
    items: z.array(planItemSchema).default([]),
})

const updatePlanSchema = z
    .object({
        name: z.string().trim().min(1).max(200),
        status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED']),
    })
    .partial()

const updatePlanItemSchema = planItemSchema.partial()

const addToPlanSchema = z.object({
    patientId: z.string().min(1),
    item: planItemSchema,
})

const createXraySchema = z.object({
    patientId: z.string().min(1),
    scanType: z.string().trim().min(1).max(120),
    region: optStr,
    toothNo: optStr,
    takenAt: z.string().optional(),
    radiologist: optStr,
    findings: optStr,
})

const updateXraySchema = createXraySchema
    .omit({ patientId: true })
    .partial()
    .extend({ status: z.enum(['PENDING', 'VERIFIED']).optional() })

const createLabOrderSchema = z.object({
    patientId: z.string().min(1),
    lab: z.string().trim().min(1).max(200),
    workType: z.string().trim().min(1).max(120),
    material: optStr,
    toothNo: optStr,
    shade: optStr,
    dueDate: z.string().optional().nullable(),
    notes: optStr,
})

const updateLabOrderSchema = createLabOrderSchema
    .omit({ patientId: true })
    .partial()
    .extend({ status: z.enum(['DRAFT', 'SENT', 'IN_PROGRESS', 'RECEIVED', 'FITTED', 'CANCELLED']).optional() })

/* ------------------------------ Dental chart ------------------------------ */
router.get('/chart/:patientId', requirePermission('dental_chart.view'), DentalController.getChart)
router.put(
    '/chart/:patientId',
    requirePermission('dental_chart.edit'),
    validateRequest({ body: saveChartSchema }),
    DentalController.saveChart
)
router.delete('/chart/:patientId', requirePermission('dental_chart.delete'), DentalController.resetChart)

/* ----------------------------- Treatment plans ---------------------------- */
router.get('/treatment-plans', requirePermission('treatment_plans.view'), DentalController.listPlans)
router.post(
    '/treatment-plans',
    requirePermission('treatment_plans.create'),
    validateRequest({ body: createPlanSchema }),
    DentalController.createPlan
)
// chart -> plan shortcut (needs both chart view and plan create)
router.post(
    '/treatment-plans/add-item',
    requirePermission('treatment_plans.create'),
    validateRequest({ body: addToPlanSchema }),
    DentalController.addToActivePlan
)
router.patch(
    '/treatment-plans/:id',
    requirePermission('treatment_plans.edit'),
    validateRequest({ body: updatePlanSchema }),
    DentalController.updatePlan
)
router.delete('/treatment-plans/:id', requirePermission('treatment_plans.delete'), DentalController.deletePlan)
router.post(
    '/treatment-plans/:id/items',
    requirePermission('treatment_plans.edit'),
    validateRequest({ body: planItemSchema }),
    DentalController.addPlanItem
)
router.patch(
    '/treatment-plans/:id/items/:itemId',
    requirePermission('treatment_plans.edit'),
    validateRequest({ body: updatePlanItemSchema }),
    DentalController.updatePlanItem
)
router.delete(
    '/treatment-plans/:id/items/:itemId',
    requirePermission('treatment_plans.edit'),
    DentalController.deletePlanItem
)
// plan -> billing
router.post(
    '/treatment-plans/:id/invoice',
    requirePermission('billing.create'),
    DentalController.invoicePlan
)

/* -------------------------------- X-rays --------------------------------- */
router.get('/xrays', requirePermission('xray_records.view'), DentalController.listXrays)
router.post(
    '/xrays',
    requirePermission('xray_records.create'),
    validateRequest({ body: createXraySchema }),
    DentalController.createXray
)
router.patch(
    '/xrays/:id',
    requirePermission('xray_records.edit'),
    validateRequest({ body: updateXraySchema }),
    DentalController.updateXray
)
router.delete('/xrays/:id', requirePermission('xray_records.delete'), DentalController.deleteXray)

/* ------------------------------- Lab orders ------------------------------- */
router.get('/lab-orders', requirePermission('lab_orders.view'), DentalController.listLabOrders)
router.post(
    '/lab-orders',
    requirePermission('lab_orders.create'),
    validateRequest({ body: createLabOrderSchema }),
    DentalController.createLabOrder
)
router.patch(
    '/lab-orders/:id',
    requirePermission('lab_orders.edit'),
    validateRequest({ body: updateLabOrderSchema }),
    DentalController.updateLabOrder
)
router.delete('/lab-orders/:id', requirePermission('lab_orders.delete'), DentalController.deleteLabOrder)

export default router
