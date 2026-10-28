import React, { useState, lazy, Suspense } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar as CalendarIcon, Clock, Plus, Video, MapPin, User, ChevronLeft, ChevronRight, Activity, Stethoscope, Hash } from 'lucide-react'
import { api } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { notify } from '../../components/ui/Toast'
import { Skeleton } from '../../components/ui/Skeleton'
import { useAuthStore } from '../../store/useAuthStore'
import { PermissionAction } from '../../components/common/PermissionAction'

// Lazy load dialog modals on demand
const PatientDetailsTriageModal = lazy(() =>
  import('./components/PatientDetailsTriageModal').then((m) => ({ default: m.PatientDetailsTriageModal }))
)
const DoctorVitalsReportModal = lazy(() =>
  import('./components/DoctorVitalsReportModal').then((m) => ({ default: m.DoctorVitalsReportModal }))
)

export const AppointmentsPage = () => {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [viewMode, setViewMode] = useState('Day')
  const [isBookOpen, setIsBookOpen] = useState(false)
  const [isTriageOpen, setIsTriageOpen] = useState(false)
  const [selectedDoctorApt, setSelectedDoctorApt] = useState(null)

  const [formData, setFormData] = useState({
    patientName: '',
    patientPhone: '',
    doctorName: user?.name || user?.fullName || 'Attending Clinician',
    department: 'Cardiology',
    dateTime: new Date().toISOString().slice(0, 16),
    durationMinutes: 30,
    type: 'In-Person Consultation',
    reason: '',
    room: 'Exam Room 3B',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['staff', 'appointments'],
    queryFn: async () => {
      const res = await api.get('/api/staff/appointments')
      return res.data
    },
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  })

  const { data: triageData } = useQuery({
    queryKey: ['staff', 'triage'],
    queryFn: async () => {
      const res = await api.get('/api/staff/triage')
      return res.data?.data || []
    },
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  })

  const { data: patientsData } = useQuery({
    queryKey: ['staff', 'patients'],
    queryFn: async () => {
      const res = await api.get('/api/staff/patients')
      return res.data?.patients || res.data?.data || []
    },
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  })

  // Fetch real clinical doctors for this clinic
  const { data: doctorsData = [] } = useQuery({
    queryKey: ['staff', 'doctors'],
    queryFn: async () => {
      try {
        const res = await api.get('/api/staff/doctors')
        const list = res.data?.doctors || res.data?.data || []
        if (Array.isArray(list) && list.length > 0) return list
      } catch (err) {}
      try {
        const res = await api.get('/api/admin/staff')
        const staff = res.data?.staff || res.data?.data || []
        const docs = staff.filter((s) => {
          const roles = (s.roleNames || (Array.isArray(s.roles) ? s.roles : [s.role || ''])).join(' ').toLowerCase()
          return (
            roles.includes('doctor') ||
            roles.includes('physician') ||
            roles.includes('surgeon') ||
            roles.includes('cardiologist') ||
            roles.includes('specialist') ||
            /^dr[\s.]/i.test(s.name || s.fullName || '')
          )
        })
        if (docs.length > 0) {
          return docs.map((d) => ({
            id: d.id,
            name: d.name || d.fullName,
            fullName: d.name || d.fullName,
            department: d.department || 'General Medicine',
            role: d.role || 'Doctor',
            label: `${d.name || d.fullName} (${d.department || d.specialty || 'Doctor'})`,
            value: d.name || d.fullName,
          }))
        }
      } catch (e) {}
      return []
    },
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  })

  const doctorOptions = React.useMemo(() => {
    if (!doctorsData || doctorsData.length === 0) {
      if (formData.doctorName) return [{ value: formData.doctorName, label: formData.doctorName }]
      return []
    }
    return doctorsData.map((d) => ({
      value: d.value || d.fullName || d.name,
      label: d.label || `${d.fullName || d.name} (${d.department || 'Doctor'})`,
    }))
  }, [doctorsData, formData.doctorName])

  React.useEffect(() => {
    if (doctorsData && doctorsData.length > 0 && (!formData.doctorName || formData.doctorName === 'Attending Clinician')) {
      setFormData((prev) => ({
        ...prev,
        doctorName: doctorsData[0].value || doctorsData[0].fullName || doctorsData[0].name,
      }))
    }
  }, [doctorsData])

  const triageList = Array.isArray(triageData) ? triageData : []

  // Ensure unique patient list for triage modal, preventing duplicate patient entries
  const triagePatientsList = React.useMemo(() => {
    const rawPatients = Array.isArray(patientsData) ? patientsData : []
    if (rawPatients.length > 0) {
      return rawPatients
    }
    const map = new Map()
    const appts = Array.isArray(data) ? data : data?.appointments || data?.data || []
    appts.forEach((a) => {
      if (a.patientId && !map.has(a.patientId)) {
        map.set(a.patientId, {
          id: a.patientId,
          fullName: a.patientName,
          phone: a.patientPhone,
          mrn: a.patientMrn
        })
      }
    })
    return Array.from(map.values())
  }, [patientsData, data])

  const bookMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/api/staff/appointments', payload)
      return res.data
    },
    onSuccess: (newApt) => {
      queryClient.invalidateQueries({ queryKey: ['staff', 'appointments'] })
      setIsBookOpen(false)
      notify.success(`Appointment booked for ${newApt.patientName}!`)
    },
    onError: () => notify.error('Failed to book appointment.'),
  })

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await api.put(`/api/staff/appointments/${id}`, { status })
      return res.data
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['staff', 'appointments'] })
      notify.info(`Appointment status updated to ${updated.status}.`)
    },
  })

  const appointments = Array.isArray(data) ? data : data?.appointments || data?.data || []

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-text-primary">
            Clinical Scheduling & Appointments
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Coordinate outpatient consultations, telehealth virtual visits, and diagnostic procedures
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          {/* View Mode Toggle */}
          <div className="p-1 rounded-xl bg-surface border border-border flex items-center justify-center gap-1">
            {['Day', 'Week', 'Month'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex-1 sm:flex-none px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  viewMode === mode
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsTriageOpen(true)}
            leftIcon={<Activity className="w-4 h-4 text-primary" />}
            className="w-full sm:w-auto shrink-0 shadow-sm"
          >
            Reception Check-In & Vitals
          </Button>

          <PermissionAction action="edit">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setFormData({
                  patientName: '',
                  patientPhone: '',
                  doctorName: user?.name || user?.fullName || 'Attending Clinician',
                  department: user?.clinicCategoryName || user?.department || 'General Practice',
                  dateTime: new Date().toISOString().slice(0, 16),
                  durationMinutes: 30,
                  type: 'In-Person Consultation',
                  reason: '',
                  room: 'Consultation Room 1',
                })
                setIsBookOpen(true)
              }}
              leftIcon={<Plus className="w-4 h-4" />}
              className="w-full sm:w-auto shrink-0 shadow-sm"
            >
              Schedule Appointment
            </Button>
          </PermissionAction>
        </div>
      </div>

      {/* Calendar Grid Cards */}
      <div className="space-y-4">
        <div className="p-3.5 sm:p-4 rounded-2xl border border-border bg-surface/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
            <span className="font-heading font-bold text-xs sm:text-sm text-text-primary">
              Wednesday, September 09, 2026
            </span>
          </div>
          <Badge variant="primary" size="sm" className="self-start sm:self-auto">
            {appointments.length} Consultations Booked
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {appointments.map((apt) => {
            const matchingTriage = triageList.find(
              (t) =>
                t.patientId === apt.patientId ||
                t.patientName?.toLowerCase() === apt.patientName?.toLowerCase() ||
                (apt.reason && t.tokenNumber && apt.reason.includes(t.tokenNumber))
            )
            const tokenNum =
              matchingTriage?.tokenNumber ||
              (apt.reason && apt.reason.match(/\[Token:\s*([^\]]+)\]/)?.[1])

            return (
              <div
                key={apt.id}
                className="p-5 rounded-2xl border border-border bg-surface shadow-soft flex flex-col justify-between group hover:border-primary/50 transition-all"
              >
                <div>
                  {/* Status, Token & Time */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                      <Clock className="w-4 h-4" />
                      <span>
                        {new Date(apt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[11px] text-text-secondary font-normal">({apt.durationMinutes}m)</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {tokenNum && (
                        <span className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary font-mono font-bold text-[11px] flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          <span>{tokenNum}</span>
                        </span>
                      )}
                      <Badge
                        variant={
                          apt.status === 'In-Progress'
                            ? 'info'
                            : apt.status === 'Completed'
                            ? 'success'
                            : 'primary'
                        }
                        size="sm"
                        dot
                      >
                        {apt.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Patient & Reason */}
                  <h3 className="font-heading font-bold text-sm text-text-primary mb-1">
                    {apt.patientName}
                  </h3>
                  <p className="text-xs text-text-secondary mb-2 line-clamp-2">
                    {apt.reason}
                  </p>

                  {/* Vitals Highlights if triaged */}
                  {matchingTriage && (
                    <div className="p-2 rounded-xl bg-bg/80 border border-border flex items-center justify-between text-[11px] mb-3">
                      <span className="text-text-secondary">
                        Weight: <strong className="text-text-primary">{matchingTriage.weight || '--'}</strong>
                      </span>
                      <span className="text-text-secondary">
                        BP: <strong className="text-danger">{matchingTriage.bp || '--'}</strong>
                      </span>
                      <span className="text-text-secondary">
                        Sugar: <strong className="text-amber-500">{matchingTriage.sugarLevel ? matchingTriage.sugarLevel.split(' ')[0] : '--'}</strong>
                      </span>
                    </div>
                  )}

                  {/* Attending & Location */}
                  <div className="pt-3 border-t border-border flex flex-col gap-1 text-[11px] text-text-secondary">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="font-medium text-text-primary">{apt.doctorName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {apt.type.includes('Telehealth') ? (
                        <Video className="w-3.5 h-3.5 text-info shrink-0" />
                      ) : (
                        <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      )}
                      <span>{apt.room} • {apt.type}</span>
                    </div>
                  </div>
                </div>

                {/* Status Action Buttons */}
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2">
                  <Select
                    value={apt.status}
                    onChange={(e) => statusMutation.mutate({ id: apt.id, status: e.target.value })}
                    className="!py-1 !text-xs !rounded-lg"
                    options={[
                      { value: 'Scheduled', label: 'Scheduled' },
                      { value: 'Confirmed', label: 'Confirmed' },
                      { value: 'In-Progress', label: 'In-Progress' },
                      { value: 'Completed', label: 'Completed' },
                    ]}
                  />

                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() =>
                      setSelectedDoctorApt(
                        matchingTriage || {
                          tokenNumber: tokenNum || 'TK-101',
                          patientName: apt.patientName,
                          doctorName: apt.doctorName,
                          patientPhone: apt.patientPhone,
                          status: apt.status
                        }
                      )
                    }
                    leftIcon={<Stethoscope className="w-3.5 h-3.5 text-primary" />}
                    title="Review Vitals Report & Issue Prescription"
                  >
                    Vitals & Rx
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Book Appointment Modal */}
      <Modal
        isOpen={isBookOpen}
        onClose={() => setIsBookOpen(false)}
        maxWidth="max-w-2xl"
        title="Schedule Clinical Appointment"
        description="Book a dedicated consultation slot with room assignment."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            bookMutation.mutate(formData)
          }}
          className="flex flex-col space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Patient Full Name"
              required
              placeholder="e.g. Liam Reyes"
              value={formData.patientName}
              onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
            />
            <Input
              label="Contact Phone"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              required
              placeholder="9876543210"
              value={formData.patientPhone}
              onChange={(e) => {
                let val = e.target.value.replace(/\D/g, '')
                if (val.length === 12 && val.startsWith('91')) val = val.slice(2)
                else if (val.length === 11 && val.startsWith('0')) val = val.slice(1)
                setFormData({ ...formData, patientPhone: val.slice(0, 10) })
              }}
              onKeyDown={(e) => {
                if (
                  ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'Home', 'End'].includes(e.key) ||
                  e.ctrlKey ||
                  e.metaKey
                ) {
                  return
                }
                if (!/^[0-9]$/.test(e.key)) {
                  e.preventDefault()
                }
              }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Appointment Date"
              type="date"
              required
              value={formData.dateTime ? formData.dateTime.slice(0, 10) : ''}
              onChange={(e) => {
                const dateVal = e.target.value
                const timeVal =
                  formData.dateTime && formData.dateTime.includes('T')
                    ? formData.dateTime.slice(11, 16)
                    : '09:00'
                setFormData((prev) => ({
                  ...prev,
                  dateTime: dateVal ? `${dateVal}T${timeVal}` : '',
                }))
              }}
            />
            <Input
              label="Appointment Time"
              type="time"
              required
              value={
                formData.dateTime && formData.dateTime.includes('T')
                  ? formData.dateTime.slice(11, 16)
                  : ''
              }
              onChange={(e) => {
                const timeVal = e.target.value
                const dateVal = formData.dateTime
                  ? formData.dateTime.slice(0, 10)
                  : new Date().toISOString().slice(0, 10)
                setFormData((prev) => ({
                  ...prev,
                  dateTime: `${dateVal}T${timeVal}`,
                }))
              }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Visit Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              options={[
                { value: 'In-Person Consultation', label: 'In-Person Consultation' },
                { value: 'Telehealth Video', label: 'Telehealth Video' },
                { value: 'Diagnostic Follow-up', label: 'Diagnostic Follow-up' },
                { value: 'Procedure', label: 'In-Office Minor Procedure' },
              ]}
            />
            <Select
              label="Assigned Attending Doctor"
              value={formData.doctorName}
              onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
              options={
                doctorOptions.length > 0
                  ? doctorOptions
                  : [{ value: formData.doctorName || 'Attending Doctor', label: formData.doctorName || 'Attending Doctor' }]
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Clinical Room / Location"
              placeholder="e.g. Consultation Room 1"
              value={formData.room}
              onChange={(e) => setFormData({ ...formData, room: e.target.value })}
            />
            <Input
              label="Clinical Reason for Visit"
              required
              placeholder="e.g. Follow-up for elevated blood pressure"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-border shrink-0">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsBookOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={bookMutation.isPending}>
              Confirm Booking
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reception Triage & Vitals Intake Modal */}
      {isTriageOpen && (
        <Suspense fallback={null}>
          <PatientDetailsTriageModal
            isOpen={isTriageOpen}
            onClose={() => setIsTriageOpen(false)}
            patientsList={triagePatientsList}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['staff', 'appointments'] })
              queryClient.invalidateQueries({ queryKey: ['staff', 'triage'] })
            }}
          />
        </Suspense>
      )}

      {/* Doctor Vitals Review & Prescription Modal */}
      {selectedDoctorApt && (
        <Suspense fallback={null}>
          <DoctorVitalsReportModal
            isOpen={!!selectedDoctorApt}
            onClose={() => setSelectedDoctorApt(null)}
            patientData={selectedDoctorApt}
            onPrescriptionSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['staff', 'appointments'] })
              queryClient.invalidateQueries({ queryKey: ['staff', 'prescriptions'] })
              queryClient.invalidateQueries({ queryKey: ['staff', 'triage'] })
            }}
          />
        </Suspense>
      )}
    </div>
  )
}

export default AppointmentsPage
