import { prisma } from '../config/prisma.js'
import { ConflictError, NotFoundError, ValidationError } from '../utils/errors.js'
import { AuditService } from './audit.service.js'
import {
    buildRecommendation,
    calculateAscvdRisk,
    categorizeRisk,
    validateAscvdInputs,
} from '../utils/ascvdRisk.js'

/** Cath lab suites are clinic configuration, not patient data. */
export const CATH_LAB_SUITES = [
    { id: 'LAB-1', name: 'Cath Lab 1 (Coronary Intervention Suite)' },
    { id: 'LAB-2', name: 'Cath Lab 2 (Structural & EP Suite)' },
    { id: 'LAB-3', name: 'Hybrid OR / Peripheral Suite' },
]

const PATIENT_SELECT = { id: true, fullName: true, mrn: true, dob: true, gender: true }

/* -------------------------------------------------------------------------
 * helpers
 * ----------------------------------------------------------------------- */
async function resolveTenantId(tenantId) {
    // Same demo-tenant fallback the rest of the clinical services use.
    if (tenantId && !tenantId.startsWith('clinic-')) return tenantId
    const first = await prisma.tenant.findFirst({ select: { id: true } })
    return first?.id
}

const ageFromDob = (dob) => {
    if (!dob) return null
    const d = new Date(dob)
    const now = new Date()
    let age = now.getFullYear() - d.getFullYear()
    const m = now.getMonth() - d.getMonth()
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
    return Math.max(0, age)
}

const withPatient = (row) => {
    if (!row) return row
    const { patient, ...rest } = row
    return {
        ...rest,
        patientName: patient?.fullName || 'Unknown patient',
        patientMrn: patient?.mrn || null,
        patientAge: ageFromDob(patient?.dob),
        patientGender: patient?.gender || null,
    }
}

async function assertPatient(tenantId, patientId) {
    if (!patientId) throw new ValidationError('Patient is required')
    const patient = await prisma.patient.findFirst({
        where: { id: patientId, tenantId },
        select: PATIENT_SELECT,
    })
    if (!patient) throw new NotFoundError('Patient not found in this clinic')
    return patient
}

/**
 * Creates a record with a human friendly sequential number such as ECG-2026-001.
 * Retries when two users create at the same moment (unique constraint).
 */
async function createWithNumber({ model, numberField, prefix, tenantId, build }) {
    const year = new Date().getFullYear()
    for (let attempt = 0; attempt < 6; attempt++) {
        const existing = await prisma[model].count({
            where: { tenantId, [numberField]: { startsWith: `${prefix}-${year}-` } },
        })
        const number = `${prefix}-${year}-${String(existing + 1 + attempt).padStart(3, '0')}`
        try {
            return await prisma[model].create({ data: build(number), include: { patient: { select: PATIENT_SELECT } } })
        } catch (err) {
            if (err?.code === 'P2002') continue
            throw err
        }
    }
    throw new ConflictError('Could not allocate a record number, please retry')
}

const audit = (tenantId, actorId, action, entityType, entityId, details) =>
    AuditService.log({ tenantId, actorId, action, entityType, entityId, details }).catch(() => { })

const toDate = (value, label) => {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) throw new ValidationError(`${label} is not a valid date`)
    return d
}

const paging = (page, limit) => {
    const p = Math.max(1, parseInt(page, 10) || 1)
    const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 50))
    return { page: p, limit: l, skip: (p - 1) * l }
}

const patientSearch = (search) =>
    search
        ? {
            patient: {
                OR: [
                    { fullName: { contains: search, mode: 'insensitive' } },
                    { mrn: { contains: search, mode: 'insensitive' } },
                ],
            },
        }
        : {}

export class CardioService {
    /* =======================================================================
     * ECG
     * ===================================================================== */
    static async listEcg({ tenantId, search, status, priority, page, limit }) {
        const tid = await resolveTenantId(tenantId)
        const { page: p, limit: l, skip } = paging(page, limit)
        const where = {
            tenantId: tid,
            ...(status ? { status } : {}),
            ...(priority ? { priority } : {}),
            ...patientSearch(search),
        }
        const [total, rows] = await Promise.all([
            prisma.ecgRecord.count({ where }),
            prisma.ecgRecord.findMany({
                where,
                skip,
                take: l,
                orderBy: { acquiredAt: 'desc' },
                include: { patient: { select: PATIENT_SELECT } },
            }),
        ])
        return { data: rows.map(withPatient), pagination: { page: p, limit: l, total } }
    }

    static async createEcg(body, tenantId, actorId) {
        const tid = await resolveTenantId(tenantId)
        await assertPatient(tid, body.patientId)
        const row = await createWithNumber({
            model: 'ecgRecord',
            numberField: 'ecgNumber',
            prefix: 'ECG',
            tenantId: tid,
            build: (ecgNumber) => ({
                tenantId: tid,
                patientId: body.patientId,
                ecgNumber,
                acquiredAt: body.acquiredAt ? toDate(body.acquiredAt, 'Acquired time') : new Date(),
                rhythm: body.rhythm,
                heartRate: body.heartRate,
                prInterval: body.prInterval ?? null,
                qrsDuration: body.qrsDuration ?? null,
                qtcInterval: body.qtcInterval ?? null,
                axis: body.axis || null,
                stSegment: body.stSegment || null,
                leadFindings: body.leadFindings || [],
                priority: body.priority || 'ROUTINE',
                status: 'REQUIRES_REVIEW',
                cardiologist: body.cardiologist || null,
                createdBy: actorId || null,
            }),
        })
        await audit(tid, actorId, 'ECG_RECORD_CREATED', 'EcgRecord', row.id, { ecgNumber: row.ecgNumber })
        return withPatient(row)
    }

    static async updateEcg(id, body, tenantId, actorId) {
        const tid = await resolveTenantId(tenantId)
        const existing = await prisma.ecgRecord.findFirst({ where: { id, tenantId: tid } })
        if (!existing) throw new NotFoundError('ECG record not found')
        if (existing.status === 'VERIFIED') {
            throw new ConflictError('A signed-off ECG cannot be edited')
        }
        const { patientId, ...fields } = body
        const row = await prisma.ecgRecord.update({
            where: { id },
            data: {
                ...fields,
                ...(fields.acquiredAt ? { acquiredAt: toDate(fields.acquiredAt, 'Acquired time') } : {}),
            },
            include: { patient: { select: PATIENT_SELECT } },
        })
        await audit(tid, actorId, 'ECG_RECORD_UPDATED', 'EcgRecord', id, fields)
        return withPatient(row)
    }

    static async signOffEcg(id, tenantId, actorId, signerName) {
        const tid = await resolveTenantId(tenantId)
        const existing = await prisma.ecgRecord.findFirst({ where: { id, tenantId: tid } })
        if (!existing) throw new NotFoundError('ECG record not found')
        if (existing.status === 'VERIFIED') throw new ConflictError('This ECG is already signed off')
        const row = await prisma.ecgRecord.update({
            where: { id },
            data: {
                status: 'VERIFIED',
                signedOffAt: new Date(),
                signedOffBy: actorId || null,
                cardiologist: existing.cardiologist || signerName || null,
            },
            include: { patient: { select: PATIENT_SELECT } },
        })
        await audit(tid, actorId, 'ECG_RECORD_SIGNED_OFF', 'EcgRecord', id, { ecgNumber: row.ecgNumber })
        return withPatient(row)
    }

    static async deleteEcg(id, tenantId, actorId) {
        const tid = await resolveTenantId(tenantId)
        const existing = await prisma.ecgRecord.findFirst({ where: { id, tenantId: tid } })
        if (!existing) throw new NotFoundError('ECG record not found')
        await prisma.ecgRecord.delete({ where: { id } })
        await audit(tid, actorId, 'ECG_RECORD_DELETED', 'EcgRecord', id, { ecgNumber: existing.ecgNumber })
        return { success: true, message: 'ECG record deleted' }
    }

    /* =======================================================================
     * ECHO
     * ===================================================================== */
    static async listEcho({ tenantId, search, status, page, limit }) {
        const tid = await resolveTenantId(tenantId)
        const { page: p, limit: l, skip } = paging(page, limit)
        const where = { tenantId: tid, ...(status ? { status } : {}), ...patientSearch(search) }
        const [total, rows] = await Promise.all([
            prisma.echoReport.count({ where }),
            prisma.echoReport.findMany({
                where,
                skip,
                take: l,
                orderBy: { studyDate: 'desc' },
                include: { patient: { select: PATIENT_SELECT } },
            }),
        ])
        return { data: rows.map(withPatient), pagination: { page: p, limit: l, total } }
    }

    static async createEcho(body, tenantId, actorId) {
        const tid = await resolveTenantId(tenantId)
        await assertPatient(tid, body.patientId)
        const row = await createWithNumber({
            model: 'echoReport',
            numberField: 'reportNumber',
            prefix: 'ECHO',
            tenantId: tid,
            build: (reportNumber) => ({
                tenantId: tid,
                patientId: body.patientId,
                reportNumber,
                studyDate: toDate(body.studyDate, 'Study date'),
                modality: body.modality || 'Transthoracic Echocardiogram (TTE)',
                indication: body.indication || null,
                sonographer: body.sonographer || null,
                cardiologist: body.cardiologist || null,
                efPercent: body.efPercent,
                lvedd: body.lvedd ?? null,
                lvesd: body.lvesd ?? null,
                ivsd: body.ivsd ?? null,
                pwd: body.pwd ?? null,
                laVolumeIndex: body.laVolumeIndex ?? null,
                valves: body.valves || [],
                wallMotion: body.wallMotion || null,
                conclusions: body.conclusions || [],
                status: 'DRAFT',
                createdBy: actorId || null,
            }),
        })
        await audit(tid, actorId, 'ECHO_REPORT_CREATED', 'EchoReport', row.id, { reportNumber: row.reportNumber })
        return withPatient(row)
    }

    static async updateEcho(id, body, tenantId, actorId) {
        const tid = await resolveTenantId(tenantId)
        const existing = await prisma.echoReport.findFirst({ where: { id, tenantId: tid } })
        if (!existing) throw new NotFoundError('Echo report not found')
        if (existing.status === 'FINALIZED') throw new ConflictError('A finalized echo report cannot be edited')
        const { patientId, ...fields } = body
        const row = await prisma.echoReport.update({
            where: { id },
            data: {
                ...fields,
                ...(fields.studyDate ? { studyDate: toDate(fields.studyDate, 'Study date') } : {}),
            },
            include: { patient: { select: PATIENT_SELECT } },
        })
        await audit(tid, actorId, 'ECHO_REPORT_UPDATED', 'EchoReport', id, fields)
        return withPatient(row)
    }

    static async finalizeEcho(id, tenantId, actorId, signerName) {
        const tid = await resolveTenantId(tenantId)
        const existing = await prisma.echoReport.findFirst({ where: { id, tenantId: tid } })
        if (!existing) throw new NotFoundError('Echo report not found')
        if (existing.status === 'FINALIZED') throw new ConflictError('This report is already finalized')
        const conclusions = Array.isArray(existing.conclusions) ? existing.conclusions : []
        if (conclusions.length === 0) {
            throw new ValidationError('Add at least one conclusion before finalizing the report')
        }
        const row = await prisma.echoReport.update({
            where: { id },
            data: {
                status: 'FINALIZED',
                finalizedAt: new Date(),
                cardiologist: existing.cardiologist || signerName || null,
            },
            include: { patient: { select: PATIENT_SELECT } },
        })
        await audit(tid, actorId, 'ECHO_REPORT_FINALIZED', 'EchoReport', id, { reportNumber: row.reportNumber })
        return withPatient(row)
    }

    static async deleteEcho(id, tenantId, actorId) {
        const tid = await resolveTenantId(tenantId)
        const existing = await prisma.echoReport.findFirst({ where: { id, tenantId: tid } })
        if (!existing) throw new NotFoundError('Echo report not found')
        await prisma.echoReport.delete({ where: { id } })
        await audit(tid, actorId, 'ECHO_REPORT_DELETED', 'EchoReport', id, { reportNumber: existing.reportNumber })
        return { success: true, message: 'Echo report deleted' }
    }

    /* =======================================================================
     * CATH LAB
     * ===================================================================== */
    // from / to are ISO instants chosen by the browser (its local day), so the
    // result does not depend on the server's timezone.
    static async listCathLab({ tenantId, lab, status, from, to }) {
        const tid = await resolveTenantId(tenantId)
        const where = { tenantId: tid, ...(lab ? { lab } : {}), ...(status ? { status } : {}) }
        if (from || to) {
            where.scheduledStart = {
                ...(from ? { gte: toDate(from, 'From date') } : {}),
                ...(to ? { lt: toDate(to, 'To date') } : {}),
            }
        }
        const rows = await prisma.cathLabProcedure.findMany({
            where,
            orderBy: { scheduledStart: 'asc' },
            take: 200,
            include: { patient: { select: PATIENT_SELECT } },
        })

        // Suite status is derived from live procedures, never stored.
        const active = await prisma.cathLabProcedure.findMany({
            where: { tenantId: tid, status: { in: ['IN_PROGRESS', 'PRE_OP_PREP'] } },
            select: { lab: true, status: true, procedure: true },
        })
        const suites = CATH_LAB_SUITES.map((suite) => {
            const inProgress = active.find((a) => a.lab === suite.id && a.status === 'IN_PROGRESS')
            const prep = active.find((a) => a.lab === suite.id && a.status === 'PRE_OP_PREP')
            if (inProgress) return { ...suite, status: 'IN_PROCEDURE', currentCase: inProgress.procedure }
            if (prep) return { ...suite, status: 'PREPARING', currentCase: `Next: ${prep.procedure}` }
            return { ...suite, status: 'READY', currentCase: 'No active case' }
        })

        return { data: rows.map(withPatient), suites }
    }

    static async #assertNoLabOverlap(tenantId, lab, start, end, excludeId) {
        const clash = await prisma.cathLabProcedure.findFirst({
            where: {
                tenantId,
                lab,
                status: { notIn: ['CANCELLED', 'COMPLETED'] },
                ...(excludeId ? { id: { not: excludeId } } : {}),
                scheduledStart: { lt: end },
                scheduledEnd: { gt: start },
            },
            select: { caseNumber: true, procedure: true },
        })
        if (clash) {
            throw new ConflictError(`${lab} is already booked for that time (${clash.caseNumber}: ${clash.procedure})`)
        }
    }

    static async createCathLab(body, tenantId, actorId) {
        const tid = await resolveTenantId(tenantId)
        await assertPatient(tid, body.patientId)
        const start = toDate(body.scheduledStart, 'Start time')
        const end = toDate(body.scheduledEnd, 'End time')
        if (end <= start) throw new ValidationError('End time must be after start time')
        await CardioService.#assertNoLabOverlap(tid, body.lab, start, end)

        const row = await createWithNumber({
            model: 'cathLabProcedure',
            numberField: 'caseNumber',
            prefix: 'CATH',
            tenantId: tid,
            build: (caseNumber) => ({
                tenantId: tid,
                patientId: body.patientId,
                caseNumber,
                lab: body.lab,
                procedure: body.procedure,
                scheduledStart: start,
                scheduledEnd: end,
                interventionalist: body.interventionalist || null,
                scrubNurse: body.scrubNurse || null,
                radiologicTech: body.radiologicTech || null,
                accessSite: body.accessSite || null,
                contrastAgent: body.contrastAgent || null,
                urgency: body.urgency || 'ELECTIVE',
                status: 'SCHEDULED',
                createdBy: actorId || null,
            }),
        })
        await audit(tid, actorId, 'CATH_LAB_CASE_BOOKED', 'CathLabProcedure', row.id, {
            caseNumber: row.caseNumber,
            lab: row.lab,
        })
        return withPatient(row)
    }

    static async updateCathLab(id, body, tenantId, actorId) {
        const tid = await resolveTenantId(tenantId)
        const existing = await prisma.cathLabProcedure.findFirst({ where: { id, tenantId: tid } })
        if (!existing) throw new NotFoundError('Cath lab case not found')

        const { patientId, status, ...fields } = body
        const data = { ...fields }

        if (fields.scheduledStart || fields.scheduledEnd || fields.lab) {
            const start = fields.scheduledStart ? toDate(fields.scheduledStart, 'Start time') : existing.scheduledStart
            const end = fields.scheduledEnd ? toDate(fields.scheduledEnd, 'End time') : existing.scheduledEnd
            if (end <= start) throw new ValidationError('End time must be after start time')
            await CardioService.#assertNoLabOverlap(tid, fields.lab || existing.lab, start, end, id)
            data.scheduledStart = start
            data.scheduledEnd = end
        }

        if (status && status !== existing.status) {
            const allowed = {
                SCHEDULED: ['PRE_OP_PREP', 'IN_PROGRESS', 'CANCELLED'],
                PRE_OP_PREP: ['IN_PROGRESS', 'CANCELLED'],
                IN_PROGRESS: ['COMPLETED'],
                COMPLETED: [],
                CANCELLED: [],
            }
            if (!allowed[existing.status]?.includes(status)) {
                throw new ConflictError(`Cannot move a ${existing.status} case to ${status}`)
            }
            if (status === 'IN_PROGRESS') {
                const busy = await prisma.cathLabProcedure.findFirst({
                    where: { tenantId: tid, lab: data.lab || existing.lab, status: 'IN_PROGRESS', id: { not: id } },
                    select: { caseNumber: true },
                })
                if (busy) throw new ConflictError(`${existing.lab} already has a case in progress (${busy.caseNumber})`)
                data.startedAt = new Date()
            }
            if (status === 'COMPLETED') data.completedAt = new Date()
            data.status = status
        }

        const row = await prisma.cathLabProcedure.update({
            where: { id },
            data,
            include: { patient: { select: PATIENT_SELECT } },
        })
        await audit(tid, actorId, 'CATH_LAB_CASE_UPDATED', 'CathLabProcedure', id, { ...fields, status })
        return withPatient(row)
    }

    static async deleteCathLab(id, tenantId, actorId) {
        const tid = await resolveTenantId(tenantId)
        const existing = await prisma.cathLabProcedure.findFirst({ where: { id, tenantId: tid } })
        if (!existing) throw new NotFoundError('Cath lab case not found')
        await prisma.cathLabProcedure.delete({ where: { id } })
        await audit(tid, actorId, 'CATH_LAB_CASE_DELETED', 'CathLabProcedure', id, { caseNumber: existing.caseNumber })
        return { success: true, message: 'Cath lab case deleted' }
    }

    /* =======================================================================
     * CARDIAC RISK (ASCVD)
     * ===================================================================== */
    static previewRisk(input) {
        const problems = validateAscvdInputs(input)
        if (problems.length) throw new ValidationError(problems.join('; '), problems)
        const scorePercent = calculateAscvdRisk(input)
        const riskCategory = categorizeRisk(scorePercent)
        return {
            scorePercent,
            riskCategory,
            recommendation: buildRecommendation({ ...input, riskCategory }),
        }
    }

    static async listRisk({ tenantId, category, search, page, limit }) {
        const tid = await resolveTenantId(tenantId)
        const { page: p, limit: l, skip } = paging(page, limit)
        const where = { tenantId: tid, ...(category ? { riskCategory: category } : {}), ...patientSearch(search) }
        const [total, rows] = await Promise.all([
            prisma.cardiacRiskAssessment.count({ where }),
            prisma.cardiacRiskAssessment.findMany({
                where,
                skip,
                take: l,
                orderBy: { assessedAt: 'desc' },
                include: { patient: { select: PATIENT_SELECT } },
            }),
        ])
        return { data: rows.map(withPatient), pagination: { page: p, limit: l, total } }
    }

    static async createRisk(body, tenantId, actorId) {
        const tid = await resolveTenantId(tenantId)
        const patient = await assertPatient(tid, body.patientId)
        const calc = CardioService.previewRisk(body)
        const row = await prisma.cardiacRiskAssessment.create({
            data: {
                tenantId: tid,
                patientId: body.patientId,
                age: body.age,
                sex: body.sex,
                race: body.race || 'OTHER',
                sbp: body.sbp,
                totalCholesterol: body.totalCholesterol,
                hdl: body.hdl,
                ldl: body.ldl ?? null,
                diabetes: !!body.diabetes,
                smoker: !!body.smoker,
                onBpTreatment: !!body.onBpTreatment,
                onStatin: !!body.onStatin,
                onAspirin: !!body.onAspirin,
                cacScore: body.cacScore ?? null,
                scorePercent: calc.scorePercent,
                riskCategory: calc.riskCategory,
                // The cardiologist may overwrite the generated plan.
                recommendation: body.recommendation || calc.recommendation,
                physician: body.physician || null,
                createdBy: actorId || null,
            },
            include: { patient: { select: PATIENT_SELECT } },
        })
        await audit(tid, actorId, 'CARDIAC_RISK_ASSESSED', 'CardiacRiskAssessment', row.id, {
            patient: patient.fullName,
            scorePercent: calc.scorePercent,
            riskCategory: calc.riskCategory,
        })
        return withPatient(row)
    }

    static async deleteRisk(id, tenantId, actorId) {
        const tid = await resolveTenantId(tenantId)
        const existing = await prisma.cardiacRiskAssessment.findFirst({ where: { id, tenantId: tid } })
        if (!existing) throw new NotFoundError('Risk assessment not found')
        await prisma.cardiacRiskAssessment.delete({ where: { id } })
        await audit(tid, actorId, 'CARDIAC_RISK_DELETED', 'CardiacRiskAssessment', id, null)
        return { success: true, message: 'Risk assessment deleted' }
    }
}

export default CardioService
