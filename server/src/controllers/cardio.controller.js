import { CardioService } from '../services/cardio.service.js'

const ok = (res, status, payload) => res.status(status).json({ success: true, ...payload })

const wrap = (fn) => async (req, res, next) => {
    try {
        await fn(req, res)
    } catch (error) {
        next(error)
    }
}

const ctx = (req) => ({ tenantId: req.user.tenantId, actorId: req.user.id })
const signerName = (req) => req.user.fullName || req.user.name || null

export class CardioController {
    /* ECG */
    static listEcg = wrap(async (req, res) => {
        const result = await CardioService.listEcg({ tenantId: req.user.tenantId, ...req.query })
        ok(res, 200, result)
    })
    static createEcg = wrap(async (req, res) => {
        const { tenantId, actorId } = ctx(req)
        ok(res, 201, { message: 'ECG recorded', data: await CardioService.createEcg(req.body, tenantId, actorId) })
    })
    static updateEcg = wrap(async (req, res) => {
        const { tenantId, actorId } = ctx(req)
        ok(res, 200, { data: await CardioService.updateEcg(req.params.id, req.body, tenantId, actorId) })
    })
    static signOffEcg = wrap(async (req, res) => {
        const { tenantId, actorId } = ctx(req)
        ok(res, 200, {
            message: 'ECG verified and signed off',
            data: await CardioService.signOffEcg(req.params.id, tenantId, actorId, signerName(req)),
        })
    })
    static deleteEcg = wrap(async (req, res) => {
        const { tenantId, actorId } = ctx(req)
        res.status(200).json(await CardioService.deleteEcg(req.params.id, tenantId, actorId))
    })

    /* Echo */
    static listEcho = wrap(async (req, res) => {
        ok(res, 200, await CardioService.listEcho({ tenantId: req.user.tenantId, ...req.query }))
    })
    static createEcho = wrap(async (req, res) => {
        const { tenantId, actorId } = ctx(req)
        ok(res, 201, { message: 'Echo report saved as draft', data: await CardioService.createEcho(req.body, tenantId, actorId) })
    })
    static updateEcho = wrap(async (req, res) => {
        const { tenantId, actorId } = ctx(req)
        ok(res, 200, { data: await CardioService.updateEcho(req.params.id, req.body, tenantId, actorId) })
    })
    static finalizeEcho = wrap(async (req, res) => {
        const { tenantId, actorId } = ctx(req)
        ok(res, 200, {
            message: 'Echo report finalized',
            data: await CardioService.finalizeEcho(req.params.id, tenantId, actorId, signerName(req)),
        })
    })
    static deleteEcho = wrap(async (req, res) => {
        const { tenantId, actorId } = ctx(req)
        res.status(200).json(await CardioService.deleteEcho(req.params.id, tenantId, actorId))
    })

    /* Cath lab */
    static listCathLab = wrap(async (req, res) => {
        ok(res, 200, await CardioService.listCathLab({ tenantId: req.user.tenantId, ...req.query }))
    })
    static createCathLab = wrap(async (req, res) => {
        const { tenantId, actorId } = ctx(req)
        ok(res, 201, { message: 'Cath lab case booked', data: await CardioService.createCathLab(req.body, tenantId, actorId) })
    })
    static updateCathLab = wrap(async (req, res) => {
        const { tenantId, actorId } = ctx(req)
        ok(res, 200, { data: await CardioService.updateCathLab(req.params.id, req.body, tenantId, actorId) })
    })
    static deleteCathLab = wrap(async (req, res) => {
        const { tenantId, actorId } = ctx(req)
        res.status(200).json(await CardioService.deleteCathLab(req.params.id, tenantId, actorId))
    })

    /* Risk */
    static calculateRisk = wrap(async (req, res) => {
        ok(res, 200, { data: CardioService.previewRisk(req.body) })
    })
    static listRisk = wrap(async (req, res) => {
        ok(res, 200, await CardioService.listRisk({ tenantId: req.user.tenantId, ...req.query }))
    })
    static createRisk = wrap(async (req, res) => {
        const { tenantId, actorId } = ctx(req)
        ok(res, 201, { message: 'Risk assessment saved', data: await CardioService.createRisk(req.body, tenantId, actorId) })
    })
    static deleteRisk = wrap(async (req, res) => {
        const { tenantId, actorId } = ctx(req)
        res.status(200).json(await CardioService.deleteRisk(req.params.id, tenantId, actorId))
    })
}

export default CardioController
