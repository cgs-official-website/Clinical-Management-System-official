import { prisma } from '../config/prisma.js'
import { NotFoundError, BadRequestError } from '../utils/errors.js'
import { ClinicalService } from './clinical.service.js'

/**
 * Dental Care services: tooth chart, treatment plans, X-ray records, lab orders.
 * Every query is scoped by tenantId so one clinic can never see another clinic's data.
 */

// Same tenant-resolution rule used by ClinicalService (demo tenants named "clinic-*")
const resolveTenantId = async (tenantId) => {
    if (tenantId && tenantId.startsWith('clinic-')) {
        const firstTenant = await prisma.tenant.findFirst({ select: { id: true } })
        if (firstTenant) return firstTenant.id
    }
    return tenantId
}

const assertPatient = async (patientId, tenantId) => {
    const patient = await prisma.patient.findFirst({
        where: { id: patientId, tenantId },
        select: { id: true, fullName: true, mrn: true },
    })
    if (!patient) throw new NotFoundError('Patient not found')
    return patient
}

export class DentalService {
    /* =========================================================================
     * DENTAL CHART
     * ========================================================================= */
    static async getChart(rawTenantId, patientId) {
        const tenantId = await resolveTenantId(rawTenantId)
        const patient = await assertPatient(patientId, tenantId)
        const teeth = await prisma.toothRecord.findMany({
            where: { tenantId, patientId },
            orderBy: { toothNo: 'asc' },
        })
        return { patient, teeth }
    }

    /**
     * Bulk upsert of the teeth the clinician touched.
     * teeth: [{ toothNo, status, surfaces, notes, probingDepths }]
     */
    static async saveChart(rawTenantId, patientId, teeth, actorId) {
        const tenantId = await resolveTenantId(rawTenantId)
        await assertPatient(patientId, tenantId)

        await prisma.$transaction(
            teeth.map((t) =>
                prisma.toothRecord.upsert({
                    where: { patientId_toothNo: { patientId, toothNo: t.toothNo } },
                    create: {
                        tenantId,
                        patientId,
                        toothNo: t.toothNo,
                        status: t.status,
                        surfaces: t.surfaces || [],
                        notes: t.notes || null,
                        probingDepths: t.probingDepths || null,
                        updatedBy: actorId || null,
                    },
                    update: {
                        status: t.status,
                        surfaces: t.surfaces || [],
                        notes: t.notes || null,
                        probingDepths: t.probingDepths || null,
                        updatedBy: actorId || null,
                    },
                })
            )
        )
        return this.getChart(tenantId, patientId)
    }

    static async resetChart(rawTenantId, patientId) {
        const tenantId = await resolveTenantId(rawTenantId)
        await assertPatient(patientId, tenantId)
        const result = await prisma.toothRecord.deleteMany({ where: { tenantId, patientId } })
        return { deleted: result.count }
    }

    /* =========================================================================
     * TREATMENT PLANS
     * ========================================================================= */
    static async listPlans(rawTenantId, patientId) {
        const tenantId = await resolveTenantId(rawTenantId)
        return prisma.treatmentPlan.findMany({
            where: { tenantId, ...(patientId ? { patientId } : {}) },
            include: {
                items: { orderBy: [{ phase: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }] },
                patient: { select: { id: true, fullName: true, mrn: true } },
            },
            orderBy: { createdAt: 'desc' },
        })
    }

    static async createPlan(rawTenantId, { patientId, name, items = [] }, actorId) {
        const tenantId = await resolveTenantId(rawTenantId)
        await assertPatient(patientId, tenantId)
        return prisma.treatmentPlan.create({
            data: {
                tenantId,
                patientId,
                name,
                createdBy: actorId || null,
                items: {
                    create: items.map((it, idx) => ({ ...it, sortOrder: idx })),
                },
            },
            include: { items: true },
        })
    }

    static async getPlanOrThrow(tenantId, planId) {
        const plan = await prisma.treatmentPlan.findFirst({ where: { id: planId, tenantId } })
        if (!plan) throw new NotFoundError('Treatment plan not found')
        return plan
    }

    static async updatePlan(rawTenantId, planId, data) {
        const tenantId = await resolveTenantId(rawTenantId)
        await this.getPlanOrThrow(tenantId, planId)
        return prisma.treatmentPlan.update({
            where: { id: planId },
            data,
            include: { items: true },
        })
    }

    static async deletePlan(rawTenantId, planId) {
        const tenantId = await resolveTenantId(rawTenantId)
        await this.getPlanOrThrow(tenantId, planId)
        await prisma.treatmentPlan.delete({ where: { id: planId } })
        return { deleted: true }
    }

    static async addPlanItem(rawTenantId, planId, item) {
        const tenantId = await resolveTenantId(rawTenantId)
        await this.getPlanOrThrow(tenantId, planId)
        const count = await prisma.treatmentPlanItem.count({ where: { planId } })
        return prisma.treatmentPlanItem.create({ data: { ...item, planId, sortOrder: count } })
    }

    static async updatePlanItem(rawTenantId, planId, itemId, data) {
        const tenantId = await resolveTenantId(rawTenantId)
        await this.getPlanOrThrow(tenantId, planId)
        const existing = await prisma.treatmentPlanItem.findFirst({ where: { id: itemId, planId } })
        if (!existing) throw new NotFoundError('Treatment plan item not found')
        return prisma.treatmentPlanItem.update({ where: { id: itemId }, data })
    }

    static async deletePlanItem(rawTenantId, planId, itemId) {
        const tenantId = await resolveTenantId(rawTenantId)
        await this.getPlanOrThrow(tenantId, planId)
        const existing = await prisma.treatmentPlanItem.findFirst({ where: { id: itemId, planId } })
        if (!existing) throw new NotFoundError('Treatment plan item not found')
        await prisma.treatmentPlanItem.delete({ where: { id: itemId } })
        return { deleted: true }
    }

    /**
     * Chart -> plan: add a procedure for a tooth to the patient's active plan
     * (creates a default plan if the patient has none yet).
     */
    static async addToActivePlan(rawTenantId, { patientId, item }, actorId) {
        const tenantId = await resolveTenantId(rawTenantId)
        await assertPatient(patientId, tenantId)
        let plan = await prisma.treatmentPlan.findFirst({
            where: { tenantId, patientId, status: { in: ['DRAFT', 'ACTIVE'] } },
            orderBy: { createdAt: 'desc' },
        })
        if (!plan) {
            plan = await prisma.treatmentPlan.create({
                data: { tenantId, patientId, name: 'Treatment Plan', createdBy: actorId || null },
            })
        }
        const count = await prisma.treatmentPlanItem.count({ where: { planId: plan.id } })
        const created = await prisma.treatmentPlanItem.create({
            data: { ...item, planId: plan.id, sortOrder: count },
        })
        return { plan, item: created }
    }

    /**
     * Plan -> billing: turn the plan's non-cancelled items into one Invoice.
     * Reuses ClinicalService.createInvoice so numbering/tenant rules stay identical.
     */
    static async invoicePlan(rawTenantId, planId, actorId) {
        const tenantId = await resolveTenantId(rawTenantId)
        const plan = await prisma.treatmentPlan.findFirst({
            where: { id: planId, tenantId },
            include: { items: true },
        })
        if (!plan) throw new NotFoundError('Treatment plan not found')
        if (plan.invoiceId) throw new BadRequestError('An invoice was already generated for this plan')
        if (!plan.items.length) throw new BadRequestError('Add at least one procedure before invoicing')

        const insurance = plan.items.reduce((s, i) => s + (i.insuranceCoverage || 0), 0)
        const invoice = await ClinicalService.createInvoice(
            {
                patientId: plan.patientId,
                insuranceCoverage: insurance,
                items: plan.items.map((i) => ({
                    description: `${i.description}${i.toothNo ? ` (Tooth ${i.toothNo})` : ''}`,
                    code: i.code || undefined,
                    fee: i.fee,
                })),
            },
            tenantId,
            actorId
        )
        const invoiceId = invoice?.id || invoice?.data?.id || invoice?.invoice?.id
        if (invoiceId) {
            await prisma.treatmentPlan.update({ where: { id: planId }, data: { invoiceId } })
        }
        return { invoice, invoiceId }
    }

    /* =========================================================================
     * X-RAY RECORDS
     * ========================================================================= */
    static async listXrays(rawTenantId, patientId) {
        const tenantId = await resolveTenantId(rawTenantId)
        return prisma.xrayRecord.findMany({
            where: { tenantId, ...(patientId ? { patientId } : {}) },
            include: { patient: { select: { id: true, fullName: true, mrn: true } } },
            orderBy: { takenAt: 'desc' },
        })
    }

    static async createXray(rawTenantId, data, actorId) {
        const tenantId = await resolveTenantId(rawTenantId)
        await assertPatient(data.patientId, tenantId)
        return prisma.xrayRecord.create({
            data: {
                ...data,
                takenAt: data.takenAt ? new Date(data.takenAt) : new Date(),
                tenantId,
                createdBy: actorId || null,
            },
        })
    }

    static async updateXray(rawTenantId, id, data) {
        const tenantId = await resolveTenantId(rawTenantId)
        const existing = await prisma.xrayRecord.findFirst({ where: { id, tenantId } })
        if (!existing) throw new NotFoundError('X-ray record not found')
        return prisma.xrayRecord.update({
            where: { id },
            data: { ...data, ...(data.takenAt ? { takenAt: new Date(data.takenAt) } : {}) },
        })
    }

    static async deleteXray(rawTenantId, id) {
        const tenantId = await resolveTenantId(rawTenantId)
        const existing = await prisma.xrayRecord.findFirst({ where: { id, tenantId } })
        if (!existing) throw new NotFoundError('X-ray record not found')
        await prisma.xrayRecord.delete({ where: { id } })
        return { deleted: true }
    }

    /* =========================================================================
     * LAB ORDERS
     * ========================================================================= */
    static async listLabOrders(rawTenantId, patientId) {
        const tenantId = await resolveTenantId(rawTenantId)
        return prisma.labOrder.findMany({
            where: { tenantId, ...(patientId ? { patientId } : {}) },
            include: { patient: { select: { id: true, fullName: true, mrn: true } } },
            orderBy: { createdAt: 'desc' },
        })
    }

    static async createLabOrder(rawTenantId, data, actorId) {
        const tenantId = await resolveTenantId(rawTenantId)
        await assertPatient(data.patientId, tenantId)

        const year = new Date().getFullYear()
        const count = await prisma.labOrder.count({ where: { tenantId } })
        let seq = count + 1
        let orderNo = `LAB-${year}-${String(seq).padStart(4, '0')}`
        // guarantee uniqueness inside the tenant
        while (await prisma.labOrder.findFirst({ where: { tenantId, orderNo }, select: { id: true } })) {
            seq++
            orderNo = `LAB-${year}-${String(seq).padStart(4, '0')}`
        }

        return prisma.labOrder.create({
            data: {
                ...data,
                dueDate: data.dueDate ? new Date(data.dueDate) : null,
                tenantId,
                orderNo,
                createdBy: actorId || null,
            },
        })
    }

    static async updateLabOrder(rawTenantId, id, data) {
        const tenantId = await resolveTenantId(rawTenantId)
        const existing = await prisma.labOrder.findFirst({ where: { id, tenantId } })
        if (!existing) throw new NotFoundError('Lab order not found')
        return prisma.labOrder.update({
            where: { id },
            data: { ...data, ...(data.dueDate ? { dueDate: new Date(data.dueDate) } : {}) },
        })
    }

    static async deleteLabOrder(rawTenantId, id) {
        const tenantId = await resolveTenantId(rawTenantId)
        const existing = await prisma.labOrder.findFirst({ where: { id, tenantId } })
        if (!existing) throw new NotFoundError('Lab order not found')
        await prisma.labOrder.delete({ where: { id } })
        return { deleted: true }
    }
}
