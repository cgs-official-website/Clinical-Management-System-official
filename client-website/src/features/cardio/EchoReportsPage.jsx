import React, { useMemo, useState } from 'react'
import { CheckCircle2, FileText, Heart, Plus, Search, Trash2, X } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { Modal } from '../../components/ui/Modal'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { useAuthStore } from '../../store/useAuthStore'
import { PatientPicker } from './components/PatientPicker'
import {
  cardioHttp,
  errorMessage,
  fmtDate,
  num,
  useCardioAccess,
  useCardioList,
  useCardioMutation,
} from './cardioApi'

const RESOURCE = 'echo-reports'

const MODALITIES = [
  'Transthoracic Echocardiogram (TTE)',
  'Transesophageal Echocardiogram (TEE)',
  'Stress Echocardiogram',
]
const VALVES = ['Aortic Valve', 'Mitral Valve', 'Tricuspid Valve', 'Pulmonic Valve']

// AHA/ACC heart failure classification thresholds
const efCategory = (ef) => {
  if (ef >= 50) return 'Preserved (50% or above)'
  if (ef >= 41) return 'Mildly reduced (41-49%)'
  return 'Reduced (40% or below)'
}

const today = () => new Date().toISOString().slice(0, 10)

const emptyForm = (cardiologist) => ({
  patientId: '',
  studyDate: today(),
  modality: MODALITIES[0],
  indication: '',
  sonographer: '',
  cardiologist: cardiologist || '',
  efPercent: '',
  lvedd: '',
  lvesd: '',
  ivsd: '',
  pwd: '',
  laVolumeIndex: '',
  valves: [],
  wallMotion: '',
  conclusionsText: '',
})

const Dim = ({ label, value, unit }) => (
  <div className="p-3 rounded-xl border border-border bg-surface text-center">
    <span className="text-[10px] text-text-muted uppercase">{label}</span>
    <p className="text-sm font-bold text-text-primary mt-0.5">
      {value === null || value === undefined ? '-' : `${value} ${unit}`}
    </p>
  </div>
)

export const EchoReportsPage = () => {
  const { user } = useAuthStore()
  const { canCreate, canEdit, canDelete } = useCardioAccess('echo_reports')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [formError, setFormError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data, isLoading, isError, error } = useCardioList(RESOURCE, { search: search || undefined, limit: 100 })
  const reports = data?.data || []
  const active = useMemo(() => reports.find((r) => r.id === selectedId) || reports[0], [reports, selectedId])

  const createMutation = useCardioMutation(RESOURCE, (payload) => cardioHttp.post(RESOURCE, payload), {
    success: 'Echo report saved as draft.',
    onSuccess: (res) => {
      setIsCreateOpen(false)
      setSelectedId(res?.data?.id || null)
    },
  })
  const finalizeMutation = useCardioMutation(RESOURCE, (id) => cardioHttp.post(`${RESOURCE}/${id}/finalize`), {
    success: 'Echo report finalized.',
  })
  const deleteMutation = useCardioMutation(RESOURCE, (id) => cardioHttp.del(`${RESOURCE}/${id}`), {
    success: 'Echo report deleted.',
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
  const updateValve = (idx, key, value) =>
    setForm((f) => ({ ...f, valves: f.valves.map((v, i) => (i === idx ? { ...v, [key]: value } : v)) }))

  const submit = (e) => {
    e.preventDefault()
    if (!form.patientId) return setFormError('Please select a patient.')
    const ef = num(form.efPercent)
    if (!ef) return setFormError('Enter the LVEF percentage.')
    if (!form.studyDate) return setFormError('Enter the study date.')
    setFormError('')
    createMutation.mutate({
      patientId: form.patientId,
      studyDate: new Date(`${form.studyDate}T12:00:00`).toISOString(),
      modality: form.modality,
      indication: form.indication.trim() || undefined,
      sonographer: form.sonographer.trim() || undefined,
      cardiologist: form.cardiologist.trim() || undefined,
      efPercent: ef,
      lvedd: num(form.lvedd),
      lvesd: num(form.lvesd),
      ivsd: num(form.ivsd),
      pwd: num(form.pwd),
      laVolumeIndex: num(form.laVolumeIndex),
      valves: form.valves.filter((v) => v.finding.trim()),
      wallMotion: form.wallMotion.trim() || undefined,
      conclusions: form.conclusionsText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading font-extrabold text-2xl text-text-primary">Echocardiography (Echo) Reports</h1>
            <Badge variant="primary" size="sm">2D / Doppler Ultrasound Diagnostic Registry</Badge>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            TTE and TEE studies, chamber measurements, ejection fraction (LVEF %) and valve findings
          </p>
        </div>
        {canCreate && (
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={openCreate}>
            Create Echo Report
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Echo Archive ({data?.pagination?.total ?? reports.length})
          </h2>
          <Input
            placeholder="Search patient name or MRN"
            leftIcon={<Search className="w-4 h-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          )}
          {isError && <EmptyState title="Could not load echo reports" description={errorMessage(error)} />}
          {!isLoading && !isError && reports.length === 0 && (
            <EmptyState
              icon={FileText}
              title={search ? 'No matching reports' : 'No echo reports yet'}
              description={
                search ? 'Try a different name or MRN.' : 'Create the first echo report for a registered patient.'
              }
              actionLabel={canCreate && !search ? 'Create Echo Report' : undefined}
              onAction={openCreate}
            />
          )}

          {reports.map((report) => (
            <div
              key={report.id}
              onClick={() => setSelectedId(report.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${active?.id === report.id
                  ? 'border-primary bg-primary/5 shadow-soft'
                  : 'border-border bg-surface hover:border-border-hover'
                }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-primary">{report.reportNumber}</span>
                <Badge variant={report.status === 'FINALIZED' ? 'success' : 'warning'} size="sm">
                  {report.status}
                </Badge>
              </div>
              <h3 className="font-semibold text-sm text-text-primary mt-1.5">{report.patientName}</h3>
              <p className="text-xs text-text-muted">
                {report.patientMrn} • {report.modality}
              </p>
              <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-xs">
                <span className="font-bold text-primary flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 fill-primary/20" /> LVEF: {report.efPercent}%
                </span>
                <span className="text-text-muted">{fmtDate(report.studyDate)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {active ? (
            <div className="p-6 rounded-2xl border border-border bg-surface shadow-soft space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-border pb-4">
                <div>
                  <span className="font-mono text-xs font-bold text-primary">{active.reportNumber}</span>
                  <h2 className="text-xl font-bold text-text-primary mt-0.5">{active.patientName}</h2>
                  <p className="text-xs text-text-muted">
                    {active.patientMrn} • {active.modality} • {fmtDate(active.studyDate)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {canEdit && active.status !== 'FINALIZED' && (
                      <Button
                        size="xs"
                        variant="outline"
                        isLoading={finalizeMutation.isPending}
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-success" />}
                        onClick={() => finalizeMutation.mutate(active.id)}
                      >
                        Finalize Report
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
                <div className="text-right">
                  <span className="text-[10px] text-text-muted uppercase font-bold">Left Ventricular EF</span>
                  <div className="text-2xl font-black text-primary flex items-center gap-1 justify-end">
                    <Heart className="w-5 h-5 fill-primary text-primary" />
                    {active.efPercent}%
                  </div>
                  <span className="text-[11px] text-text-secondary">{efCategory(active.efPercent)}</span>
                </div>
              </div>

              {active.indication && (
                <div className="text-xs p-3 rounded-xl bg-surface-secondary/40 border border-border">
                  <span className="font-semibold text-text-primary">Clinical Indication:</span>{' '}
                  <span className="text-text-secondary">{active.indication}</span>
                </div>
              )}

              <div>
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2.5">
                  Chamber Quantifications & Geometry
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  <Dim label="LVEDD" value={active.lvedd} unit="cm" />
                  <Dim label="LVESD" value={active.lvesd} unit="cm" />
                  <Dim label="Septal (IVSd)" value={active.ivsd} unit="cm" />
                  <Dim label="Post Wall (PWd)" value={active.pwd} unit="cm" />
                  <Dim label="LAVI Index" value={active.laVolumeIndex} unit="mL/m²" />
                </div>
              </div>

              {Array.isArray(active.valves) && active.valves.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2.5">
                    Valvular Morphology & Color Doppler
                  </h3>
                  <div className="space-y-2">
                    {active.valves.map((v, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-border/80 bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <span className="text-xs font-bold text-text-primary sm:w-36">{v.valve}</span>
                        <span className="text-xs text-text-secondary flex-1">{v.finding}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {active.wallMotion && (
                <div className="text-xs p-3 rounded-xl bg-surface-secondary/40 border border-border">
                  <span className="font-semibold text-text-primary">Wall Motion:</span>{' '}
                  <span className="text-text-secondary">{active.wallMotion}</span>
                </div>
              )}

              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-primary" /> Attending Cardiologist Conclusions
                </h3>
                {Array.isArray(active.conclusions) && active.conclusions.length > 0 ? (
                  <ul className="space-y-1.5 list-disc list-inside text-xs text-text-secondary leading-relaxed">
                    {active.conclusions.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-text-muted">No conclusions recorded yet.</p>
                )}
                <div className="text-[11px] text-text-muted border-t border-primary/10 pt-2 flex items-center justify-between gap-2 flex-wrap">
                  <span>Interpreting Physician: {active.cardiologist || 'Not assigned'}</span>
                  <span>Sonographer: {active.sonographer || 'Not recorded'}</span>
                </div>
              </div>
            </div>
          ) : (
            !isLoading && (
              <EmptyState
                icon={FileText}
                title="No report selected"
                description="Select a report on the left to see measurements, valve findings and conclusions."
              />
            )
          )}
        </div>
      </div>

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Echo Report"
        description="Saved as a draft. Finalize it once the conclusions are reviewed."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={submit} className="space-y-4">
          <PatientPicker value={form.patientId} onChange={(v) => setForm((f) => ({ ...f, patientId: v }))} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Study date" type="date" required value={form.studyDate} onChange={setField('studyDate')} />
            <Select label="Modality" value={form.modality} onChange={setField('modality')}>
              {MODALITIES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </Select>
          </div>

          <Input label="Clinical indication" placeholder="e.g. Dyspnea on exertion" value={form.indication} onChange={setField('indication')} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Sonographer" value={form.sonographer} onChange={setField('sonographer')} />
            <Input label="Interpreting cardiologist" value={form.cardiologist} onChange={setField('cardiologist')} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Input label="LVEF (%)" type="number" required min="5" max="85" value={form.efPercent} onChange={setField('efPercent')} />
            <Input label="LVEDD (cm)" type="number" step="0.1" value={form.lvedd} onChange={setField('lvedd')} />
            <Input label="LVESD (cm)" type="number" step="0.1" value={form.lvesd} onChange={setField('lvesd')} />
            <Input label="IVSd (cm)" type="number" step="0.1" value={form.ivsd} onChange={setField('ivsd')} />
            <Input label="PWd (cm)" type="number" step="0.1" value={form.pwd} onChange={setField('pwd')} />
            <Input label="LAVI (mL/m²)" type="number" step="0.1" value={form.laVolumeIndex} onChange={setField('laVolumeIndex')} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-primary">Valve findings (optional)</span>
              <Button
                size="xs"
                variant="outline"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                disabled={form.valves.length >= 8}
                onClick={() =>
                  setForm((f) => ({ ...f, valves: [...f.valves, { valve: VALVES[Math.min(f.valves.length, 3)], finding: '' }] }))
                }
              >
                Add valve
              </Button>
            </div>
            {form.valves.map((v, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_2fr_auto] gap-2 items-end">
                <Select value={v.valve} onChange={(e) => updateValve(idx, 'valve', e.target.value)}>
                  {VALVES.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </Select>
                <Input placeholder="Finding" value={v.finding} onChange={(e) => updateValve(idx, 'finding', e.target.value)} />
                <button
                  type="button"
                  aria-label="Remove valve"
                  className="p-2.5 rounded-xl text-text-secondary hover:text-danger hover:bg-danger/10"
                  onClick={() => setForm((f) => ({ ...f, valves: f.valves.filter((_, i) => i !== idx) }))}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <Textarea label="Wall motion" rows={2} value={form.wallMotion} onChange={setField('wallMotion')} />
          <Textarea
            label="Conclusions"
            rows={4}
            placeholder="One conclusion per line"
            helperText="At least one conclusion is needed before the report can be finalized."
            value={form.conclusionsText}
            onChange={setField('conclusionsText')}
          />

          {formError && <p className="text-xs text-danger font-medium">{formError}</p>}

          <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
            <Button variant="secondary" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={createMutation.isPending}>
              Save Draft
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        isLoading={deleteMutation.isPending}
        title="Delete echo report"
        message={`Delete ${deleteTarget?.reportNumber} for ${deleteTarget?.patientName}? This cannot be undone.`}
      />
    </div>
  )
}

export default EchoReportsPage
