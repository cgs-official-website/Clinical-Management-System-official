import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { notify } from '../../components/ui/Toast'
import { usePermissions } from '../../hooks/usePermissions'

const BASE = '/api/staff/cardio'

/** Turns an axios error into a readable message (handles zod detail lists). */
export const errorMessage = (err, fallback = 'Something went wrong') => {
    const e = err?.response?.data?.error
    const details = Array.isArray(e?.details) ? e.details.map((d) => d.message || d).join('; ') : ''
    return details || e?.message || err?.response?.data?.message || err?.message || fallback
}

/** List query. `resource` is the path after /cardio, e.g. 'ecg-records'. */
export const useCardioList = (resource, params = {}) =>
    useQuery({
        queryKey: ['cardio', resource, params],
        queryFn: async () => {
            const res = await api.get(`${BASE}/${resource}`, { params })
            return res.data
        },
        staleTime: 15 * 1000,
        placeholderData: (prev) => prev,
        retry: false,
    })

/**
 * Mutation that invalidates the resource list afterwards.
 * run: (payload) => Promise<axiosResponse>
 */
export const useCardioMutation = (resource, run, { success, onSuccess } = {}) => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (payload) => (await run(payload)).data,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['cardio', resource] })
            if (success) notify.success(success)
            onSuccess?.(data)
        },
        onError: (err) => notify.error(errorMessage(err)),
    })
}

export const cardioHttp = {
    post: (path, body) => api.post(`${BASE}/${path}`, body),
    patch: (path, body) => api.patch(`${BASE}/${path}`, body),
    del: (path) => api.delete(`${BASE}/${path}`),
}

/** Create / edit / delete flags for one RBAC module key. */
export const useCardioAccess = (moduleKey) => {
    const { hasPermission, isAdmin, isSuperadmin } = usePermissions()
    const all = isAdmin || isSuperadmin
    return {
        canCreate: all || hasPermission(`${moduleKey}.create`),
        canEdit: all || hasPermission(`${moduleKey}.edit`),
        canDelete: all || hasPermission(`${moduleKey}.delete`),
    }
}

export const fmtDateTime = (iso) => {
    if (!iso) return '-'
    const d = new Date(iso)
    return Number.isNaN(d.getTime())
        ? '-'
        : d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export const fmtDate = (iso) => {
    if (!iso) return '-'
    const d = new Date(iso)
    return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const fmtTime = (iso) => {
    if (!iso) return '-'
    const d = new Date(iso)
    return Number.isNaN(d.getTime()) ? '-' : d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

/** Value for <input type="datetime-local"> (local time, no timezone suffix). */
export const toLocalInput = (date = new Date()) => {
    const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    return d.toISOString().slice(0, 16)
}

/** '' -> undefined, otherwise Number. Used for optional numeric form fields. */
export const num = (v) => (v === '' || v === null || v === undefined ? undefined : Number(v))
