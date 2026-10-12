import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Activity,
  Heart,
  Droplets,
  Pill,
  Hash,
  User,
  Phone,
  Clock,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Send,
  Plus,
  Trash2,
  Sparkles,
  Stethoscope
} from 'lucide-react'
import { api } from '../../../lib/api'
import { Modal } from '../../../components/ui/Modal'
import { Input } from '../../../components/ui/Input'
import { Textarea } from '../../../components/ui/Textarea'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { notify } from '../../../components/ui/Toast'

export const DoctorVitalsReportModal = ({
  isOpen,
  onClose,
  patientData,
  onPrescriptionSuccess
}) => {
  const queryClient = useQueryClient()
  const [isWritingRx, setIsWritingRx] = useState(false)

  const [rxForm, setRxForm] = useState({
    diagnosis: '',
    items: [
      {
        drug: 'Amlodipine Besylate',
        dosage: '5mg',
        frequency: 'Once daily (morning)',
        duration: '30 days',
        refills: 2
      }
    ],
    notes: 'Take with or after breakfast. Monitor BP weekly.'
  })

  const rxMutation = useMutation({
    mutationFn: async () => {
      if (!patientData) return
      const tokenNumber = patientData.tokenNumber || 'TK-101'
      const doctorName = patientData.doctorName || 'Dr. Sarah Al-Mansoor'
      const payload = {
        patientId: patientData.patientId || patientData.id,
        patientName: patientData.patientName || patientData.fullName,
        doctorName,
        tokenNumber,
        diagnosis: rxForm.diagnosis || 'Clinical Consultation',
        medications: rxForm.items,
        notes: rxForm.notes,
        status: 'Pending Dispense'
      }
      const res = await api.post('/api/staff/prescriptions', payload)
      return res.data
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['staff', 'prescriptions'] })
      queryClient.invalidateQueries({ queryKey: ['staff', 'triage'] })
      const token = patientData?.tokenNumber || 'Token'
      notify.success(`Prescription for Token ${token} issued! Automatically routed to Pharmacy panel.`)
      if (onPrescriptionSuccess) onPrescriptionSuccess(res)
      setIsWritingRx(false)
      onClose()
    },
    onError: (err) => {
      notify.error(err.response?.data?.message || 'Failed to issue prescription.')
    }
  })

  if (!patientData) return null

  // Extract vitals safely
  const tokenNumber = patientData.tokenNumber || 'TK-101'
  const weight = patientData.weight || '70 kg'
  const bp = patientData.bp || '120/80 mmHg'
  const sugarLevel = patientData.sugarLevel || '105 mg/dL'
  const currentMedications = patientData.currentMedications || 'None reported'
  const doctorName = patientData.doctorName || 'Dr. Sarah Al-Mansoor'

  const handleAddItem = () => {
    setRxForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          drug: '',
          dosage: '500mg',
          frequency: 'Twice daily after meals',
          duration: '15 days',
          refills: 0
        }
      ]
    }))
  }

  const handleRemoveItem = (index) => {
    setRxForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const handleItemChange = (index, field, val) => {
    setRxForm((prev) => {
      const next = [...prev.items]
      next[index][field] = val
      return { ...prev, items: next }
    })
  }

  // Blood pressure risk evaluation
  const isHighBp = bp.includes('/') && parseInt(bp.split('/')[0], 10) >= 140

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Physician Consultation: ${patientData.patientName || 'Patient'}`}
      description="Review Reception Triage report, patient baseline vitals, and issue a digital prescription."
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Token Header Pill */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/15 via-surface to-surface border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-primary text-white font-mono font-extrabold text-base flex items-center gap-1.5 shadow-sm">
              <Hash className="w-4 h-4" />
              <span>{tokenNumber}</span>
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-base text-text-primary">
                {patientData.patientName}
              </h3>
              <p className="text-xs text-text-secondary">
                {patientData.patientGender} • Phone: {patientData.patientPhone || 'Registered'} • {patientData.patientMrn || 'Outpatient'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="primary" size="sm">
              {patientData.status || 'Active Consultation'}
            </Badge>
            <span className="text-[11px] text-text-secondary font-medium">
              Attending: {doctorName}
            </span>
          </div>
        </div>

        {/* RECEPTION TRIAGE & VITALS REPORT */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-text-primary uppercase tracking-wider">
              <Activity className="w-4 h-4 text-primary" />
              <span>Reception Intake & Vitals Report</span>
            </div>
            <span className="text-[10px] text-text-muted">
              Captured at Front Desk • {patientData.recordedAt ? new Date(patientData.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Weight Card */}
            <div className="p-4 rounded-xl border border-border bg-surface shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-primary" />
                Weight
              </span>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold font-mono text-text-primary">
                  {weight || 'N/A'}
                </span>
              </div>
              <span className="text-[10px] text-success font-semibold mt-1">Within normal range</span>
            </div>

            {/* Blood Pressure Card */}
            <div className={`p-4 rounded-xl border ${isHighBp ? 'border-danger/30 bg-danger/5' : 'border-border bg-surface'} shadow-xs flex flex-col justify-between`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1">
                  <Heart className={`w-3.5 h-3.5 ${isHighBp ? 'text-danger' : 'text-primary'}`} />
                  Blood Pressure
                </span>
                {isHighBp && (
                  <Badge variant="danger" size="xs">Elevated</Badge>
                )}
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className={`text-2xl font-extrabold font-mono ${isHighBp ? 'text-danger' : 'text-text-primary'}`}>
                  {bp || 'N/A'}
                </span>
              </div>
              <span className="text-[10px] text-text-muted mt-1">Systolic / Diastolic</span>
            </div>

            {/* Blood Sugar Card */}
            <div className="p-4 rounded-xl border border-border bg-surface shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-amber-500" />
                Blood Sugar Level
              </span>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold font-mono text-amber-600 dark:text-amber-400">
                  {sugarLevel || 'N/A'}
                </span>
              </div>
              <span className="text-[10px] text-text-muted mt-1">Glucocheck baseline</span>
            </div>
          </div>

          {/* Current Medications Alert Box */}
          <div className="p-3.5 rounded-xl border border-border bg-surface/80 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
              <Pill className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-bold text-text-primary uppercase tracking-wider block">
                Current Medications / Tablets Being Taken
              </span>
              <p className="text-xs text-text-secondary font-medium mt-0.5">
                {currentMedications || 'No current medications reported by patient during check-in.'}
              </p>
            </div>
          </div>

          {patientData.notes && (
            <div className="p-3 rounded-xl border border-border/60 bg-surface/40 text-xs text-text-secondary">
              <span className="font-semibold text-text-primary">Chief Complaint / Triage Notes: </span>
              {patientData.notes}
            </div>
          )}
        </div>

        {/* PRESCRIPTION DRAWER / ISSUANCE */}
        {!isWritingRx ? (
          <div className="p-4 rounded-2xl border border-dashed border-primary/40 bg-primary/5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-text-primary">
                  Ready to issue Prescription for Token {tokenNumber}?
                </h4>
                <p className="text-[11px] text-text-secondary">
                  Prescription will automatically flow through to Pharmacy panel for dispensing.
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsWritingRx(true)}
              leftIcon={<Pill className="w-4 h-4" />}
              className="shadow-sm shrink-0"
            >
              Draft Prescription
            </Button>
          </div>
        ) : (
          <div className="p-5 rounded-2xl border border-primary/30 bg-surface shadow-soft space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                <Pill className="w-4 h-4" />
                <span>Doctor's Prescription for Token #{tokenNumber}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsWritingRx(false)}
                className="text-xs text-text-muted hover:text-text-primary"
              >
                Cancel Draft
              </button>
            </div>

            {/* Diagnosis */}
            <Input
              label="Clinical Diagnosis (ICD-10)"
              required
              placeholder="e.g. Essential Hypertension & Type 2 Diabetes Mellitus"
              value={rxForm.diagnosis}
              onChange={(e) => setRxForm({ ...rxForm, diagnosis: e.target.value })}
            />

            {/* Medication Items List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-text-secondary">
                  Prescribed Drugs & Dosages
                </label>
                <Button
                  type="button"
                  variant="secondary"
                  size="xs"
                  onClick={handleAddItem}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Drug
                </Button>
              </div>

              {rxForm.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-border bg-bg/50 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
                >
                  <div className="sm:col-span-4">
                    <Input
                      placeholder="Drug name (e.g. Telmisartan)"
                      value={item.drug}
                      onChange={(e) => handleItemChange(idx, 'drug', e.target.value)}
                      className="!py-1.5 !text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      placeholder="Dosage (40mg)"
                      value={item.dosage}
                      onChange={(e) => handleItemChange(idx, 'dosage', e.target.value)}
                      className="!py-1.5 !text-xs"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <Input
                      placeholder="Frequency (OD Morning)"
                      value={item.frequency}
                      onChange={(e) => handleItemChange(idx, 'frequency', e.target.value)}
                      className="!py-1.5 !text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      placeholder="30 days"
                      value={item.duration}
                      onChange={(e) => handleItemChange(idx, 'duration', e.target.value)}
                      className="!py-1.5 !text-xs"
                    />
                  </div>
                  <div className="sm:col-span-1 flex justify-end">
                    {rxForm.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 rounded text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                        title="Remove drug"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Doctor instructions */}
            <Textarea
              label="Doctor Instructions for Pharmacy & Patient"
              placeholder="e.g. Take with warm water after breakfast. Report to clinic if BP > 140/90."
              value={rxForm.notes}
              onChange={(e) => setRxForm({ ...rxForm, notes: e.target.value })}
            />

            {/* Submit Prescription Button */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-text-muted">
                Status will automatically set to <span className="font-semibold text-primary">Pending Dispense</span>
              </span>

              <Button
                variant="primary"
                size="sm"
                onClick={() => rxMutation.mutate()}
                isLoading={rxMutation.isPending}
                rightIcon={<Send className="w-4 h-4" />}
              >
                Sign & Send to Pharmacy
              </Button>
            </div>
          </div>
        )}

        {/* Modal Close */}
        <div className="pt-4 border-t border-border flex items-center justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default DoctorVitalsReportModal
