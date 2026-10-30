import { DentalService } from '../services/dental.service.js'

const tenantOf = (req) => req.user.tenantId
const actorOf = (req) => req.user?.id

// Small wrapper: run service call, send { success, data }
const handle = (fn, status = 200) => async (req, res, next) => {
    try {
        const data = await fn(req)
        return res.status(status).json({ success: true, data })
    } catch (error) {
        next(error)
    }
}

export class DentalController {
    // Dental chart
    static getChart = handle((req) => DentalService.getChart(tenantOf(req), req.params.patientId))
    static saveChart = handle((req) =>
        DentalService.saveChart(tenantOf(req), req.params.patientId, req.body.teeth, actorOf(req))
    )
    static resetChart = handle((req) => DentalService.resetChart(tenantOf(req), req.params.patientId))

    // Treatment plans
    static listPlans = handle((req) => DentalService.listPlans(tenantOf(req), req.query.patientId))
    static createPlan = handle((req) => DentalService.createPlan(tenantOf(req), req.body, actorOf(req)), 201)
    static updatePlan = handle((req) => DentalService.updatePlan(tenantOf(req), req.params.id, req.body))
    static deletePlan = handle((req) => DentalService.deletePlan(tenantOf(req), req.params.id))
    static addPlanItem = handle((req) => DentalService.addPlanItem(tenantOf(req), req.params.id, req.body), 201)
    static updatePlanItem = handle((req) =>
        DentalService.updatePlanItem(tenantOf(req), req.params.id, req.params.itemId, req.body)
    )
    static deletePlanItem = handle((req) =>
        DentalService.deletePlanItem(tenantOf(req), req.params.id, req.params.itemId)
    )
    static addToActivePlan = handle((req) => DentalService.addToActivePlan(tenantOf(req), req.body, actorOf(req)), 201)
    static invoicePlan = handle((req) => DentalService.invoicePlan(tenantOf(req), req.params.id, actorOf(req)), 201)

    // X-rays
    static listXrays = handle((req) => DentalService.listXrays(tenantOf(req), req.query.patientId))
    static createXray = handle((req) => DentalService.createXray(tenantOf(req), req.body, actorOf(req)), 201)
    static updateXray = handle((req) => DentalService.updateXray(tenantOf(req), req.params.id, req.body))
    static deleteXray = handle((req) => DentalService.deleteXray(tenantOf(req), req.params.id))

    // Lab orders
    static listLabOrders = handle((req) => DentalService.listLabOrders(tenantOf(req), req.query.patientId))
    static createLabOrder = handle((req) => DentalService.createLabOrder(tenantOf(req), req.body, actorOf(req)), 201)
    static updateLabOrder = handle((req) => DentalService.updateLabOrder(tenantOf(req), req.params.id, req.body))
    static deleteLabOrder = handle((req) => DentalService.deleteLabOrder(tenantOf(req), req.params.id))
}
