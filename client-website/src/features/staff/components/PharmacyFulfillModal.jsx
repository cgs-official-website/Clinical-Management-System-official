import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Pill,
  CheckCircle2,
  Printer,
  ArrowRight,
  ArrowLeft,
  Stethoscope,
  CalendarDays,
  Hash,
  ClipboardList,
  Minus,
  Plus,
  Banknote,
  Smartphone,
  CreditCard,
  Receipt,
  ShieldCheck,
  Check,
  Info,
} from 'lucide-react'
import { api } from '../../../lib/api'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { notify } from '../../../components/ui/Toast'
import { useAuthStore } from '../../../store/useAuthStore'
import { printReceipt } from '../../../lib/printReceipt'

/* ----------------------------- helpers ----------------------------- */

const PAYMENT_METHODS = [
  { value: 'Cash', label: 'Cash', icon: Banknote },
  { value: 'UPI', label: 'UPI', icon: Smartphone },
  { value: 'Card', label: 'Card', icon: CreditCard },
]

const STEPS = [
  { key: 'review', label: 'Review' },
  { key: 'pricing', label: 'Pricing' },
  { key: 'payment', label: 'Payment' },
]

const money = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const getInitials = (name = '') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'PT'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const formatDate = (value) => {
  if (!value) return 'Today'
  const d = new Date(value)
  if (isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Splits the raw notes into: token, clean doctor instructions, and the dispense record (if any)
const parseNotes = (notes = '') => {
  const raw = String(notes || '')
  const token = raw.match(/\[Token:\s*([^\]]+)\]/)?.[1] || ''
  const f = raw.match(/\[Fulfilled by\s+(.+?)\s+on\s+(.+?)\]:\s*([\s\S]*)$/)
  const clean = raw
    .replace(/\[Token:\s*[^\]]+\]/g, '')
    .replace(/\n?\s*\[Fulfilled by[\s\S]*$/, '')
    .trim()
  return {
    token,
    clean,
    fulfilled: f ? { by: f[1], on: f[2], note: (f[3] || '').trim() } : null,
  }
}

/* --------------------------- small UI parts --------------------------- */

const StatusPill = ({ done }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${done
        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25'
      }`}
  >
    <span className={`w-1.5 h-1.5 rounded-full ${done ? 'bg-emerald-500' : 'bg-amber-500'}`} />
    {done ? 'Dispensed' : 'Pending Dispense'}
  </span>
)

const InfoTile = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface/60 min-w-0">
    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4" />
    </div>
    <div className="min-w-0">
      <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">{label}</div>
      <div className="text-sm font-semibold text-text-primary truncate">{value || '--'}</div>
    </div>
  </div>
)

const SectionTitle = ({ icon: Icon, children, right }) => (
  <div className="flex items-center justify-between mb-2.5">
    <h4 className="text-[11px] font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
      {Icon && <Icon className="w-3.5 h-3.5 text-primary" />}
      {children}
    </h4>
    {right}
  </div>
)

const Stepper = ({ current }) => {
  const idx = STEPS.findIndex((s) => s.key === current)
  return (
    <div className="flex items-center">
      {STEPS.map((s, i) => {
        const done = i < idx
        const active = i === idx
        return (
          <React.Fragment key={s.key}>
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${done
                    ? 'bg-primary text-white border-primary'
                    : active
                      ? 'bg-primary/10 text-primary border-primary ring-4 ring-primary/10'
                      : 'bg-surface text-text-secondary border-border'
                  }`}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span
                className={`text-xs font-semibold hidden sm:block ${active ? 'text-text-primary' : 'text-text-secondary'
                  }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-3 ${i < idx ? 'bg-primary' : 'bg-border'}`} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

const fieldClass =
  'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all'

const FooterBar = ({ left, right }) => (
  <div className="pt-4 mt-1 border-t border-border flex items-center justify-between gap-3">
    <div className="min-w-0">{left}</div>
    <div className="flex items-center gap-2 shrink-0">{right}</div>
  </div>
)

/* ------------------------------ component ------------------------------ */

export const PharmacyFulfillModal = ({ isOpen, onClose, prescription, onFulfillSuccess }) => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [step, setStep] = useState('review') // review | pricing | payment | done
  const [lines, setLines] = useState([])
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [dispensedBy, setDispensedBy] = useState(user?.name || user?.fullName || 'Pharmacy Staff')
  const [dispenseNotes, setDispenseNotes] = useState('Medication verified against prescription and packaged for patient.')
  const [receipt, setReceipt] = useState(null)

  const isAlreadyFulfilled = prescription?.status === 'Fulfilled' || prescription?.status === 'Dispensed'

  const medications = useMemo(() => {
    if (!prescription) return []
    if (Array.isArray(prescription.medications)) return prescription.medications
    if (Array.isArray(prescription.items)) return prescription.items
    return []
  }, [prescription])

  const parsed = useMemo(() => parseNotes(prescription?.notes), [prescription?.notes])
  const tokenNumber = prescription?.tokenNumber || parsed.token || ''
  const issuedOn = formatDate(prescription?.date || prescription?.createdAt)

  // Inventory price list (used to auto-fill unit prices; optional)
  const { data: inventoryList = [] } = useQuery({
    queryKey: ['staff', 'inventory', 'price-lookup'],
    queryFn: async () => {
      const res = await api.get('/api/staff/inventory?limit=500')
      const body = res.data
      return Array.isArray(body) ? body : body?.data || body?.items || []
    },
    enabled: Boolean(isOpen && prescription && !isAlreadyFulfilled),
    staleTime: 60 * 1000,
    retry: false,
  })

  // Reset wizard every time a prescription is opened
  useEffect(() => {
    if (!isOpen || !prescription) return
    setStep('review')
    setReceipt(null)
    setPaymentMethod('Cash')
    setLines(
      medications.map((m) => ({
        drug: m.drug || 'Medicine',
        dosage: m.dosage || '',
        qty: 1,
        unitPrice: '',
        autoPriced: false,
      }))
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, prescription?.id])

  // Auto-fill unit price from inventory when the price is still empty
  useEffect(() => {
    if (!inventoryList.length) return
    setLines((prev) =>
      prev.map((ln) => {
        if (ln.unitPrice !== '' || ln.autoPriced) return ln
        const name = String(ln.drug).toLowerCase().trim()
        const match = inventoryList.find((it) => {
          const inv = String(it.name || '').toLowerCase().trim()
          return inv && name && (inv.includes(name) || name.includes(inv))
        })
        const price = Number(match?.unitPrice ?? match?.sellingPrice)
        if (match && price > 0) return { ...ln, unitPrice: String(price), autoPriced: true }
        return ln
      })
    )
  }, [inventoryList, prescription?.id])

  const lineTotal = (ln) => (Number(ln.qty) || 0) * (Number(ln.unitPrice) || 0)
  const grandTotal = lines.reduce((sum, ln) => sum + lineTotal(ln), 0)
  const pricingValid = lines.length > 0 && lines.every((ln) => Number(ln.qty) > 0 && Number(ln.unitPrice) > 0)

  const updateLine = (idx, patch) =>
    setLines((prev) =>
      prev.map((ln, i) =>
        i === idx
          ? { ...ln, ...patch, autoPriced: patch.unitPrice !== undefined ? false : ln.autoPriced }
          : ln
      )
    )

  const payAndFulfillMutation = useMutation({
    mutationFn: async () => {
      const items = lines.map((ln) => ({
        description: `Rx: ${ln.drug}${ln.dosage ? ' ' + ln.dosage : ''} x ${ln.qty} @ ${money(ln.unitPrice)}`,
        code: 'PHARMACY',
        fee: lineTotal(ln),
      }))

      // 1. Create the PAID invoice (shows up in Billing & Invoices)
      const invRes = await api.post('/api/staff/billing', {
        patientId: prescription.patientId || undefined,
        patientName: prescription.patientName || undefined,
        appointmentId: prescription.appointmentId || undefined,
        items,
        status: 'PAID',
        paymentMethod,
        taxRate: 0,
      })
      const inv = invRes.data?.data && !invRes.data?.invoiceNumber ? invRes.data.data : invRes.data

      // 2. Mark prescription as fulfilled / dispensed
      try {
        await api.patch(`/api/staff/prescriptions/${prescription.id}/fulfill`, {
          dispensedBy,
          dispenseNotes,
        })
      } catch (err) {
        err.invoiceNumber = inv?.invoiceNumber
        throw err
      }

      return inv
    },
    onSuccess: (inv) => {
      queryClient.invalidateQueries({ queryKey: ['staff', 'prescriptions'] })
      queryClient.invalidateQueries({ queryKey: ['staff', 'triage'] })
      queryClient.invalidateQueries({ queryKey: ['staff', 'inventory'] })
      queryClient.invalidateQueries({ queryKey: ['staff', 'billing'] })

      setReceipt({
        invoiceNumber: inv?.invoiceNumber || '-',
        date: inv?.createdAt || new Date().toISOString(),
        patientName: prescription.patientName,
        tokenNumber,
        paymentMethod,
        status: 'PAID',
        servedBy: dispensedBy,
        items: lines.map((ln) => ({
          description: `${ln.drug}${ln.dosage ? ' ' + ln.dosage : ''} x ${ln.qty} @ ${money(ln.unitPrice)}`,
          amount: lineTotal(ln),
        })),
        total: grandTotal,
      })
      setStep('done')
      notify.success(`Payment received. Invoice ${inv?.invoiceNumber || ''} created & prescription fulfilled!`)
      if (onFulfillSuccess) onFulfillSuccess(inv)
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.response?.data?.error?.message || err.message
      if (err.invoiceNumber) {
        notify.error(`Invoice ${err.invoiceNumber} was created but fulfilling failed: ${msg}`)
        queryClient.invalidateQueries({ queryKey: ['staff', 'billing'] })
      } else {
        notify.error(msg || 'Failed to complete payment.')
      }
    },
  })

  if (!prescription) return null

  const handleClose = () => {
    setStep('review')
    onClose()
  }

  const showWizard = !isAlreadyFulfilled && step !== 'done'
  const isDispensed = isAlreadyFulfilled || step === 'done'

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Pharmacy Dispense & Billing"
      description="Verify the prescription, price the medicines, collect payment and print the receipt."
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {/* ---------- Patient header ---------- */}
        <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-surface to-surface">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-primary text-white font-heading font-extrabold text-base flex items-center justify-center shadow-sm shrink-0">
              {getInitials(prescription.patientName)}
            </div>
            <div className="min-w-0">
              <div className="font-heading font-extrabold text-lg text-text-primary leading-tight truncate">
                {prescription.patientName || 'Patient'}
              </div>
              <div className="text-xs text-text-secondary mt-0.5 truncate">
                Prescribed by <span className="font-semibold text-text-primary">{prescription.doctorName || 'Attending MD'}</span>
              </div>
            </div>
          </div>
          <StatusPill done={isDispensed} />
        </div>

        {/* ---------- Info tiles ---------- */}
        {step !== 'done' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <InfoTile icon={Stethoscope} label="Diagnosis" value={prescription.diagnosis} />
            <InfoTile icon={Hash} label="Token" value={tokenNumber} />
            <InfoTile icon={CalendarDays} label="Issued" value={issuedOn} />
          </div>
        )}

        {/* ---------- Stepper ---------- */}
        {showWizard && <Stepper current={step} />}

        {/* ================= REVIEW (and read-only view when already dispensed) ================= */}
        {step !== 'done' && (step === 'review' || isAlreadyFulfilled) && (
          <div className="space-y-5">
            <div>
              <SectionTitle
                icon={Pill}
                right={
                  <span className="text-[11px] font-semibold text-text-secondary">
                    {medications.length} {medications.length === 1 ? 'medicine' : 'medicines'}
                  </span>
                }
              >
                Prescribed Medications
              </SectionTitle>
              <div className="space-y-2.5">
                {medications.map((med, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-surface hover:border-primary/40 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Pill className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-heading font-bold text-sm text-text-primary">{med.drug}</span>
                        {med.dosage && (
                          <span className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold">
                            {med.dosage}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary mt-1">
                        {[med.frequency, med.duration].filter(Boolean).join('  •  ')}
                        {med.refills ? `  •  ${med.refills} refills` : ''}
                      </p>
                    </div>
                  </div>
                ))}
                {medications.length === 0 && (
                  <div className="p-4 rounded-xl border border-dashed border-border text-xs text-text-secondary text-center">
                    No medications recorded on this prescription.
                  </div>
                )}
              </div>
            </div>

            {parsed.clean && (
              <div>
                <SectionTitle icon={ClipboardList}>Doctor Instructions</SectionTitle>
                <div className="p-3.5 rounded-xl border border-border bg-surface/60 text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">
                  {parsed.clean}
                </div>
              </div>
            )}

            {isAlreadyFulfilled && (
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-text-primary">Medicines dispensed</div>
                  <div className="text-xs text-text-secondary mt-0.5">
                    {parsed.fulfilled
                      ? `By ${parsed.fulfilled.by} on ${parsed.fulfilled.on}`
                      : 'This prescription has already been fulfilled.'}
                  </div>
                  {parsed.fulfilled?.note && (
                    <div className="text-xs text-text-secondary mt-1.5 italic">"{parsed.fulfilled.note}"</div>
                  )}
                </div>
              </div>
            )}

            {isAlreadyFulfilled ? (
              <FooterBar
                left={null}
                right={
                  <Button variant="secondary" size="sm" onClick={handleClose}>
                    Close
                  </Button>
                }
              />
            ) : (
              <FooterBar
                left={
                  <span className="text-[11px] text-text-secondary flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    Allergies checked against patient record
                  </span>
                }
                right={
                  <>
                    <Button variant="secondary" size="sm" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setStep('pricing')}
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Continue to Pricing
                    </Button>
                  </>
                }
              />
            )}
          </div>
        )}

        {/* ================= PRICING ================= */}
        {step === 'pricing' && !isAlreadyFulfilled && (
          <div className="space-y-4">
            <SectionTitle icon={Receipt}>Set quantity & price</SectionTitle>

            <div className="rounded-xl border border-border overflow-hidden">
              <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-2.5 bg-surface/70 border-b border-border text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                <div className="col-span-5">Medicine</div>
                <div className="col-span-3 text-center">Quantity</div>
                <div className="col-span-2">Price (₹)</div>
                <div className="col-span-2 text-right">Amount</div>
              </div>

              <div className="divide-y divide-border">
                {lines.map((ln, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-3 px-4 py-3.5 items-center">
                    <div className="col-span-12 sm:col-span-5 min-w-0">
                      <div className="font-bold text-sm text-text-primary truncate">{ln.drug}</div>
                      <div className="text-[11px] text-text-secondary">
                        {ln.dosage || '—'}
                        {ln.autoPriced && <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-semibold">• from inventory</span>}
                      </div>
                    </div>

                    <div className="col-span-5 sm:col-span-3 flex items-center justify-center">
                      <div className="inline-flex items-center rounded-lg border border-border bg-surface overflow-hidden">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() => updateLine(idx, { qty: Math.max(1, (Number(ln.qty) || 1) - 1) })}
                          className="w-8 h-9 flex items-center justify-center text-text-secondary hover:bg-border/50"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={ln.qty}
                          onChange={(e) => updateLine(idx, { qty: e.target.value })}
                          className="w-12 h-9 text-center text-sm font-semibold bg-transparent text-text-primary focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() => updateLine(idx, { qty: (Number(ln.qty) || 0) + 1 })}
                          className="w-8 h-9 flex items-center justify-center text-text-secondary hover:bg-border/50"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="col-span-4 sm:col-span-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={ln.unitPrice}
                        onChange={(e) => updateLine(idx, { unitPrice: e.target.value })}
                        className={fieldClass}
                      />
                    </div>

                    <div className="col-span-3 sm:col-span-2 text-right text-sm font-extrabold text-text-primary">
                      {money(lineTotal(ln))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between px-4 py-3.5 bg-primary/5 border-t border-primary/20">
                <span className="text-sm font-bold text-text-primary">Total to be paid</span>
                <span className="text-xl font-extrabold text-primary">{money(grandTotal)}</span>
              </div>
            </div>

            {!pricingValid && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" /> Enter a quantity and a price greater than 0 for every medicine.
              </p>
            )}

            <FooterBar
              left={
                <Button variant="secondary" size="sm" onClick={() => setStep('review')} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  Back
                </Button>
              }
              right={
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!pricingValid}
                  onClick={() => setStep('payment')}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Continue to Payment
                </Button>
              }
            />
          </div>
        )}

        {/* ================= PAYMENT ================= */}
        {step === 'payment' && !isAlreadyFulfilled && (
          <div className="space-y-5">
            {/* Bill summary */}
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-2.5 bg-surface/70 border-b border-border text-[10px] font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-primary" /> Bill summary
              </div>
              <div className="divide-y divide-border">
                {lines.map((ln, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs">
                    <div className="min-w-0">
                      <div className="font-semibold text-text-primary truncate">
                        {ln.drug} {ln.dosage}
                      </div>
                      <div className="text-text-secondary">
                        {ln.qty} × {money(ln.unitPrice)}
                      </div>
                    </div>
                    <div className="font-bold text-text-primary shrink-0">{money(lineTotal(ln))}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between px-4 py-3.5 bg-primary/5 border-t border-primary/20">
                <span className="text-sm font-bold text-text-primary">Amount to collect</span>
                <span className="text-xl font-extrabold text-primary">{money(grandTotal)}</span>
              </div>
            </div>

            {/* Payment method */}
            <div>
              <SectionTitle>Payment method</SectionTitle>
              <div className="grid grid-cols-3 gap-3">
                {PAYMENT_METHODS.map((pm) => {
                  const Icon = pm.icon
                  const active = paymentMethod === pm.value
                  return (
                    <button
                      key={pm.value}
                      type="button"
                      onClick={() => setPaymentMethod(pm.value)}
                      className={`flex flex-col items-center gap-1.5 py-3.5 rounded-xl border text-xs font-bold transition-all ${active
                          ? 'border-primary bg-primary/10 text-primary ring-4 ring-primary/10'
                          : 'border-border bg-surface text-text-secondary hover:border-primary/40 hover:text-text-primary'
                        }`}
                    >
                      <Icon className="w-5 h-5" />
                      {pm.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Pharmacist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                  Dispensing pharmacist
                </span>
                <input className={fieldClass} value={dispensedBy} onChange={(e) => setDispensedBy(e.target.value)} />
              </label>
              <label className="block">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                  Dispense notes
                </span>
                <input className={fieldClass} value={dispenseNotes} onChange={(e) => setDispenseNotes(e.target.value)} />
              </label>
            </div>

            <FooterBar
              left={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setStep('pricing')}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                  disabled={payAndFulfillMutation.isPending}
                >
                  Back
                </Button>
              }
              right={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => payAndFulfillMutation.mutate()}
                  isLoading={payAndFulfillMutation.isPending}
                  className="!bg-emerald-600 hover:!bg-emerald-700 text-white shadow-sm"
                  rightIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Payment Received
                </Button>
              }
            />
          </div>
        )}

        {/* ================= DONE ================= */}
        {step === 'done' && receipt && (
          <div className="space-y-5">
            <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center shadow-md ring-8 ring-emerald-500/10">
                <Check className="w-8 h-8" strokeWidth={3} />
              </div>
              <h4 className="font-heading font-extrabold text-lg text-text-primary mt-4">Payment received</h4>
              <p className="text-xs text-text-secondary mt-1">Medicines dispensed and the prescription is marked fulfilled.</p>

              <div className="mt-5 grid grid-cols-3 gap-3 text-left">
                <div className="p-3 rounded-xl bg-surface border border-border">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Invoice</div>
                  <div className="font-mono text-xs font-bold text-text-primary mt-0.5 truncate">{receipt.invoiceNumber}</div>
                </div>
                <div className="p-3 rounded-xl bg-surface border border-border">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Paid via</div>
                  <div className="text-xs font-bold text-text-primary mt-0.5">{receipt.paymentMethod}</div>
                </div>
                <div className="p-3 rounded-xl bg-surface border border-border">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Amount</div>
                  <div className="text-xs font-extrabold text-primary mt-0.5">{money(receipt.total)}</div>
                </div>
              </div>
            </div>

            <FooterBar
              left={
                <button
                  type="button"
                  onClick={() => {
                    handleClose()
                    navigate('/app/staff/billing')
                  }}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  View in Billing / Invoices →
                </button>
              }
              right={
                <>
                  <Button variant="secondary" size="sm" onClick={handleClose}>
                    Close
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => printReceipt(receipt)} leftIcon={<Printer className="w-4 h-4" />}>
                    Print Receipt
                  </Button>
                </>
              }
            />
          </div>
        )}
      </div>
    </Modal>
  )
}

export default PharmacyFulfillModal
