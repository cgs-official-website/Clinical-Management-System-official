import React, { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Activity,
  Heart,
  Droplets,
  Pill,
  Hash,
  User,
  Phone,
  Calendar,
  Sparkles,
  RefreshCw,
  Clock,
  CheckCircle2,
  Stethoscope,
  AlertCircle
} from 'lucide-react'
import { api } from '../../../lib/api'
import { Modal } from '../../../components/ui/Modal'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import { Textarea } from '../../../components/ui/Textarea'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { notify } from '../../../components/ui/Toast'

export const PatientDetailsTriageModal = ({
  isOpen,
  onClose,
  initialPatient = null,
  patientsList = [],
  onSuccess
}) => {
  const queryClient = useQueryClient()

  // Generate a realistic sequential token
  const generateToken = () => {
    const num = Math.floor(100 + Math.random() * 900)
    return `TK-${num}`
  }

  const [patientMode, setPatientMode] = useState('select') // 'select' | 'new'
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [formData, setFormData] = useState({
    tokenNumber: generateToken(),
    patientName: '',
    phone: '',
    gender: 'Female',
    dob: '1990-01-01',
    weight: '',
    weightUnit: 'kg',
    bpSystolic: '',
    bpDiastolic: '',
    sugarLevel: '',
    sugarType: 'Fasting',
    currentMedications: '',
    doctorName: 'Dr. Sarah Al-Mansoor',
    notes: ''
  })

  // Pre-fill if initialPatient was passed
  useEffect(() => {
    if (initialPatient) {
      setPatientMode('select')
      setSelectedPatientId(initialPatient.id || '')
      setFormData((prev) => ({
        ...prev,
        patientName: initialPatient.fullName || initialPatient.name || '',
        phone: initialPatient.phone || '',
        gender: initialPatient.gender || 'Female',
        dob: initialPatient.dob ? initialPatient.dob.slice(0, 10) : '1990-01-01',
        weight: initialPatient.medicalHistory?.latestVitals?.weight?.replace(' kg', '') || prev.weight,
        currentMedications: initialPatient.medicalHistory?.latestVitals?.currentMedications || prev.currentMedications
      }))
    } else {
      setFormData((prev) => ({ ...prev, tokenNumber: generateToken() }))
    }
  }, [initialPatient, isOpen])

  const handlePatientSelect = (patId) => {
    setSelectedPatientId(patId)
    const pat = patientsList.find((p) => p.id === patId)
    if (pat) {
      setFormData((prev) => ({
        ...prev,
        patientName: pat.fullName || pat.name || '',
        phone: pat.phone || '',
        gender: pat.gender || 'Female',
        dob: pat.dob ? pat.dob.slice(0, 10) : '1990-01-01',
        weight: pat.medicalHistory?.latestVitals?.weight?.replace(' kg', '') || prev.weight,
        currentMedications: pat.medicalHistory?.latestVitals?.currentMedications || prev.currentMedications
      }))
    }
  }

  const triageMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/api/staff/triage', payload)
      return res.data
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['staff', 'triage'] })
      queryClient.invalidateQueries({ queryKey: ['staff', 'appointments'] })
      queryClient.invalidateQueries({ queryKey: ['staff', 'patients'] })
      notify.success(`Token ${formData.tokenNumber} issued! Patient transferred to Doctor's queue.`)
      if (onSuccess) onSuccess(res)
      onClose()
    },
    onError: (err) => {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to save patient details & triage report.'
      notify.error(msg)
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()

    const bp =
      formData.bpSystolic && formData.bpDiastolic
        ? `${formData.bpSystolic}/${formData.bpDiastolic} mmHg`
        : formData.bpSystolic || ''

    const sugar = formData.sugarLevel
      ? `${formData.sugarLevel} mg/dL (${formData.sugarType})`
      : ''

    const payload = {
      tokenNumber: formData.tokenNumber,
      patientId: patientMode === 'select' ? selectedPatientId : undefined,
      patientName: formData.patientName,
      phone: formData.phone,
      gender: formData.gender,
      dob: formData.dob,
      weight: formData.weight ? `${formData.weight} ${formData.weightUnit}` : '',
      bp,
      sugarLevel: sugar,
      currentMedications: formData.currentMedications,
      doctorName: formData.doctorName,
      notes: formData.notes
    }

    triageMutation.mutate(payload)
  }

  // BP classification helper
  const getBpClass = () => {
    const sys = parseInt(formData.bpSystolic, 10)
    const dia = parseInt(formData.bpDiastolic, 10)
    if (!sys || !dia) return null
    if (sys >= 140 || dia >= 90) return { label: 'Hypertensive Stage', color: 'text-danger bg-danger/10 border-danger/30' }
    if (sys >= 120 || dia >= 80) return { label: 'Elevated BP', color: 'text-warning bg-warning/10 border-warning/30' }
    return { label: 'Normal BP', color: 'text-success bg-success/10 border-success/30' }
  }

  const bpStatus = getBpClass()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reception Patient Check-In & Vitals Report"
      description="Record baseline vitals, current medications, and issue an outpatient consultation token for the Doctor."
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Token Badge Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-primary/15 via-primary/5 to-surface border border-primary/25 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold font-mono text-sm shadow-sm">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block">
                Outpatient Queue Token
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-heading font-extrabold text-primary font-mono tracking-tight">
                  {formData.tokenNumber}
                </span>
                <span className="text-[10px] text-text-secondary">
                  (Assigned to Dr. {formData.doctorName.replace('Dr. ', '')})
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setFormData({ ...formData, tokenNumber: generateToken() })}
            className="p-1.5 rounded-lg border border-border bg-surface hover:bg-surface/80 text-text-secondary hover:text-primary transition-colors text-xs flex items-center gap-1 shadow-xs"
            title="Generate new random token"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px] font-medium">Regenerate</span>
          </button>
        </div>

        {/* Patient Selection Segment */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-primary" />
              <span>1. Patient Identification</span>
            </label>
            <div className="p-0.5 rounded-lg bg-border/40 flex items-center text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPatientMode('select')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  patientMode === 'select'
                    ? 'bg-surface text-primary shadow-xs font-bold'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Existing Patient
              </button>
              <button
                type="button"
                onClick={() => {
                  setPatientMode('new')
                  setSelectedPatientId('')
                }}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  patientMode === 'new'
                    ? 'bg-surface text-primary shadow-xs font-bold'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Walk-In / New
              </button>
            </div>
          </div>

          {patientMode === 'select' ? (
            <div>
              <Select
                label="Select Registered Patient"
                required
                value={selectedPatientId}
                onChange={(e) => handlePatientSelect(e.target.value)}
                options={[
                  { value: '', label: '-- Choose patient from records --' },
                  ...patientsList.map((p) => ({
                    value: p.id,
                    label: `${p.fullName || p.name} (${p.mrn || 'MRN'} • ${p.phone || 'No phone'})`
                  }))
                ]}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl border border-border bg-surface/50">
              <Input
                label="Full Legal Name"
                required
                placeholder="e.g. Liam Reyes"
                value={formData.patientName}
                onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
              />
              <Input
                label="Contact Phone"
                required
                placeholder="e.g. +91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <Select
                label="Gender"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                options={[
                  { value: 'Female', label: 'Female' },
                  { value: 'Male', label: 'Male' },
                  { value: 'Other', label: 'Other' }
                ]}
              />
              <Input
                label="Date of Birth"
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              />
            </div>
          )}
        </div>

        {/* Vitals Intake Form */}
        <div className="space-y-3 pt-2 border-t border-border">
          <label className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-primary" />
            <span>2. Baseline Vitals & Physiological Report</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Weight */}
            <div className="p-3 rounded-xl border border-border bg-surface flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-text-secondary flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-primary" />
                  Weight
                </span>
                <span className="text-[10px] text-text-muted font-mono">kg</span>
              </div>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g. 68.5"
                required
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="!py-1.5 text-sm font-bold"
              />
            </div>

            {/* Blood Pressure */}
            <div className="p-3 rounded-xl border border-border bg-surface flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-text-secondary flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-danger" />
                  BP (Systolic / Diastolic)
                </span>
                {bpStatus && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${bpStatus.color}`}>
                    {bpStatus.label}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  placeholder="120"
                  required
                  value={formData.bpSystolic}
                  onChange={(e) => setFormData({ ...formData, bpSystolic: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-lg border border-border bg-bg text-text-primary text-sm font-bold text-center focus:outline-none focus:border-primary"
                />
                <span className="text-text-muted font-bold">/</span>
                <input
                  type="number"
                  placeholder="80"
                  required
                  value={formData.bpDiastolic}
                  onChange={(e) => setFormData({ ...formData, bpDiastolic: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-lg border border-border bg-bg text-text-primary text-sm font-bold text-center focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Sugar Level */}
            <div className="p-3 rounded-xl border border-border bg-surface flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-text-secondary flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-amber-500" />
                  Blood Sugar (Optional)
                </span>
                <select
                  value={formData.sugarType}
                  onChange={(e) => setFormData({ ...formData, sugarType: e.target.value })}
                  className="text-[10px] bg-bg border border-border rounded px-1 py-0.5 text-text-secondary focus:outline-none"
                >
                  <option value="Fasting">Fasting</option>
                  <option value="Random">Random</option>
                  <option value="Post-Prandial">Post-Prandial</option>
                </select>
              </div>
              <Input
                type="number"
                placeholder="e.g. 110"
                value={formData.sugarLevel}
                onChange={(e) => setFormData({ ...formData, sugarLevel: e.target.value })}
                className="!py-1.5 text-sm font-bold"
              />
            </div>
          </div>

          {/* Current Medications / Tablets being taken */}
          <div className="p-3 rounded-xl border border-border bg-surface space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-text-secondary flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5 text-primary" />
                <span>Current Medications / Tablets Being Taken</span>
              </label>
              <span className="text-[10px] text-text-muted">Over-the-counter or ongoing prescription</span>
            </div>
            <Input
              placeholder="e.g. Metformin 500mg (twice daily), Telmisartan 40mg (morning), Aspirin 75mg"
              value={formData.currentMedications}
              onChange={(e) => setFormData({ ...formData, currentMedications: e.target.value })}
            />
          </div>
        </div>

        {/* Assigned Physician & Reason */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
          <Select
            label="Assigned Attending Doctor"
            value={formData.doctorName}
            onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
            options={[
              { value: 'Dr. Sarah Al-Mansoor', label: 'Dr. Sarah Al-Mansoor (Cardiology / Internal Med)' },
              { value: 'Dr. Evelyn Vance', label: 'Dr. Evelyn Vance (Chief Physician)' },
              { value: 'Dr. Gregory House', label: 'Dr. Gregory House (Diagnostic Medicine)' }
            ]}
          />
          <Input
            label="Chief Complaint / Reason for Visit"
            placeholder="e.g. Routine hypertension review & refill"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-border flex items-center justify-between">
          <div className="text-[11px] text-text-secondary flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span>Transmits immediately to Doctor's live queue</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={triageMutation.isPending}
              rightIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Save Report & Issue Token
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

export default PatientDetailsTriageModal
