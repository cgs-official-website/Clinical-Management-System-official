import { Router } from 'express'
import { z } from 'zod'
import { CardioController as C } from '../controllers/cardio.controller.js'
import { requirePermission } from '../middlewares/rbac.middleware.js'
import { validateRequest } from '../middlewares/validate.middleware.js'
import { CATH_LAB_SUITES } from '../services/cardio.service.js'

// Mounted at /api/staff/cardio — authenticateToken is applied by staff.routes.js
const router = Router()

/* ---------------------------------------------------------------- schemas */
const text = (max = 500) => z.string().trim().max(max)
const optText = (max = 500) => text(max).optional().nullable().or(z.literal(''))
const optNum = (min, max) => z.number().min(min).max(max).optional().nullable()
const optInt = (min, max) => z.number().int().min(min).max(max).optional().nullable()

const ecgBase = z.object({
    patientId: z.string().min(1, 'Patient is required'),
    acquiredAt: z.string().optional(),
    rhythm: text(300).min(2, 'Rhythm interpretation is required'),
    heartRate: z.number().int().min(20, 'Heart rate looks too low').max(300, 'Heart rate looks too high'),
    prInterval: optInt(50, 600),
    qrsDuration: optInt(40, 300),
    qtcInterval: optInt(200, 700),
    axis: optText(100),
    stSegment: optText(300),
    leadFindings: z.array(z.object({ lead: text(80).min(1), interpretation: text(300).min(1) })).max(12).optional(),
    priority: z.enum(['ROUTINE', 'URGENT', 'STAT']).optional(),
    cardiologist: optText(120),
})
const ecgCreate = ecgBase
const ecgUpdate = ecgBase.omit({ patientId: true }).partial()

const echoBase = z.object({
    patientId: z.string().min(1, 'Patient is required'),
    studyDate: z.string().min(1, 'Study date is required'),
    modality: text(150).optional(),
    indication: optText(500),
    sonographer: optText(120),
    cardiologist: optText(120),
    efPercent: z.number().int().min(5, 'LVEF looks too low').max(85, 'LVEF looks too high'),
    lvedd: optNum(1, 12),
    lvesd: optNum(1, 12),
    ivsd: optNum(0.3, 4),
    pwd: optNum(0.3, 4),
    laVolumeIndex: optNum(5, 150),
    valves: z.array(z.object({ valve: text(80).min(1), finding: text(600).min(1) })).max(8).optional(),
    wallMotion: optText(600),
    conclusions: z.array(text(600).min(1)).max(12).optional(),
})
const echoCreate = echoBase
const echoUpdate = echoBase.omit({ patientId: true }).partial()

const labIds = CATH_LAB_SUITES.map((s) => s.id)
const cathBase = z.object({
    patientId: z.string().min(1, 'Patient is required'),
    lab: z.enum(labIds),
    procedure: text(300).min(3, 'Procedure is required'),
    scheduledStart: z.string().min(1, 'Start time is required'),
    scheduledEnd: z.string().min(1, 'End time is required'),
    interventionalist: optText(120),
    scrubNurse: optText(120),
    radiologicTech: optText(120),
    accessSite: optText(200),
    contrastAgent: optText(200),
    urgency: z.enum(['ELECTIVE', 'ROUTINE', 'URGENT', 'EMERGENCY']).optional(),
})
const cathCreate = cathBase
const cathUpdate = cathBase
    .omit({ patientId: true })
    .partial()
    .extend({
        status: z.enum(['SCHEDULED', 'PRE_OP_PREP', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
        fluoroscopyMinutes: optNum(0, 600),
        intraOpNotes: optText(4000),
    })

const riskInputs = z.object({
    age: z.number().int(),
    sex: z.enum(['Male', 'Female']),
    race: z.enum(['OTHER', 'AFRICAN_AMERICAN']).optional(),
    sbp: z.number().int(),
    totalCholesterol: z.number().int(),
    hdl: z.number().int(),
    ldl: optInt(20, 400),
    diabetes: z.boolean().optional(),
    smoker: z.boolean().optional(),
    onBpTreatment: z.boolean().optional(),
    onStatin: z.boolean().optional(),
    onAspirin: z.boolean().optional(),
    cacScore: optInt(0, 10000),
})
const riskCreate = riskInputs.extend({
    patientId: z.string().min(1, 'Patient is required'),
    recommendation: optText(2000),
    physician: optText(120),
})

/* ---------------------------------------------------------------- routes */
const body = (schema) => validateRequest({ body: schema })

// ECG
router.get('/ecg-records', requirePermission('ecg_records.view'), C.listEcg)
router.post('/ecg-records', requirePermission('ecg_records.create'), body(ecgCreate), C.createEcg)
router.patch('/ecg-records/:id', requirePermission('ecg_records.edit'), body(ecgUpdate), C.updateEcg)
router.post('/ecg-records/:id/sign-off', requirePermission('ecg_records.edit'), C.signOffEcg)
router.delete('/ecg-records/:id', requirePermission('ecg_records.delete'), C.deleteEcg)

// Echo
router.get('/echo-reports', requirePermission('echo_reports.view'), C.listEcho)
router.post('/echo-reports', requirePermission('echo_reports.create'), body(echoCreate), C.createEcho)
router.patch('/echo-reports/:id', requirePermission('echo_reports.edit'), body(echoUpdate), C.updateEcho)
router.post('/echo-reports/:id/finalize', requirePermission('echo_reports.edit'), C.finalizeEcho)
router.delete('/echo-reports/:id', requirePermission('echo_reports.delete'), C.deleteEcho)

// Cath lab
router.get('/cath-lab', requirePermission('cath_lab_scheduling.view'), C.listCathLab)
router.post('/cath-lab', requirePermission('cath_lab_scheduling.create'), body(cathCreate), C.createCathLab)
router.patch('/cath-lab/:id', requirePermission('cath_lab_scheduling.edit'), body(cathUpdate), C.updateCathLab)
router.delete('/cath-lab/:id', requirePermission('cath_lab_scheduling.delete'), C.deleteCathLab)

// Cardiac risk
router.get('/risk-assessments', requirePermission('cardiac_risk_assessment.view'), C.listRisk)
router.post('/risk-assessments/calculate', requirePermission('cardiac_risk_assessment.view'), body(riskInputs), C.calculateRisk)
router.post('/risk-assessments', requirePermission('cardiac_risk_assessment.create'), body(riskCreate), C.createRisk)
router.delete('/risk-assessments/:id', requirePermission('cardiac_risk_assessment.delete'), C.deleteRisk)

export default router
