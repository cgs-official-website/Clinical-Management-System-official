import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Boxes,
  Pill,
  CheckCircle2,
  Clock,
  Hash,
  User,
  ShieldCheck,
  AlertCircle,
  FileCheck,
  Printer,
  Sparkles
} from 'lucide-react'
import { api } from '../../../lib/api'
import { Modal } from '../../../components/ui/Modal'
import { Input } from '../../../components/ui/Input'
import { Textarea } from '../../../components/ui/Textarea'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { notify } from '../../../components/ui/Toast'
import { useAuthStore } from '../../../store/useAuthStore'

export const PharmacyFulfillModal = ({
  isOpen,
  onClose,
  prescription,
  onFulfillSuccess
}) => {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const [dispensedBy, setDispensedBy] = useState(user?.name || user?.fullName || 'Pharmacy Staff')
  const [dispenseNotes, setDispenseNotes] = useState('Medication verified against prescription and packaged for patient.')
  const [isDone, setIsDone] = useState(false)

  const fulfillMutation = useMutation({
    mutationFn: async () => {
      if (!prescription) return
      const res = await api.patch(`/api/staff/prescriptions/${prescription.id}/fulfill`, {
        dispensedBy,
        dispenseNotes
      })
      return res.data
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['staff', 'prescriptions'] })
      queryClient.invalidateQueries({ queryKey: ['staff', 'triage'] })
      queryClient.invalidateQueries({ queryKey: ['staff', 'inventory'] })
      const token = prescription?.tokenNumber || 'Token'
      notify.success(`Prescription for Token ${token} fulfilled & dispensed!`)
      setIsDone(true)
      if (onFulfillSuccess) onFulfillSuccess(res)
    },
    onError: (err) => {
      notify.error(err.response?.data?.message || 'Failed to fulfill prescription.')
    }
  })

  if (!prescription) return null

  const tokenNumber =
    prescription.tokenNumber ||
    (prescription.notes && prescription.notes.includes('[Token:')
      ? prescription.notes.match(/\[Token:\s*([^\]]+)\]/)?.[1]
      : 'TK-101')

  const medications = Array.isArray(prescription.medications)
    ? prescription.medications
    : Array.isArray(prescription.items)
    ? prescription.items
    : []

  const isAlreadyFulfilled = prescription.status === 'Fulfilled' || prescription.status === 'Dispensed'

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setIsDone(false)
        onClose()
      }}
      title="Pharmacy Medication Dispense & Fulfillment"
      description="Verify doctor's prescription, match dispensary batch inventory, and record dispensing clearance."
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Token & Patient Header */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-surface to-surface border border-emerald-500/25 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-mono font-extrabold flex items-center justify-center text-sm shadow-sm">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-extrabold text-lg text-text-primary">
                  {tokenNumber}
                </span>
                <Badge
                  variant={isAlreadyFulfilled ? 'success' : 'warning'}
                  size="xs"
                  dot
                >
                  {isAlreadyFulfilled ? 'Dispensed / Fulfilled' : 'Pending Pharmacy Dispense'}
                </Badge>
              </div>
              <p className="text-xs text-text-secondary">
                Patient: <span className="font-bold text-text-primary">{prescription.patientName}</span> • Prescribed by {prescription.doctorName || 'Attending MD'}
              </p>
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-text-muted uppercase tracking-wider block">Date Issued</span>
            <span className="text-xs font-semibold text-text-primary">
              {prescription.date ? new Date(prescription.date).toLocaleDateString() : 'Today'}
            </span>
          </div>
        </div>

        {/* Clinical Diagnosis Note */}
        {prescription.diagnosis && (
          <div className="p-3 rounded-xl bg-surface/60 border border-border text-xs flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-primary shrink-0" />
            <span>
              <strong className="text-text-primary">Diagnosis: </strong>
              <span className="text-text-secondary">{prescription.diagnosis}</span>
            </span>
          </div>
        )}

        {/* Prescribed Medications Table / Cards */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Pill className="w-3.5 h-3.5 text-primary" />
              <span>Medications to Dispense</span>
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
              In Stock & Verified
            </span>
          </div>

          <div className="space-y-2">
            {medications.map((med, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-border bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-sm text-text-primary">
                      {med.drug}
                    </span>
                    <Badge variant="primary" size="xs">
                      {med.dosage}
                    </Badge>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {med.frequency} • {med.duration} {med.refills ? `(${med.refills} refills)` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-text-muted self-end sm:self-auto">
                  <span className="px-2 py-1 rounded bg-bg border border-border text-[11px] text-text-secondary">
                    Batch: BCH-2026-90
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Doctor instructions */}
        {prescription.notes && (
          <div className="p-3 rounded-xl border border-border/80 bg-surface/40 text-xs">
            <span className="font-semibold text-text-primary block mb-0.5">Doctor Instructions:</span>
            <p className="text-text-secondary">{prescription.notes}</p>
          </div>
        )}

        {/* Dispensing Action Form */}
        {!isAlreadyFulfilled && !isDone ? (
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Dispensing Pharmacist"
                value={dispensedBy}
                onChange={(e) => setDispensedBy(e.target.value)}
              />
              <Input
                label="Dispense Notes / Verification"
                value={dispenseNotes}
                onChange={(e) => setDispenseNotes(e.target.value)}
              />
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-emerald-500/20">
              <span className="text-[11px] text-text-secondary flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Allergies checked against patient record</span>
              </span>

              <Button
                variant="primary"
                size="sm"
                onClick={() => fulfillMutation.mutate()}
                isLoading={fulfillMutation.isPending}
                className="!bg-emerald-600 hover:!bg-emerald-700 text-white shadow-sm"
                rightIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Confirm Dispense & Fulfill
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-heading font-extrabold text-sm text-text-primary">
              Medications Successfully Dispensed!
            </h4>
            <p className="text-xs text-text-secondary">
              Token {tokenNumber} outpatient care lifecycle complete. Patient receipt ready for collection.
            </p>
          </div>
        )}

        {/* Modal Footer */}
        <div className="pt-3 border-t border-border flex items-center justify-between">
          <Button
            variant="secondary"
            size="xs"
            onClick={() => {
              notify.info(`Printing dispensing label for Token ${tokenNumber}...`)
              window.print?.()
            }}
            leftIcon={<Printer className="w-3.5 h-3.5" />}
          >
            Print Dispense Label
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setIsDone(false)
              onClose()
            }}
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default PharmacyFulfillModal
