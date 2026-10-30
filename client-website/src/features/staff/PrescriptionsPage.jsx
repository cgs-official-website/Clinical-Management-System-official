import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Pill, Plus, FileText, CheckCircle2, User, AlertCircle, Hash, Boxes } from 'lucide-react'
import { api } from '../../lib/api'
import { DataTable } from '../../components/ui/DataTable'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { notify } from '../../components/ui/Toast'
import { useAuthStore } from '../../store/useAuthStore'
import { PermissionAction } from '../../components/common/PermissionAction'
import { PharmacyFulfillModal } from './components/PharmacyFulfillModal'

export const PrescriptionsPage = () => {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  // Set when the user arrives from a Completed appointment
  const [linkedRx, setLinkedRx] = useState(null)
  const [selectedFulfillRx, setSelectedFulfillRx] = useState(null)
  const [formData, setFormData] = useState({
    tokenNumber: '',
    patientName: '',
    doctorName: user?.name || user?.fullName || 'Attending Physician',
    diagnosis: '',
    drug: '',
    dosage: '',
    frequency: '',
    duration: '',
    refills: 0,
    notes: '',
  })

  // Arrived from Appointments (status = Completed) -> open modal with pre-filled data
  useEffect(() => {
    const incoming = location.state?.newRx
    if (!incoming) return
    setFormData((prev) => ({
      ...prev,
      patientName: incoming.patientName || '',
      tokenNumber: incoming.tokenNumber || '',
    }))
    setLinkedRx(incoming)
    setIsCreateOpen(true)
    // clear router state so a page refresh does not re-open the modal
    navigate(location.pathname, { replace: true, state: null })
  }, [location.state, location.pathname, navigate])

  const closeCreate = () => {
    setIsCreateOpen(false)
    setLinkedRx(null)
  }

  const { data, isLoading } = useQuery({
    queryKey: ['staff', 'prescriptions'],
    queryFn: async () => {
      const res = await api.get('/api/staff/prescriptions')
      return res.data
    },
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
    retry: false,
  })

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/api/staff/prescriptions', {
        tokenNumber: payload.tokenNumber || undefined,
        appointmentId: linkedRx?.appointmentId || undefined,
        patientId: linkedRx?.patientId || undefined,
        patientName: payload.patientName,
        doctorName: payload.doctorName,
        diagnosis: payload.diagnosis,
        medications: [
          {
            drug: payload.drug,
            dosage: payload.dosage,
            frequency: payload.frequency,
            duration: payload.duration,
            refills: payload.refills,
          },
        ],
        notes: payload.notes,
        status: 'Pending Dispense',
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', 'prescriptions'] })
      queryClient.invalidateQueries({ queryKey: ['staff', 'triage'] })
      queryClient.invalidateQueries({ queryKey: ['staff', 'appointments'] })
      setFormData((prev) => ({
        ...prev,
        tokenNumber: '', patientName: '', diagnosis: '', drug: '', dosage: '',
        frequency: '', duration: '', refills: 0, notes: '',
      }))
      closeCreate()
      notify.success('Prescription signed and automatically routed to Pharmacy panel!')
    },
    onError: () => notify.error('Failed to issue prescription.'),
  })

  const prescriptions = Array.isArray(data) ? data : data?.prescriptions || data?.data || []

  const columns = [
    {
      key: 'tokenNumber',
      label: 'Token #',
      className: 'whitespace-nowrap min-w-[110px] w-[110px]',
      render: (val, row) => {
        const token =
          val ||
          row.tokenNumber ||
          (row.notes && row.notes.includes('[Token:')
            ? row.notes.match(/\[Token:\s*([^\]]+)\]/)?.[1]
            : null)
        return token ? (
          <span className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary font-mono font-extrabold text-xs leading-none tracking-wide">
            {String(token).trim()}
          </span>
        ) : (
          <span className="inline-flex items-center justify-center min-w-[3.5rem] text-[11px] text-text-muted font-mono">--</span>
        )
      },
    },
    {
      key: 'patientName',
      label: 'Patient & Prescriber',
      sortable: true,
      render: (val, row) => (
        <div>
          <div className="font-bold text-xs text-text-primary">{val}</div>
          <div className="text-[11px] text-text-secondary">By {row.doctorName}</div>
        </div>
      ),
    },
    {
      key: 'diagnosis',
      label: 'Clinical Diagnosis',
      render: (val) => <span className="text-xs font-semibold text-text-primary">{val}</span>,
    },
    {
      key: 'medications',
      label: 'Prescribed Drugs',
      render: (meds = []) => (
        <div className="space-y-1">
          {meds.map((m, idx) => (
            <div key={idx} className="text-xs">
              <span className="font-bold text-primary">{m.drug} {m.dosage}</span>{' '}
              <span className="text-text-secondary text-[11px]">({m.frequency})</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'date',
      label: 'Date Issued',
      sortable: true,
      render: (val) => <span className="text-xs text-text-secondary">{val || 'Today'}</span>,
    },
    {
      key: 'status',
      label: 'Pharmacy Status',
      render: (val) => {
        const isFulfilled = val === 'Fulfilled' || val === 'Dispensed'
        return (
          <Badge variant={isFulfilled ? 'success' : 'warning'} size="sm" dot>
            {isFulfilled ? 'Fulfilled / Dispensed' : 'Pending Dispense'}
          </Badge>
        )
      },
    },
    {
      key: 'actions',
      label: 'Pharmacy Action',
      render: (_, row) => {
        const isFulfilled = row.status === 'Fulfilled' || row.status === 'Dispensed'
        return (
          <Button
            variant={isFulfilled ? 'ghost' : 'primary'}
            size="xs"
            onClick={() => setSelectedFulfillRx(row)}
            leftIcon={isFulfilled ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Boxes className="w-3 h-3" />}
            className={!isFulfilled ? '!bg-emerald-600 hover:!bg-emerald-700 text-white shadow-xs' : ''}
          >
            {isFulfilled ? 'View Dispense' : 'Fulfill'}
          </Button>
        )
      },
    },
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-text-primary">
            Prescriptions & Clinical Encounter Notes
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Electronic drug prescriptions, dosage regimens, and diagnostic ICD-10 notes
          </p>
        </div>

        <PermissionAction action="edit">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="w-full sm:w-auto shrink-0 shadow-sm"
          >
            Draft New Prescription
          </Button>
        </PermissionAction>
      </div>

      <DataTable
        columns={columns}
        data={prescriptions}
        isLoading={isLoading}
        searchPlaceholder="Filter prescriptions..."
      />

      {/* New Rx Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={closeCreate}
        title="Issue Clinical Prescription"
        description="Prescribe medications with automatic allergy and dosage verification."
        maxWidth="max-w-3xl"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createMutation.mutate(formData)
          }}
          className="space-y-3"
        >
          {linkedRx && (
            <div className="px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary font-semibold">
              Linked to the completed appointment of {linkedRx.patientName}
              {linkedRx.tokenNumber ? ` (Token ${linkedRx.tokenNumber})` : ''}
            </div>
          )}

          {/* Row 1: patient + token */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Input
                label="Patient Full Name"
                required
                placeholder="e.g. Liam Reyes"
                value={formData.patientName}
                onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
              />
            </div>
            <Input
              label="Token Number (Optional)"
              placeholder="e.g. TK-101"
              value={formData.tokenNumber}
              onChange={(e) => setFormData({ ...formData, tokenNumber: e.target.value })}
            />
          </div>

          {/* Row 2: diagnosis */}
          <Input
            label="Primary Diagnosis (ICD-10)"
            required
            value={formData.diagnosis}
            onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
          />

          {/* Row 3: drug, dosage, frequency */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Drug Name"
              required
              placeholder="e.g. Amlodipine"
              value={formData.drug}
              onChange={(e) => setFormData({ ...formData, drug: e.target.value })}
            />
            <Input
              label="Dosage"
              required
              placeholder="e.g. 5mg"
              value={formData.dosage}
              onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
            />
            <Input
              label="Frequency"
              required
              placeholder="e.g. Once daily"
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
            />
          </div>

          {/* Row 4: duration + instructions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Duration & Refills"
              required
              placeholder="e.g. 90 days"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            />
            <div className="sm:col-span-2">
              <Textarea
                label="Physician Clinical Instructions"
                rows={2}
                className="resize-none"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          {/* Sticky action bar - always visible, no scrolling needed */}
          <div className="sticky bottom-0 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 px-4 sm:px-6 py-3.5 mt-2 bg-surface border-t border-border flex items-center justify-end gap-2.5">
            <Button variant="secondary" size="sm" type="button" onClick={closeCreate}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={createMutation.isPending}>
              Sign & Transmit Rx
            </Button>
          </div>
        </form>
      </Modal>

      {/* Pharmacy Fulfillment Modal */}
      <PharmacyFulfillModal
        isOpen={!!selectedFulfillRx}
        onClose={() => setSelectedFulfillRx(null)}
        prescription={selectedFulfillRx}
        onFulfillSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['staff', 'prescriptions'] })
        }}
      />
    </div>
  )
}

export default PrescriptionsPage
