import React, { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { api } from '../../../lib/api'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'

/**
 * Pick an existing patient (cardio records must belong to a registered patient).
 * Fetches from the real Patients module, so register patients there first.
 * onChange(patientId, patientObject) - the second argument lets forms pre-fill age / sex.
 */
export const PatientPicker = ({ value, onChange, error, label = 'Patient' }) => {
    const [search, setSearch] = useState('')
    const [debounced, setDebounced] = useState('')

    useEffect(() => {
        const t = setTimeout(() => setDebounced(search.trim()), 300)
        return () => clearTimeout(t)
    }, [search])

    const { data, isLoading } = useQuery({
        queryKey: ['cardio', 'patient-picker', debounced],
        queryFn: async () => {
            const res = await api.get('/api/staff/patients', { params: { limit: 50, search: debounced || undefined } })
            return res.data?.data || res.data?.patients || []
        },
        staleTime: 30 * 1000,
        retry: false,
    })

    const patients = Array.isArray(data) ? data : []

    return (
        <div className="space-y-2">
            <Input
                label={`${label} search`}
                placeholder="Type name or MRN to filter"
                leftIcon={<Search className="w-4 h-4" />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
            <Select
                label={label}
                required
                value={value || ''}
                onChange={(e) => onChange(e.target.value, patients.find((p) => p.id === e.target.value) || null)}
                error={error}
                helperText={
                    !isLoading && patients.length === 0
                        ? 'No patients found. Register the patient in the Patients module first.'
                        : undefined
                }
            >
                <option value="">{isLoading ? 'Loading patients...' : 'Select a patient'}</option>
                {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                        {(p.fullName || p.name) + (p.mrn ? ` (${p.mrn})` : '')}
                    </option>
                ))}
            </Select>
        </div>
    )
}

export default PatientPicker
