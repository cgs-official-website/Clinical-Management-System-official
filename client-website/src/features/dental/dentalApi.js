import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { api } from '../../lib/api'
import { notify } from '../../components/ui/Toast'

const unwrap = (res) => res.data?.data ?? res.data
export const errMsg = (err) =>
    err?.response?.data?.error?.message || err?.response?.data?.message || err?.message || 'Something went wrong'

/** Selected patient lives in the URL (?patient=ID) so it survives page switches. */
export const usePatientParam = () => {
    const [params, setParams] = useSearchParams()
    const patientId = params.get('patient') || ''
    const setPatientId = (id) => {
        const next = new URLSearchParams(params)
        if (id) next.set('patient', id)
        else next.delete('patient')
        setParams(next, { replace: true })
    }
    return [patientId, setPatientId]
}

export const usePatientList = () =>
    useQuery({
        queryKey: ['dental', 'patients'],
        queryFn: async () => {
            const res = await api.get('/api/staff/patients', { params: { limit: 200 } })
            const list = res.data?.data || res.data?.patients || res.data || []
            return Array.isArray(list) ? list : []
        },
        staleTime: 60 * 1000,
    })

const useDentalMutation = (fn, { invalidate = [], success } = {}) => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: fn,
        onSuccess: (data) => {
            invalidate.forEach((key) => qc.invalidateQueries({ queryKey: key }))
            if (success) notify.success(typeof success === 'function' ? success(data) : success)
        },
        onError: (err) => notify.error(errMsg(err)),
    })
}

/* ------------------------------- Dental chart ------------------------------ */
export const useChart = (patientId) =>
    useQuery({
        queryKey: ['dental', 'chart', patientId],
        enabled: !!patientId,
        queryFn: async () => unwrap(await api.get(`/api/dental/chart/${patientId}`)),
    })

export const useSaveChart = (patientId) =>
    useDentalMutation(
        async (teeth) => unwrap(await api.put(`/api/dental/chart/${patientId}`, { teeth })),
        { invalidate: [['dental', 'chart', patientId]], success: 'Findings saved to patient chart.' }
    )

export const useResetChart = (patientId) =>
    useDentalMutation(async () => unwrap(await api.delete(`/api/dental/chart/${patientId}`)), {
        invalidate: [['dental', 'chart', patientId]],
        success: 'Chart reset.',
    })

/* ----------------------------- Treatment plans ----------------------------- */
const PLANS = [['dental', 'plans']]

export const usePlans = (patientId) =>
    useQuery({
        queryKey: ['dental', 'plans', patientId || 'all'],
        queryFn: async () =>
            unwrap(await api.get('/api/dental/treatment-plans', { params: patientId ? { patientId } : {} })),
    })

export const useCreatePlan = () =>
    useDentalMutation(async (body) => unwrap(await api.post('/api/dental/treatment-plans', body)), {
        invalidate: PLANS,
        success: 'Treatment plan created.',
    })

export const useUpdatePlan = () =>
    useDentalMutation(
        async ({ id, ...body }) => unwrap(await api.patch(`/api/dental/treatment-plans/${id}`, body)),
        { invalidate: PLANS }
    )

export const useDeletePlan = () =>
    useDentalMutation(async (id) => unwrap(await api.delete(`/api/dental/treatment-plans/${id}`)), {
        invalidate: PLANS,
        success: 'Treatment plan deleted.',
    })

export const useAddPlanItem = () =>
    useDentalMutation(
        async ({ planId, ...body }) => unwrap(await api.post(`/api/dental/treatment-plans/${planId}/items`, body)),
        { invalidate: PLANS, success: 'Procedure added.' }
    )

export const useUpdatePlanItem = () =>
    useDentalMutation(
        async ({ planId, itemId, ...body }) =>
            unwrap(await api.patch(`/api/dental/treatment-plans/${planId}/items/${itemId}`, body)),
        { invalidate: PLANS }
    )

export const useDeletePlanItem = () =>
    useDentalMutation(
        async ({ planId, itemId }) => unwrap(await api.delete(`/api/dental/treatment-plans/${planId}/items/${itemId}`)),
        { invalidate: PLANS, success: 'Procedure removed.' }
    )

/** Chart -> plan: adds one procedure to the patient's active plan (creates it if missing). */
export const useAddToPlan = () =>
    useDentalMutation(async (body) => unwrap(await api.post('/api/dental/treatment-plans/add-item', body)), {
        invalidate: PLANS,
        success: 'Procedure added to treatment plan.',
    })

/** Plan -> billing */
export const useInvoicePlan = () =>
    useDentalMutation(async (id) => unwrap(await api.post(`/api/dental/treatment-plans/${id}/invoice`)), {
        invalidate: [...PLANS, ['staff', 'billing'], ['staff', 'invoices']],
        success: 'Invoice generated. Open Billing to collect payment.',
    })

/* --------------------------------- X-rays ---------------------------------- */
const XRAYS = [['dental', 'xrays']]

export const useXrays = (patientId) =>
    useQuery({
        queryKey: ['dental', 'xrays', patientId || 'all'],
        queryFn: async () => unwrap(await api.get('/api/dental/xrays', { params: patientId ? { patientId } : {} })),
    })

export const useCreateXray = () =>
    useDentalMutation(async (body) => unwrap(await api.post('/api/dental/xrays', body)), {
        invalidate: XRAYS,
        success: 'X-ray record added.',
    })

export const useUpdateXray = () =>
    useDentalMutation(async ({ id, ...body }) => unwrap(await api.patch(`/api/dental/xrays/${id}`, body)), {
        invalidate: XRAYS,
        success: 'X-ray record updated.',
    })

export const useDeleteXray = () =>
    useDentalMutation(async (id) => unwrap(await api.delete(`/api/dental/xrays/${id}`)), {
        invalidate: XRAYS,
        success: 'X-ray record deleted.',
    })

/* ------------------------------- Lab orders -------------------------------- */
const LABS = [['dental', 'lab-orders']]

export const useLabOrders = (patientId) =>
    useQuery({
        queryKey: ['dental', 'lab-orders', patientId || 'all'],
        queryFn: async () =>
            unwrap(await api.get('/api/dental/lab-orders', { params: patientId ? { patientId } : {} })),
    })

export const useCreateLabOrder = () =>
    useDentalMutation(async (body) => unwrap(await api.post('/api/dental/lab-orders', body)), {
        invalidate: LABS,
        success: 'Lab order created.',
    })

export const useUpdateLabOrder = () =>
    useDentalMutation(async ({ id, ...body }) => unwrap(await api.patch(`/api/dental/lab-orders/${id}`, body)), {
        invalidate: LABS,
    })

export const useDeleteLabOrder = () =>
    useDentalMutation(async (id) => unwrap(await api.delete(`/api/dental/lab-orders/${id}`)), {
        invalidate: LABS,
        success: 'Lab order deleted.',
    })
