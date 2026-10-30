import React, { useMemo, useState } from 'react'
import { Activity, CheckCircle2, Plus, Search, Trash2, X, Zap } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { useAuthStore } from '../../store/useAuthStore'
import { PatientPicker } from './components/PatientPicker'
import { Stat } from './components/Field'
import {
  cardioHttp,
  errorMessage,
  fmtDateTime,
  num,
  toLocalInput,
  useCardioAccess,
  useCardioList,
  useCardioMutation,
} from './cardioApi'

const RESOURCE = 'ecg-records'

/** Schematic Lead II style strip drawn from the recorded heart rate (not an acquired signal). */
const buildStrip = (heartRate, irregular) => {
  const W = 800
  const base = 60
  const interval = 6000 / Math.max(20, Math.min(300, heartRate || 70)) // 100 px per second
  const s = Math.min(1, interval / 130)
  let seed = 7
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280
  let x = interval * 0.3
  let d = `M 0 ${base}`
  while (x < W) {
    const p = (v) => (x + v * s).toFixed(1)
    if (!irregular) d += ` L ${p(0)} ${base} Q ${p(8)} ${base - 10} ${p(16)} ${base}`
    d += ` L ${p(30)} ${base} L ${p(34)} ${base + 5} L ${p(42)} ${base - 45} L ${p(48)} ${base + 25} L ${p(54)} ${base}`
    d += ` L ${p(70)} ${base} Q ${p(84)} ${base - 15} ${p(98)} ${base}`
    const step = irregular ? interval * (0.6 + rnd() * 0.8) : interval
    x += Math.max(step, 102 * s + 4)
  }
  return `${d} L ${W} ${base}`
}

const emptyForm = (cardiologist) => ({
  patientId: '',
  acquiredAt: toLocalInput(),
  rhythm: '',
  heartRate: '',
  prInterval: '',
  qrsDuration: '',
  qtcInterval: '',
  axis: '',
  stSegment: '',
  priority: 'ROUTINE',
  cardiologist: cardiologist || '',
  leadFindings: [],
})

const RHYTHM_SUGGESTIONS = [
  'Normal Sinus Rhythm',
  'Sinus Bradycardia',
  'Sinus Tachycardia',
  'Atrial Fibrillation',
  'Atrial Flutter',
  'Normal Sinus Rhythm with First-Degree AV Block',
  'Left Bundle Branch Block',
  'Right Bundle Branch Block',
]

export const EcgRecordsPage = () => {
  const { user } = useAuthStore()
  const { canCreate, canEdit, canDelete } = useCardioAccess('ecg_records')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [formError, setFormError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data, isLoading, isError, error } = useCardioList(RESOURCE, { search: search || undefined, limit: 100 })
  const records = data?.data || []
  const active = useMemo(() => records.find((r) => r.id === selectedId) || records[0], [records, selectedId])

  const createMutation = useCardioMutation(RESOURCE, (payload) => cardioHttp.post(RESOURCE, payload), {
    success: 'ECG recorded. It is waiting for cardiologist sign-off.',
    onSuccess: (res) => {
      setIsCreateOpen(false)
      setSelectedId(res?.data?.id || null)
    },
  })
  const signOffMutation = useCardioMutation(RESOURCE, (id) => cardioHttp.post(`${RESOURCE}/${id}/sign-off`), {
    success: 'ECG verified and signed off.',
  })
  const deleteMutation = useCardioMutation(RESOURCE, (id) => cardioHttp.del(`${RESOURCE}/${id}`), {
    success: 'ECG record deleted.',
    onSuccess: () => {
      setDeleteTarget(null)
      setSelectedId(null)
    },
  })

  const openCreate = () => {
    setForm(emptyForm(user?.fullName || user?.name))
    setFormError('')
    setIsCreateOpen(true)
  }

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const updateLead = (idx, key, value) =>
    setForm((f) => ({
      ...f,
      leadFindings: f.leadFindings.map((lf, i) => (i === idx ? { ...lf, [key]: value } : lf)),
    }))

  const submit = (e) => {
    e.preventDefault()
    if (!form.patientId) return setFormError('Please select a patient.')
    if (form.rhythm.trim().length < 2) return setFormError('Enter the rhythm interpretation.')
    const hr = num(form.heartRate)
    if (!hr) return setFormError('Enter the heart rate.')
    setFormError('')
    createMutation.mutate({
      patientId: form.patientId,
      acquiredAt: form.acquiredAt ? new Date(form.acquiredAt).toISOString() : undefined,
      rhythm: form.rhythm.trim(),
      heartRate: hr,
      prInterval: num(form.prInterval),
      qrsDuration: num(form.qrsDuration),
      qtcInterval: num(form.qtcInterval),
      axis: form.axis.trim() || undefined,
      stSegment: form.stSegment.trim() || undefined,
      priority: form.priority,
      cardiologist: form.cardiologist.trim() || undefined,
      leadFindings: form.leadFindings.filter((lf) => lf.lead.trim() && lf.interpretation.trim()),
    })
  }

  const irregular = active ? /fibrillation|flutter|irregular/i.test(active.rhythm) : false
  const stripPath = useMemo(() => (active ? buildStrip(active.heartRate, irregular) : ''), [active, irregular])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading font-extrabold text-2xl text-text-primary">12-Lead ECG / EKG Records</h1>
            <Badge variant="primary" size="sm">Electrophysiology & Waveform Telemetry</Badge>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Record ECG findings for registered patients, then have the cardiologist verify and sign off
          </p>
        </div>
        {canCreate && (
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={openCreate}>
            Record New ECG
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Recent Tracings ({data?.pagination?.total ?? records.length})
          </h2>
          <Input
            placeholder="Search patient name or MRN"
            leftIcon={<Search className="w-4 h-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
          )}
          {isError && <EmptyState title="Could not load ECG records" description={errorMessage(error)} />}
          {!isLoading && !isError && records.length === 0 && (
            <EmptyState
              icon={Activity}
              title={search ? 'No matching ECGs' : 'No ECG records yet'}
              description={
                search
                  ? 'Try a different name or MRN.'
                  : 'Recorded ECGs will appear here. Start by recording the first tracing for a registered patient.'
              }
              actionLabel={canCreate && !search ? 'Record New ECG' : undefined}
              onAction={openCreate}
            />
          )}

          {records.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${active?.id === item.id
                  ? 'border-primary bg-primary/5 shadow-soft'
                  : 'border-border bg-surface hover:border-border-hover'
                }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-primary">{item.ecgNumber}</span>
                <Badge variant={item.priority === 'ROUTINE' ? 'success' : 'danger'} size="sm">
                  {item.priority}
                </Badge>
              </div>
              <h3 className="font-semibold text-sm text-text-primary mt-1">{item.patientName}</h3>
              <p className="text-xs text-text-muted">
                {item.patientMrn} {item.patientAge !== null ? `• ${item.patientAge}y` : ''} {item.patientGender || ''}
              </p>
              <div className="mt-2 text-xs font-medium text-text-secondary line-clamp-1">{item.rhythm}</div>
              <div className="mt-3 flex items-center justify-between text-xs text-text-muted border-t border-border/40 pt-2">
                <span className="flex items-center gap-1 font-mono">
                  <Zap className="w-3.5 h-3.5 text-warning" /> {item.heartRate} bpm
                </span>
                <span>{fmtDateTime(item.acquiredAt)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Detail */}
        <div className="lg:col-span-2 space-y-6">
          {active ? (
            <div className="p-6 rounded-2xl border border-border bg-surface shadow-soft space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-text-primary">{active.patientName}</h2>
                    <Badge variant={active.status === 'VERIFIED' ? 'success' : 'warning'} size="sm">
                      {active.status === 'VERIFIED' ? 'VERIFIED' : 'REQUIRES REVIEW'}
                    </Badge>
                  </div>
                  <p className="text-xs text-text-muted font-mono mt-0.5">
                    Record: {active.ecgNumber} • Acquired: {fmtDateTime(active.acquiredAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {canEdit && active.status !== 'VERIFIED' && (
                    <Button
                      size="xs"
                      variant="outline"
                      isLoading={signOffMutation.isPending}
                      leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-success" />}
                      onClick={() => signOffMutation.mutate(active.id)}
                    >
                      Sign Off
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      size="xs"
                      variant="ghost"
                      leftIcon={<Trash2 className="w-3.5 h-3.5 text-danger" />}
                      onClick={() => setDeleteTarget(active)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>

              {/* Rhythm strip */}
              <div className="rounded-xl border border-border/80 bg-black/90 p-4 relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-emerald-400 font-mono mb-2">
                  <span>Speed: 25 mm/s | Voltage: 10 mm/mV</span>
                  <span className="flex items-center gap-1 text-emerald-300 font-bold">
                    <Activity className="w-3.5 h-3.5 animate-pulse" /> Lead II Rhythm Strip (schematic)
                  </span>
                </div>
                <div className="h-28 w-full flex items-center justify-center">
                  <svg viewBox="0 0 800 120" className="w-full h-full" fill="none" stroke="#34d399" strokeWidth="1.5">
                    <defs>
                      <pattern id="ecg-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="0.5" />
                      </pattern>
                    </defs>
                    <rect width="800" height="120" fill="url(#ecg-grid)" stroke="none" />
                    <path d={stripPath} />
                  </svg>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-emerald-500/80 font-mono">
                  <span>Drawn from the recorded heart rate, not a captured signal</span>
                  <span>
                    Heart Rate: {active.heartRate} BPM ({irregular ? 'Irregular' : 'Regular'})
                  </span>
                </div>
              </div>

              {/* Intervals */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat label="Ventricular Rate" value={active.heartRate} unit="bpm" />
                <Stat label="PR Interval" value={active.prInterval} unit="ms" />
                <Stat label="QRS Duration" value={active.qrsDuration} unit="ms" />
                <Stat label="QTc Interval" value={active.qtcInterval} unit="ms" />
              </div>

              {/* Interpretation */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Cardiologist Diagnostic Interpretation
                </h3>
                <div className="p-4 rounded-xl border border-border/80 bg-surface-secondary/30 space-y-2">
                  <div className="text-sm font-semibold text-text-primary">{active.rhythm}</div>
                  {(active.axis || active.stSegment) && (
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {active.axis ? `Axis: ${active.axis}. ` : ''}
                      {active.stSegment ? `ST Segment: ${active.stSegment}.` : ''}
                    </p>
                  )}
                  <div className="text-xs text-primary font-medium pt-1">
                    Interpreting Attending: {active.cardiologist || 'Not assigned'}
                    {active.signedOffAt ? ` • Signed ${fmtDateTime(active.signedOffAt)}` : ''}
                  </div>
                </div>
              </div>

              {Array.isArray(active.leadFindings) && active.leadFindings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-text-muted uppercase">Regional Lead Breakdown</h4>
                  <div className="space-y-1.5">
                    {active.leadFindings.map((lf, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-3 text-xs p-2 rounded-lg bg-surface border border-border"
                      >
                        <span className="font-semibold text-text-primary">{lf.lead}</span>
                        <span className="text-text-secondary text-right">{lf.interpretation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            !isLoading && (
              <EmptyState
                icon={Activity}
                title="No ECG selected"
                description="Select a tracing on the left to see intervals, interpretation and lead findings."
              />
            )
          )}
        </div>
      </div>

      {/* Create modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Record New ECG"
        description="Enter the machine measurements and your interpretation"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={submit} className="space-y-4">
          <PatientPicker value={form.patientId} onChange={(v) => setForm((f) => ({ ...f, patientId: v }))} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Acquired at" type="datetime-local" value={form.acquiredAt} onChange={setField('acquiredAt')} />
            <Select label="Priority" value={form.priority} onChange={setField('priority')}>
              <option value="ROUTINE">Routine</option>
              <option value="URGENT">Urgent</option>
              <option value="STAT">STAT</option>
            </Select>
          </div>

          <div>
            <Input
              label="Rhythm interpretation"
              required
              list="ecg-rhythms"
              placeholder="e.g. Normal Sinus Rhythm"
              value={form.rhythm}
              onChange={setField('rhythm')}
            />
            <datalist id="ecg-rhythms">
              {RHYTHM_SUGGESTIONS.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Input label="Heart rate (bpm)" type="number" required min="20" max="300" value={form.heartRate} onChange={setField('heartRate')} />
            <Input label="PR (ms)" type="number" min="50" max="600" value={form.prInterval} onChange={setField('prInterval')} />
            <Input label="QRS (ms)" type="number" min="40" max="300" value={form.qrsDuration} onChange={setField('qrsDuration')} />
            <Input label="QTc (ms)" type="number" min="200" max="700" value={form.qtcInterval} onChange={setField('qtcInterval')} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Axis" placeholder="e.g. +45 (normal)" value={form.axis} onChange={setField('axis')} />
            <Input label="ST segment" placeholder="e.g. No acute ST changes" value={form.stSegment} onChange={setField('stSegment')} />
          </div>

          <Input label="Interpreting cardiologist" value={form.cardiologist} onChange={setField('cardiologist')} />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-primary">Lead findings (optional)</span>
              <Button
                size="xs"
                variant="outline"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() =>
                  setForm((f) => ({ ...f, leadFindings: [...f.leadFindings, { lead: '', interpretation: '' }] }))
                }
                disabled={form.leadFindings.length >= 12}
              >
                Add finding
              </Button>
            </div>
            {form.leadFindings.map((lf, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_2fr_auto] gap-2 items-end">
                <Input
                  placeholder="Leads (e.g. V1-V2)"
                  value={lf.lead}
                  onChange={(e) => updateLead(idx, 'lead', e.target.value)}
                />
                <Input
                  placeholder="Finding"
                  value={lf.interpretation}
                  onChange={(e) => updateLead(idx, 'interpretation', e.target.value)}
                />
                <button
                  type="button"
                  aria-label="Remove finding"
                  className="p-2.5 rounded-xl text-text-secondary hover:text-danger hover:bg-danger/10"
                  onClick={() => setForm((f) => ({ ...f, leadFindings: f.leadFindings.filter((_, i) => i !== idx) }))}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {formError && <p className="text-xs text-danger font-medium">{formError}</p>}

          <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
            <Button variant="secondary" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={createMutation.isPending}>
              Save ECG
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        isLoading={deleteMutation.isPending}
        title="Delete ECG record"
        message={`Delete ${deleteTarget?.ecgNumber} for ${deleteTarget?.patientName}? This cannot be undone.`}
      />
    </div>
  )
}

export default EcgRecordsPage
