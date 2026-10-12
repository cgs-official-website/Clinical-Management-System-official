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
  })

  const { data: triageData } = useQuery({
    queryKey: ['staff', 'triage'],
    queryFn: async () => {
      const res = await api.get('/api/staff/triage')
      return res.data?.data || []
    },
  })

  const triageList = Array.isArray(triageData) ? triageData : []

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
              onClick={() => setIsBookOpen(true)}
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
        title="Schedule Clinical Appointment"
        description="Book a dedicated consultation slot with room assignment."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            bookMutation.mutate(formData)
          }}
          className="space-y-4"
        >
          <Input
            label="Patient Full Name"
            required
            placeholder="Liam Reyes"
            value={formData.patientName}
            onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Contact Phone"
              required
              placeholder="+1 (555) 902-1823"
              value={formData.patientPhone}
              onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
            />
            <Input
              label="Appointment Date & Time"
              type="datetime-local"
              required
              value={formData.dateTime}
              onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <Input
              label="Clinical Room / Location"
              value={formData.room}
              onChange={(e) => setFormData({ ...formData, room: e.target.value })}
            />
          </div>

          <Input
            label="Clinical Reason for Visit"
            required
            placeholder="e.g. Follow-up for elevated blood pressure"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          />

          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-border">
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
            patientsList={appointments.map((a) => ({ id: a.patientId, fullName: a.patientName, phone: a.patientPhone }))}
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
