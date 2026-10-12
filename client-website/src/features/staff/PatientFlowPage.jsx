import React, { useState, lazy, Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  CheckCircle2,
  Plus,
  Boxes,
  Stethoscope,
  Search,
  RefreshCw
} from 'lucide-react'
import { api } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { notify } from '../../components/ui/Toast'

// Lazy load workflow modals
const PatientDetailsTriageModal = lazy(() =>
  import('./components/PatientDetailsTriageModal').then((m) => ({ default: m.PatientDetailsTriageModal }))
)
const DoctorVitalsReportModal = lazy(() =>
  import('./components/DoctorVitalsReportModal').then((m) => ({ default: m.DoctorVitalsReportModal }))
)
const PharmacyFulfillModal = lazy(() =>
  import('./components/PharmacyFulfillModal').then((m) => ({ default: m.PharmacyFulfillModal }))
)

export const PatientFlowPage = () => {
  const [activeStage, setActiveStage] = useState('all') // 'all' | 'reception' | 'doctor' | 'pharmacy'
  const [search, setSearch] = useState('')

  // Modals state
  const [isTriageOpen, setIsTriageOpen] = useState(false)
  const [selectedDoctorPatient, setSelectedDoctorPatient] = useState(null)
  const [selectedPharmacyRx, setSelectedPharmacyRx] = useState(null)

  // 1. Fetch Outpatient Triage & Token Queue
  const { data: triageData, isLoading: _isTriageLoading, refetch: refetchTriage } = useQuery({
    queryKey: ['staff', 'triage'],
    queryFn: async () => {
      const res = await api.get('/api/staff/triage')
      return res.data?.data || []
    }
  })

  // 2. Fetch Prescriptions (for Pharmacy queue)
  const { data: rxData, isLoading: _isRxLoading, refetch: refetchRx } = useQuery({
    queryKey: ['staff', 'prescriptions'],
    queryFn: async () => {
      try {
        const res = await api.get('/api/staff/prescriptions')
        return res.data?.prescriptions || res.data?.data || []
      } catch (err) {
        if (err.response?.status === 403) return []
        throw err
      }
    },
    retry: false,
  })

  // 3. Fetch Registered Patients (for reception picker)
  const { data: patientsData } = useQuery({
    queryKey: ['staff', 'patients'],
    queryFn: async () => {
      const res = await api.get('/api/staff/patients')
      return res.data?.patients || res.data?.data || []
    }
  })

  const triageQueue = Array.isArray(triageData) ? triageData : []
  const prescriptions = Array.isArray(rxData) ? rxData : []
  const patientsList = Array.isArray(patientsData) ? patientsData : []

  // Derived counts
  const totalTokens = triageQueue.length
  const waitingForDoctorCount = triageQueue.filter(
    (t) => t.status === 'WAITING_FOR_DOCTOR' || t.status === 'WITH_DOCTOR'
  ).length
  const pendingPharmacyCount = prescriptions.filter(
    (p) => p.status !== 'Fulfilled' && p.status !== 'Dispensed'
  ).length
  const fulfilledCount = prescriptions.filter(
    (p) => p.status === 'Fulfilled' || p.status === 'Dispensed'
  ).length

  // Filtered triage list
  const filteredTriage = triageQueue.filter(
    (t) =>
      t.tokenNumber?.toLowerCase().includes(search.toLowerCase()) ||
      t.patientName?.toLowerCase().includes(search.toLowerCase()) ||
      t.bp?.toLowerCase().includes(search.toLowerCase()) ||
      t.currentMedications?.toLowerCase().includes(search.toLowerCase())
  )

  // Filtered prescriptions list for pharmacy
  const filteredPrescriptions = prescriptions.filter(
    (p) =>
      (p.tokenNumber && p.tokenNumber.toLowerCase().includes(search.toLowerCase())) ||
      p.patientName?.toLowerCase().includes(search.toLowerCase()) ||
      p.diagnosis?.toLowerCase().includes(search.toLowerCase()) ||
      (p.notes && p.notes.toLowerCase().includes(search.toLowerCase()))
  )

  const handleRefreshAll = () => {
    refetchTriage()
    refetchRx()
    notify.info('Synchronized outpatient clinical queue live.')
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-text-primary">
              Outpatient Clinical Flow
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs">
              Reception → Doctor → Pharmacy
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Capture front desk vitals, issue tokens, conduct physician consultations, and fulfill prescriptions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefreshAll}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsTriageOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-sm"
          >
            Reception Check-In & Token
          </Button>
        </div>
      </div>

      {/* 3-STEP PIPELINE OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Step 1: Reception */}
        <div
          onClick={() => setActiveStage('reception')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-soft flex flex-col justify-between ${
            activeStage === 'reception'
              ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
              : 'border-border bg-surface hover:border-primary/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                1
              </div>
              <div>
                <h3 className="font-bold text-xs text-text-primary uppercase tracking-wider">
                  Reception Desk
                </h3>
                <span className="text-[11px] text-text-secondary">Intake & Vitals Recording</span>
              </div>
            </div>
            <Badge variant="primary" size="sm">
              {totalTokens} Tokens Issued
            </Badge>
          </div>

          <div className="mt-4 pt-3 border-t border-border/80 flex items-center justify-between text-xs">
            <span className="text-text-secondary">Weight • BP • Sugar • Meds</span>
            <span className="font-bold text-primary flex items-center gap-1">
              <span>View Desk</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Step 2: Doctor */}
        <div
          onClick={() => setActiveStage('doctor')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-soft flex flex-col justify-between ${
            activeStage === 'doctor'
              ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
              : 'border-border bg-surface hover:border-primary/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500 font-bold text-xs">
                2
              </div>
              <div>
                <h3 className="font-bold text-xs text-text-primary uppercase tracking-wider">
                  Doctor Panel
                </h3>
                <span className="text-[11px] text-text-secondary">Vitals Review & Rx Issuance</span>
              </div>
            </div>
            <Badge variant="info" size="sm">
              {waitingForDoctorCount} In Queue
            </Badge>
          </div>

          <div className="mt-4 pt-3 border-t border-border/80 flex items-center justify-between text-xs">
            <span className="text-text-secondary">Vitals linked to Token #</span>
            <span className="font-bold text-sky-500 flex items-center gap-1">
              <span>Doctor Queue</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Step 3: Pharmacy */}
        <div
          onClick={() => setActiveStage('pharmacy')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-soft flex flex-col justify-between ${
            activeStage === 'pharmacy'
              ? 'border-emerald-500 bg-emerald-500/5 ring-2 ring-emerald-500/20'
              : 'border-border bg-surface hover:border-emerald-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold text-xs">
                3
              </div>
              <div>
                <h3 className="font-bold text-xs text-text-primary uppercase tracking-wider">
                  Pharmacy Panel
                </h3>
                <span className="text-[11px] text-text-secondary">Dispense & Stock Fulfillment</span>
              </div>
            </div>
            <Badge variant={pendingPharmacyCount > 0 ? 'warning' : 'success'} size="sm">
              {pendingPharmacyCount} To Dispense
            </Badge>
          </div>

          <div className="mt-4 pt-3 border-t border-border/80 flex items-center justify-between text-xs">
            <span className="text-text-secondary">{fulfilledCount} Fulfilled Today</span>
            <span className="font-bold text-emerald-500 flex items-center gap-1">
              <span>Dispensary</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* STAGE TOGGLE TABS & SEARCH BAR */}
      <div className="p-3.5 rounded-2xl border border-border bg-surface flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: 'all', label: 'All Lifecycle Stages' },
            { key: 'reception', label: '1. Reception (Vitals & Tokens)' },
            { key: 'doctor', label: '2. Doctor (Vitals & Rx)' },
            { key: 'pharmacy', label: '3. Pharmacy (Fulfillment)' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveStage(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeStage === tab.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-border/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72 shrink-0">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Token (e.g. TK-101) or patient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-border bg-bg text-text-primary text-xs focus:outline-none focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* SECTION 1: RECEPTION PANEL (PATIENT DETAILS FORM & TOKENS) */}
      {(activeStage === 'all' || activeStage === 'reception') && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <h2 className="font-heading font-extrabold text-sm sm:text-base text-text-primary">
                Stage 1: Reception Desk — Tokens & Patient Vitals Reports
              </h2>
            </div>
            <Button
              variant="secondary"
              size="xs"
              onClick={() => setIsTriageOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Patient Vitals & Token
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTriage.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl border border-border bg-surface shadow-soft flex flex-col justify-between hover:border-primary/50 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/25 text-primary font-mono font-extrabold text-xs">
                        {item.tokenNumber}
                      </span>
                      <Badge
                        variant={
                          item.status === 'PHARMACY_FULFILLED'
                            ? 'success'
                            : item.status === 'PRESCRIBED'
                            ? 'info'
                            : 'primary'
                        }
                        size="xs"
                      >
                        {item.status === 'PHARMACY_FULFILLED'
                          ? 'Fulfilled at Pharmacy'
                          : item.status === 'PRESCRIBED'
                          ? 'Prescription Issued'
                          : 'Waiting for Doctor'}
                      </Badge>
                    </div>
                    <span className="text-[10px] text-text-muted">
                      {item.recordedAt ? new Date(item.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-sm text-text-primary mb-1">
                    {item.patientName}
                  </h3>
                  <p className="text-[11px] text-text-secondary mb-3">
                    Phone: {item.patientPhone || 'N/A'} • {item.patientGender}
                  </p>

                  {/* Vitals Summary Grid */}
                  <div className="p-3 rounded-xl bg-bg/60 border border-border grid grid-cols-3 gap-2 text-center text-xs mb-3">
                    <div>
                      <span className="text-[10px] text-text-muted block">Weight</span>
                      <span className="font-bold text-text-primary">{item.weight || '--'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-muted block">BP</span>
                      <span className="font-bold text-danger">{item.bp || '--'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-muted block">Sugar</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {item.sugarLevel ? item.sugarLevel.split(' ')[0] : '--'}
                      </span>
                    </div>
                  </div>

                  {/* Medications Preview */}
                  <div className="text-[11px] text-text-secondary mb-2 line-clamp-2">
                    <span className="font-semibold text-text-primary">Current Meds: </span>
                    {item.currentMedications || 'None reported'}
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-[11px] text-text-secondary">Dr: {item.doctorName}</span>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setSelectedDoctorPatient(item)}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Transfer to Doctor
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: DOCTOR PANEL (TOKEN QUEUE & CLINICAL CONSULTATION) */}
      {(activeStage === 'all' || activeStage === 'doctor') && (
        <div className="space-y-3.5 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              <h2 className="font-heading font-extrabold text-sm sm:text-base text-text-primary">
                Stage 2: Doctor Panel — Patient Vitals Review & Digital Prescription
              </h2>
            </div>
            <span className="text-xs text-text-secondary">
              Logged as: <strong className="text-text-primary">Dr. Sarah Al-Mansoor</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTriage.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border bg-surface shadow-soft flex flex-col justify-between transition-all ${
                  item.status === 'PRESCRIBED' || item.status === 'PHARMACY_FULFILLED'
                    ? 'border-success/30'
                    : 'border-sky-500/40 hover:border-sky-500'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 font-mono font-extrabold text-xs border border-sky-500/20">
                        {item.tokenNumber}
                      </span>
                      <span className="text-xs font-bold text-text-primary">{item.patientName}</span>
                    </div>

                    <Badge
                      variant={
                        item.status === 'PHARMACY_FULFILLED'
                          ? 'success'
                          : item.status === 'PRESCRIBED'
                          ? 'info'
                          : 'warning'
                      }
                      size="xs"
                      dot
                    >
                      {item.status === 'PHARMACY_FULFILLED'
                        ? 'Rx Dispensed'
                        : item.status === 'PRESCRIBED'
                        ? 'Rx Issued'
                        : 'Ready for Consult'}
                    </Badge>
                  </div>

                  {/* Doctor Vitals Inspection Bar */}
                  <div className="p-3 rounded-xl bg-surface border border-border/80 space-y-2 mb-3">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-text-secondary">Weight:</span>
                      <span className="font-bold text-text-primary">{item.weight || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-text-secondary">Blood Pressure:</span>
                      <span className="font-bold text-danger">{item.bp || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-text-secondary">Sugar Level:</span>
                      <span className="font-bold text-amber-500">{item.sugarLevel || 'N/A'}</span>
                    </div>
                    <div className="pt-1.5 border-t border-border/60 text-[11px]">
                      <span className="text-text-muted block text-[10px]">Tablets / Current Meds:</span>
                      <span className="font-medium text-text-primary line-clamp-1">
                        {item.currentMedications || 'None'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <span className="text-[11px] text-text-muted">
                    {item.notes ? item.notes.slice(0, 24) + '...' : 'Outpatient consultation'}
                  </span>

                  <Button
                    variant="primary"
                    size="xs"
                    onClick={() => setSelectedDoctorPatient(item)}
                    leftIcon={<Stethoscope className="w-3.5 h-3.5" />}
                    className="shadow-xs"
                  >
                    Review & Prescribe
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: PHARMACY PANEL (INCOMING PRESCRIPTIONS & FULFILLMENT) */}
      {(activeStage === 'all' || activeStage === 'pharmacy') && (
        <div className="space-y-3.5 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <h2 className="font-heading font-extrabold text-sm sm:text-base text-text-primary">
                Stage 3: Pharmacy Panel — Incoming Prescriptions & Dispensing Queue
              </h2>
            </div>
            <span className="text-xs text-text-secondary">
              Dispensing Station: <strong className="text-text-primary">Outpatient Dispensary A</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPrescriptions.map((rx) => {
              const rxToken =
                rx.tokenNumber ||
                (rx.notes && rx.notes.includes('[Token:')
                  ? rx.notes.match(/\[Token:\s*([^\]]+)\]/)?.[1]
                  : 'TK-101')
              const isFulfilled = rx.status === 'Fulfilled' || rx.status === 'Dispensed'

              return (
                <div
                  key={rx.id}
                  className={`p-4 rounded-2xl border bg-surface shadow-soft flex flex-col justify-between transition-all ${
                    isFulfilled ? 'border-emerald-500/30' : 'border-amber-500/40 hover:border-amber-500'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-extrabold text-xs border border-emerald-500/20">
                          {rxToken}
                        </span>
                        <span className="text-xs font-bold text-text-primary">{rx.patientName}</span>
                      </div>

                      <Badge variant={isFulfilled ? 'success' : 'warning'} size="xs" dot>
                        {isFulfilled ? 'Fulfilled / Dispensed' : 'Pending Dispense'}
                      </Badge>
                    </div>

                    <div className="text-xs text-text-secondary mb-2">
                      <span className="font-semibold text-text-primary">Diagnosis: </span>
                      {rx.diagnosis}
                    </div>

                    {/* Prescribed Drugs List */}
                    <div className="p-2.5 rounded-xl bg-bg border border-border space-y-1 mb-3">
                      <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider block">
                        Prescribed Drugs:
                      </span>
                      {(rx.medications || rx.items || []).map((m, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-primary">
                            {m.drug} {m.dosage}
                          </span>
                          <span className="text-[11px] text-text-secondary">{m.frequency}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    <span className="text-[10px] text-text-muted">
                      {isFulfilled ? 'Dispensed to Patient' : 'Awaiting fulfillment'}
                    </span>

                    <Button
                      variant={isFulfilled ? 'secondary' : 'primary'}
                      size="xs"
                      onClick={() => setSelectedPharmacyRx(rx)}
                      leftIcon={isFulfilled ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Boxes className="w-3.5 h-3.5" />}
                      className={!isFulfilled ? '!bg-emerald-600 hover:!bg-emerald-700 text-white shadow-xs' : ''}
                    >
                      {isFulfilled ? 'View Dispense Slip' : 'Fulfill & Dispense'}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: RECEPTION INTAKE & VITALS FORM */}
      {isTriageOpen && (
        <Suspense fallback={null}>
          <PatientDetailsTriageModal
            isOpen={isTriageOpen}
            onClose={() => setIsTriageOpen(false)}
            patientsList={patientsList}
            onSuccess={() => {
              refetchTriage()
              refetchRx()
            }}
          />
        </Suspense>
      )}

      {/* MODAL 2: DOCTOR VITALS REVIEW & PRESCRIPTION FORM */}
      {selectedDoctorPatient && (
        <Suspense fallback={null}>
          <DoctorVitalsReportModal
            isOpen={!!selectedDoctorPatient}
            onClose={() => setSelectedDoctorPatient(null)}
            patientData={selectedDoctorPatient}
            onPrescriptionSuccess={() => {
              refetchTriage()
              refetchRx()
            }}
          />
        </Suspense>
      )}

      {/* MODAL 3: PHARMACY FULFILLMENT MODAL */}
      {selectedPharmacyRx && (
        <Suspense fallback={null}>
          <PharmacyFulfillModal
            isOpen={!!selectedPharmacyRx}
            onClose={() => setSelectedPharmacyRx(null)}
            prescription={selectedPharmacyRx}
            onFulfillSuccess={() => {
              refetchTriage()
              refetchRx()
            }}
          />
        </Suspense>
      )}
    </div>
  )
}

export default PatientFlowPage
