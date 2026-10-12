import React, { useState, lazy, Suspense } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, User, FileText, Upload, AlertTriangle, Heart, Phone, Mail, Calendar, Activity, Hash, Pill, Edit2, Trash2 } from 'lucide-react'
import { api } from '../../lib/api'
import { DataTable } from '../../components/ui/DataTable'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { notify } from '../../components/ui/Toast'
import { usePermissions } from '../../hooks/usePermissions'
import { useAuthStore } from '../../store/useAuthStore'
import { PermissionAction } from '../../components/common/PermissionAction'

// Lazy load triage modal so it is only fetched on user interaction
const PatientDetailsTriageModal = lazy(() =>
  import('./components/PatientDetailsTriageModal').then((m) => ({ default: m.PatientDetailsTriageModal }))
)

export const PatientsPage = () => {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { hasPermission, isAdmin, isSuperadmin } = usePermissions()
  const canCreate = hasPermission('patients.create') || isAdmin || isSuperadmin
  const [search, setSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isTriageOpen, setIsTriageOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [formData, setFormData] = useState({
    fullName: '',
    dob: '1990-01-01',
    gender: 'Female',
    bloodGroup: 'O+',
    phone: '',
    email: '',
    address: '',
    primaryDoctor: user?.name || user?.fullName || 'Attending Physician',
    allergies: '',
    chronicConditions: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['staff', 'patients'],
    queryFn: async () => {
      const res = await api.get('/api/staff/patients')
      return res.data?.data || res.data?.patients || res.data || []
    },
  })

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const allergiesList = typeof payload.allergies === 'string'
        ? payload.allergies.split(',').map((s) => s.trim()).filter(Boolean)
        : payload.allergies || []
      const conditionsList = typeof payload.chronicConditions === 'string'
        ? payload.chronicConditions.split(',').map((s) => s.trim()).filter(Boolean)
        : payload.chronicConditions || []

      const res = await api.post('/api/staff/patients', {
        ...payload,
        name: payload.fullName,
        allergies: allergiesList,
        chronicConditions: conditionsList,
      })
      return res.data?.data || res.data
    },
    onSuccess: (newPat) => {
      queryClient.invalidateQueries({ queryKey: ['staff', 'patients'] })
      setIsCreateOpen(false)
      notify.success(`Patient chart created for ${newPat?.fullName || newPat?.name || 'patient'}!`)
    },
    onError: (err) => {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to register patient chart.'
      notify.error(msg)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (patientId) => {
      await api.delete(`/api/staff/patients/${patientId}`)
      return patientId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', 'patients'] })
      setSelectedPatient(null)
      notify.success('Patient record deleted successfully.')
    },
    onError: (err) => {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to delete patient record.'
      notify.error(msg)
    },
  })

  const patients = Array.isArray(data) ? data : data?.patients || data?.data || []
  const filteredPatients = (patients || []).filter(
    (p) =>
      (p.fullName || p.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.mrn || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.phone || '').includes(search)
  )

  const columns = [
    {
      key: 'fullName',
      label: 'Patient Name & MRN',
      sortable: true,
      render: (val, row) => (
        <div>
          <div className="font-bold text-xs text-text-primary">{val}</div>
          <div className="text-[11px] font-mono text-primary font-semibold">{row.mrn}</div>
        </div>
      ),
    },
    {
      key: 'gender',
      label: 'Demographics',
      render: (_, row) => (
        <span className="text-xs text-text-secondary">
          {row.age} yrs • {row.gender} • {row.bloodGroup}
        </span>
      ),
    },
    {
      key: 'phone',
      label: 'Contact',
      render: (val, row) => (
        <div>
          <div className="text-xs font-medium text-text-primary">{val}</div>
          <div className="text-[11px] text-text-secondary truncate">{row.email}</div>
        </div>
      ),
    },
    {
      key: 'allergies',
      label: 'Allergies Alert',
      render: (val = []) => (
        <div className="flex flex-wrap gap-1">
          {val.slice(0, 2).map((a, i) => (
            <Badge
              key={i}
              variant={a.includes('NKDA') ? 'neutral' : 'danger'}
              size="sm"
            >
              {a}
            </Badge>
          ))}
          {val.length > 2 && <span className="text-[10px] text-text-secondary">+{val.length - 2}</span>}
        </div>
      ),
    },
    {
      key: 'primaryDoctor',
      label: 'Primary Attending',
      render: (val) => <span className="text-xs font-semibold">{val}</span>,
    },
    {
      key: 'lastVisit',
      label: 'Last Visit',
      sortable: true,
      render: (val) => <span className="text-xs text-text-secondary">{val}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <PermissionAction action="edit">
            <button
              onClick={() => {
                setSelectedPatient(row)
                setActiveTab('profile')
              }}
              title="Edit Patient Details"
              className="p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </PermissionAction>
          <PermissionAction action="delete">
            <button
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete patient record for ${row.fullName || row.name}?`)) {
                  deleteMutation.mutate(row.id)
                }
              }}
              title="Delete Patient Record"
              className="p-1.5 rounded-lg text-danger/70 hover:text-danger hover:bg-danger/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </PermissionAction>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-text-primary">
            Patient Electronic Health Records
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Search patient charts, inspect clinical histories, and upload medical diagnostic scans
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
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
              onClick={() => setIsCreateOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
              className="w-full sm:w-auto shrink-0 shadow-sm"
            >
              Register New Patient
            </Button>
          </PermissionAction>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredPatients}
        isLoading={isLoading}
        searchPlaceholder="Search patients by name, MRN number, or phone..."
        searchValue={search}
        onSearchChange={setSearch}
        onRowClick={(row) => setSelectedPatient(row)}
      />

      {/* Patient Profile Full Detail Sheet / Modal */}
      {selectedPatient && (
        <Modal
          isOpen={!!selectedPatient}
          onClose={() => setSelectedPatient(null)}
          title={`EHR Chart: ${selectedPatient.fullName}`}
          description={`Medical Record Number: ${selectedPatient.mrn}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6">
            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-border pb-2">
              {['profile', 'history', 'documents'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                    activeTab === tab
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                  }`}
                >
                  {tab === 'profile' ? 'Clinical Profile' : tab === 'history' ? 'Chronic History' : 'Diagnostic Files'}
                </button>
              ))}
            </div>

            {activeTab === 'profile' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-surface/60 border border-border">
                  <div>
                    <span className="text-text-secondary block mb-0.5">Date of Birth</span>
                    <span className="font-bold text-text-primary">{selectedPatient.dob} ({selectedPatient.age} yrs)</span>
                  </div>
                  <div>
                    <span className="text-text-secondary block mb-0.5">Blood Group</span>
                    <span className="font-bold text-danger">{selectedPatient.bloodGroup}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary block mb-0.5">Assigned Attending</span>
                    <span className="font-bold text-text-primary">{selectedPatient.primaryDoctor}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary block mb-0.5">Phone</span>
                    <span className="font-bold text-text-primary">{selectedPatient.phone}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary block mb-0.5">Email</span>
                    <span className="font-bold text-text-primary">{selectedPatient.email}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary block mb-0.5">Status</span>
                    <Badge variant="success" size="sm" dot>Active</Badge>
                  </div>
                </div>

                {/* Latest Vitals & Triage Report */}
                {selectedPatient.medicalHistory?.latestVitals && (
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary flex items-center gap-1.5 text-xs">
                        <Activity className="w-4 h-4" />
                        Reception Intake Vitals (Token #{selectedPatient.medicalHistory.latestVitals.tokenNumber})
                      </span>
                      <span className="text-[10px] text-text-muted font-mono">
                        {selectedPatient.medicalHistory.latestVitals.recordedAt
                          ? new Date(selectedPatient.medicalHistory.latestVitals.recordedAt).toLocaleDateString()
                          : 'Recent Check-in'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 text-center">
                      <div className="p-2 rounded-lg bg-surface border border-border">
                        <span className="text-[10px] text-text-muted block">Weight</span>
                        <span className="font-bold text-text-primary text-xs">
                          {selectedPatient.medicalHistory.latestVitals.weight || '--'}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-surface border border-border">
                        <span className="text-[10px] text-text-muted block">Blood Pressure</span>
                        <span className="font-bold text-danger text-xs">
                          {selectedPatient.medicalHistory.latestVitals.bp || '--'}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-surface border border-border">
                        <span className="text-[10px] text-text-muted block">Sugar Level</span>
                        <span className="font-bold text-amber-500 text-xs">
                          {selectedPatient.medicalHistory.latestVitals.sugarLevel || '--'}
                        </span>
                      </div>
                    </div>

                    {selectedPatient.medicalHistory.latestVitals.currentMedications && (
                      <div className="pt-2 border-t border-primary/15 text-[11px] text-text-secondary flex items-start gap-1.5">
                        <Pill className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-text-primary">Current Medications / Tablets: </strong>
                          <span>{selectedPatient.medicalHistory.latestVitals.currentMedications}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-4 rounded-xl bg-danger/5 border border-danger/20">
                  <div className="flex items-center gap-2 font-bold text-danger mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    Documented Drug & Material Allergies
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPatient.allergies?.map((allergy, i) => (
                      <Badge key={i} variant="danger" size="sm">{allergy}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="p-4 rounded-xl bg-surface/60 border border-border space-y-3 text-xs">
                <h4 className="font-bold text-text-primary uppercase tracking-wider">Chronic Conditions</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPatient.chronicConditions?.map((cond, i) => (
                    <Badge key={i} variant="warning" size="md">{cond}</Badge>
                  ))}
                </div>
                <div className="pt-3 border-t border-border">
                  <span className="text-text-secondary block mb-1">Residential Address</span>
                  <span className="font-medium text-text-primary">{selectedPatient.address}</span>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-4 text-xs">
                <div className="p-6 rounded-xl border border-dashed border-border bg-surface text-center flex flex-col items-center justify-center">
                  <Upload className="w-8 h-8 text-primary mb-2" />
                  <span className="font-bold text-text-primary mb-1">Upload Laboratory or DICOM Scan</span>
                  <span className="text-text-secondary text-[11px] mb-3">PDF, DICOM, PNG up to 50MB</span>
                  <Button variant="secondary" size="xs" onClick={() => notify.info('File upload gateway active.')}>
                    Browse Local File
                  </Button>
                </div>
              </div>
            )}

            {/* Modal Actions Footer with PermissionAction Controls */}
            <div className="pt-4 border-t border-border flex items-center justify-between gap-2">
              <div>
                <PermissionAction action="delete">
                  <Button
                    variant="danger"
                    size="sm"
                    leftIcon={<Trash2 className="w-4 h-4" />}
                    isLoading={deleteMutation.isPending}
                    onClick={() => {
                      if (window.confirm(`Delete EHR chart for ${selectedPatient.fullName || selectedPatient.name}? This action is irreversible.`)) {
                        deleteMutation.mutate(selectedPatient.id)
                      }
                    }}
                  >
                    Delete Chart
                  </Button>
                </PermissionAction>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setSelectedPatient(null)}>
                  Close
                </Button>
                <PermissionAction action="edit">
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Edit2 className="w-4 h-4" />}
                    onClick={() => {
                      notify.info(`Editing mode enabled for ${selectedPatient.fullName || selectedPatient.name}`)
                    }}
                  >
                    Edit Chart
                  </Button>
                </PermissionAction>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Register Patient Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register New Patient Chart"
        description="Creates an electronic health record with auto-assigned MRN identifier."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createMutation.mutate(formData)
          }}
          className="space-y-4"
        >
          <Input
            label="Full Legal Name"
            required
            placeholder="Eleanor Vance"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Date of Birth"
              type="date"
              required
              value={formData.dob}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
            />
            <Select
              label="Gender"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              options={[
                { value: 'Female', label: 'Female' },
                { value: 'Male', label: 'Male' },
                { value: 'Other', label: 'Other' },
              ]}
            />
            <Select
              label="Blood Group"
              value={formData.bloodGroup}
              onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
              options={[
                { value: 'A+', label: 'A+' },
                { value: 'A-', label: 'A-' },
                { value: 'B+', label: 'B+' },
                { value: 'B-', label: 'B-' },
                { value: 'O+', label: 'O+' },
                { value: 'O-', label: 'O-' },
                { value: 'AB+', label: 'AB+' },
                { value: 'AB-', label: 'AB-' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Phone Number"
              required
              placeholder="+1 (555) 012-3456"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="patient@gmail.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <Input
            label="Known Allergies (Comma-separated)"
            placeholder="e.g. Penicillin, Latex, Sulfa"
            value={formData.allergies}
            onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
          />

          <Input
            label="Chronic Conditions (Comma-separated)"
            placeholder="e.g. Hypertension, Type 2 Diabetes"
            value={formData.chronicConditions}
            onChange={(e) => setFormData({ ...formData, chronicConditions: e.target.value })}
          />

          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-border">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={createMutation.isPending}>
              Create Patient Chart
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reception Check-In & Vitals Modal */}
      {isTriageOpen && (
        <Suspense fallback={null}>
          <PatientDetailsTriageModal
            isOpen={isTriageOpen}
            onClose={() => setIsTriageOpen(false)}
            patientsList={patients}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['staff', 'patients'] })
              queryClient.invalidateQueries({ queryKey: ['staff', 'triage'] })
            }}
          />
        </Suspense>
      )}
    </div>
  )
}

export default PatientsPage
