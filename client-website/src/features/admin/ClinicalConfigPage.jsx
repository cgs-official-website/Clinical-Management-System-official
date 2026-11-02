import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Sliders, Clock, Plus, Save, Building } from 'lucide-react'
import { api } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { notify } from '../../components/ui/Toast'

const DEFAULT_CONFIG = {
  operatingHours: [
    { day: 'Monday', opens: '08:00', closes: '18:00', isClosed: false },
    { day: 'Tuesday', opens: '08:00', closes: '18:00', isClosed: false },
    { day: 'Wednesday', opens: '08:00', closes: '18:00', isClosed: false },
    { day: 'Thursday', opens: '08:00', closes: '18:00', isClosed: false },
    { day: 'Friday', opens: '08:00', closes: '17:00', isClosed: false },
    { day: 'Saturday', opens: '09:00', closes: '14:00', isClosed: false },
    { day: 'Sunday', opens: '09:00', closes: '13:00', isClosed: true },
  ],
  slotDurationMinutes: 30,
  bufferBetweenSlotsMinutes: 5,
  allowTelehealth: true,
  departments: [
    'Cardiology',
    'Diagnostic Medicine',
    'Emergency & Critical Care',
    'Pediatrics',
    'Orthopedics',
    'Neurology',
    'Outpatient Services',
    'Radiology',
  ],
  specialties: [
    'Interventional Cardiologist',
    'Head of Diagnostics',
    'Charge Nurse BSN, RN',
    'Senior Medical Biller',
    'Pediatric Intensivist',
    'Orthopedic Surgeon',
    'Lead Patient Coordinator',
  ],
}

const normalizeOperatingHours = (hours) => {
  if (Array.isArray(hours) && hours.length > 0) {
    return hours.map((h, i) => ({
      day: h.day || DEFAULT_CONFIG.operatingHours[i]?.day || 'Day',
      opens: h.opens || '08:00',
      closes: h.closes || '18:00',
      isClosed: Boolean(h.isClosed)
    }))
  }
  return DEFAULT_CONFIG.operatingHours
}

export const ClinicalConfigPage = () => {
  const queryClient = useQueryClient()
  const [config, setConfig] = useState(DEFAULT_CONFIG)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'clinical-config'],
    queryFn: async () => {
      try {
        const res = await api.get('/api/admin/clinical-config')
        return res.data?.data || res.data
      } catch (err) {
        console.warn('Using default clinical configuration due to network/endpoint fallback:', err.message)
        return DEFAULT_CONFIG
      }
    },
    staleTime: 30000,
  })

  useEffect(() => {
    if (data) {
      setConfig({
        ...DEFAULT_CONFIG,
        ...data,
        operatingHours: normalizeOperatingHours(data.operatingHours),
        departments: Array.isArray(data.departments) ? data.departments : DEFAULT_CONFIG.departments,
        specialties: Array.isArray(data.specialties) ? data.specialties : DEFAULT_CONFIG.specialties,
      })
    }
  }, [data])

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.put('/api/admin/clinical-config', payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'clinical-config'] })
      notify.success('Clinic scheduling rules and specialties updated!')
    },
    onError: () => notify.error('Failed to save clinical configuration.'),
  })

  const updateOperatingHour = (index, field, value) => {
    setConfig((prev) => {
      const currentHours = Array.isArray(prev.operatingHours) ? prev.operatingHours : DEFAULT_CONFIG.operatingHours
      const updated = [...currentHours]
      if (updated[index]) {
        updated[index] = { ...updated[index], [field]: value }
      }
      return { ...prev, operatingHours: updated }
    })
  }

  if (isLoading && !config) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl text-text-primary">
            Clinic Operational Configuration
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Booking slot rules and facility hours
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => saveMutation.mutate(config)}
          isLoading={saveMutation.isPending}
          leftIcon={<Save className="w-4 h-4" />}
        >
          Save Configuration
        </Button>
      </div>

      {/* Appointment Slot Rules */}
      <div className="p-6 rounded-2xl border border-border bg-surface shadow-soft space-y-4">
        <h3 className="font-heading font-bold text-base text-text-primary border-b border-border pb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Appointment Slot & Buffer Constraints
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Default Slot Duration (Minutes)"
            type="number"
            value={config.slotDurationMinutes}
            onChange={(e) =>
              setConfig({ ...config, slotDurationMinutes: parseInt(e.target.value) || 15 })
            }
          />
          <Input
            label="Buffer Between Patients (Minutes)"
            type="number"
            value={config.bufferBetweenSlotsMinutes}
            onChange={(e) =>
              setConfig({ ...config, bufferBetweenSlotsMinutes: parseInt(e.target.value) || 0 })
            }
          />
        </div>
      </div>

      {/* Operating Hours Grid */}
      <div className="p-6 rounded-2xl border border-border bg-surface shadow-soft space-y-4">
        <h3 className="font-heading font-bold text-base text-text-primary border-b border-border pb-3 flex items-center gap-2">
          <Building className="w-4 h-4 text-primary" />
          Weekly Clinic Operating Hours
        </h3>

        <div className="space-y-2.5">
          {(Array.isArray(config.operatingHours) ? config.operatingHours : DEFAULT_CONFIG.operatingHours).map((slot, idx) => (
            <div
              key={slot.day || idx}
              className="p-3 rounded-xl border border-border bg-surface/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <span className="font-bold text-text-primary w-28">{slot.day}</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-text-secondary">Open:</span>
                  <input
                    type="time"
                    disabled={slot.isClosed}
                    value={slot.opens}
                    onChange={(e) => updateOperatingHour(idx, 'opens', e.target.value)}
                    className="px-2 py-1 rounded-lg border border-border bg-surface text-text-primary disabled:opacity-30"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-text-secondary">Close:</span>
                  <input
                    type="time"
                    disabled={slot.isClosed}
                    value={slot.closes}
                    onChange={(e) => updateOperatingHour(idx, 'closes', e.target.value)}
                    className="px-2 py-1 rounded-lg border border-border bg-surface text-text-primary disabled:opacity-30"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={slot.isClosed}
                  onChange={(e) => updateOperatingHour(idx, 'isClosed', e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary/30"
                />
                <span className="text-text-secondary font-medium">Facility Closed</span>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ClinicalConfigPage
