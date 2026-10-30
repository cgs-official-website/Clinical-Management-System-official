import React, { useEffect, useMemo, useState } from 'react'
import { Activity, Plus, RotateCcw, Save, UserRound } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { SkeletonChart } from '../../components/ui/Skeleton'
import { notify } from '../../components/ui/Toast'
import { PatientPicker } from './components/PatientPicker'
import { useChart, useSaveChart, useResetChart, useAddToPlan, usePatientParam } from './dentalApi'

// Universal Numbering System (1 to 32) for adult dentition
const UPPER_TEETH = [
  { num: 1, name: 'Upper Right 3rd Molar', type: 'Molar' },
  { num: 2, name: 'Upper Right 2nd Molar', type: 'Molar' },
  { num: 3, name: 'Upper Right 1st Molar', type: 'Molar' },
  { num: 4, name: 'Upper Right 2nd Premolar', type: 'Premolar' },
  { num: 5, name: 'Upper Right 1st Premolar', type: 'Premolar' },
  { num: 6, name: 'Upper Right Canine', type: 'Canine' },
  { num: 7, name: 'Upper Right Lateral Incisor', type: 'Incisor' },
  { num: 8, name: 'Upper Right Central Incisor', type: 'Incisor' },
  { num: 9, name: 'Upper Left Central Incisor', type: 'Incisor' },
  { num: 10, name: 'Upper Left Lateral Incisor', type: 'Incisor' },
  { num: 11, name: 'Upper Left Canine', type: 'Canine' },
  { num: 12, name: 'Upper Left 1st Premolar', type: 'Premolar' },
  { num: 13, name: 'Upper Left 2nd Premolar', type: 'Premolar' },
  { num: 14, name: 'Upper Left 1st Molar', type: 'Molar' },
  { num: 15, name: 'Upper Left 2nd Molar', type: 'Molar' },
  { num: 16, name: 'Upper Left 3rd Molar', type: 'Molar' },
]

const LOWER_TEETH = [
  { num: 32, name: 'Lower Right 3rd Molar', type: 'Molar' },
  { num: 31, name: 'Lower Right 2nd Molar', type: 'Molar' },
  { num: 30, name: 'Lower Right 1st Molar', type: 'Molar' },
  { num: 29, name: 'Lower Right 2nd Premolar', type: 'Premolar' },
  { num: 28, name: 'Lower Right 1st Premolar', type: 'Premolar' },
  { num: 27, name: 'Lower Right Canine', type: 'Canine' },
  { num: 26, name: 'Lower Right Lateral Incisor', type: 'Incisor' },
  { num: 25, name: 'Lower Right Central Incisor', type: 'Incisor' },
  { num: 24, name: 'Lower Left Central Incisor', type: 'Incisor' },
  { num: 23, name: 'Lower Left Lateral Incisor', type: 'Incisor' },
  { num: 22, name: 'Lower Left Canine', type: 'Canine' },
  { num: 21, name: 'Lower Left 1st Premolar', type: 'Premolar' },
  { num: 20, name: 'Lower Left 2nd Premolar', type: 'Premolar' },
  { num: 19, name: 'Lower Left 1st Molar', type: 'Molar' },
  { num: 18, name: 'Lower Left 2nd Molar', type: 'Molar' },
  { num: 17, name: 'Lower Left 3rd Molar', type: 'Molar' },
]

const CONDITIONS = [
  { id: 'HEALTHY', label: 'Sound / Healthy', color: 'bg-emerald-500 text-white', border: 'border-emerald-500', hex: '#10B981' },
  { id: 'CARIES', label: 'Dental Caries', color: 'bg-rose-500 text-white', border: 'border-rose-500', hex: '#EF4444' },
  { id: 'RESTORED', label: 'Composite / Amalgam', color: 'bg-blue-500 text-white', border: 'border-blue-500', hex: '#3B82F6' },
  { id: 'CROWN', label: 'Full Crown', color: 'bg-amber-500 text-white', border: 'border-amber-500', hex: '#F59E0B' },
  { id: 'ROOT_CANAL', label: 'Endo Treated (RCT)', color: 'bg-purple-500 text-white', border: 'border-purple-500', hex: '#8B5CF6' },
  { id: 'IMPLANT', label: 'Osseointegrated Implant', color: 'bg-teal-500 text-white', border: 'border-teal-500', hex: '#14B8A6' },
  { id: 'MISSING', label: 'Missing / Extracted', color: 'bg-slate-400 text-white', border: 'border-slate-400', hex: '#94A3B8' },
]

const SURFACE_KEYS = ['M', 'O', 'D', 'B', 'L']
const PROBE_SITES = ['DB', 'B', 'MB', 'DL', 'L', 'ML']

// Suggested procedure when a finding is added to the treatment plan
const SUGGESTED_PROCEDURE = {
  CARIES: { description: 'Resin-based composite restoration', code: 'D2391' },
  RESTORED: { description: 'Restoration review / replacement', code: '' },
  ROOT_CANAL: { description: 'Endodontic therapy (RCT)', code: 'D3330' },
  CROWN: { description: 'Crown - porcelain / ceramic', code: 'D2740' },
  IMPLANT: { description: 'Implant placement', code: 'D6010' },
  MISSING: { description: 'Replacement of missing tooth', code: '' },
  HEALTHY: { description: '', code: '' },
}

const toothName = (num) =>
  [...UPPER_TEETH, ...LOWER_TEETH].find((t) => t.num === num)?.name || `Tooth #${num}`

export const DentalChartPage = () => {
  const [patientId, setPatientId] = usePatientParam()
  const [selectedTooth, setSelectedTooth] = useState(14)
  // draft = what is on screen (server data + unsaved edits); dirty = teeth edited since last save
  const [draft, setDraft] = useState({})
  const [dirty, setDirty] = useState(() => new Set())
  const [planModal, setPlanModal] = useState(false)
  const [planForm, setPlanForm] = useState({ description: '', code: '', fee: '', phase: 'Phase 1' })

  const { data: chart, isLoading, isError } = useChart(patientId)
  const saveChart = useSaveChart(patientId)
  const resetChart = useResetChart(patientId)
  const addToPlan = useAddToPlan()

  // Load server data into the editable draft whenever the patient / saved chart changes
  useEffect(() => {
    const next = {}
    for (const t of chart?.teeth || []) {
      next[t.toothNo] = {
        status: t.status,
        surfaces: Array.isArray(t.surfaces) ? t.surfaces : [],
        notes: t.notes || '',
        probingDepths: t.probingDepths || null,
      }
    }
    setDraft(next)
    setDirty(new Set())
  }, [chart, patientId])

  const current = draft[selectedTooth] || { status: 'HEALTHY', surfaces: [], notes: '', probingDepths: null }
  const activeCondition = CONDITIONS.find((c) => c.id === (current.status || 'HEALTHY'))

  const editTooth = (toothNo, patch) => {
    setDraft((prev) => {
      const base = prev[toothNo] || { status: 'HEALTHY', surfaces: [], notes: '', probingDepths: null }
      return { ...prev, [toothNo]: { ...base, ...patch } }
    })
    setDirty((prev) => new Set(prev).add(toothNo))
  }

  const toggleSurface = (surf) => {
    const has = current.surfaces.includes(surf)
    editTooth(selectedTooth, {
      surfaces: has ? current.surfaces.filter((s) => s !== surf) : [...current.surfaces, surf],
    })
  }

  const setProbe = (site, raw) => {
    const val = Math.max(0, Math.min(15, parseInt(raw, 10) || 0))
    const base = current.probingDepths || { DB: 0, B: 0, MB: 0, DL: 0, L: 0, ML: 0 }
    editTooth(selectedTooth, { probingDepths: { ...base, [site]: val } })
  }

  const handleSave = () => {
    if (!dirty.size) return notify.info('No changes to save.')
    const teeth = [...dirty].map((toothNo) => ({
      toothNo,
      status: draft[toothNo].status,
      surfaces: draft[toothNo].surfaces,
      notes: draft[toothNo].notes,
      probingDepths: draft[toothNo].probingDepths,
    }))
    saveChart.mutate(teeth)
  }

  const handleReset = () => {
    if (!window.confirm('Delete all saved findings for this patient? This cannot be undone.')) return
    resetChart.mutate()
  }

  const openPlanModal = () => {
    const s = SUGGESTED_PROCEDURE[current.status] || SUGGESTED_PROCEDURE.HEALTHY
    setPlanForm({ description: s.description, code: s.code, fee: '', phase: 'Phase 1' })
    setPlanModal(true)
  }

  const submitPlanItem = () => {
    if (!planForm.description.trim()) return notify.error('Enter a procedure description.')
    const surf = current.surfaces.length ? ` (${current.surfaces.join('')})` : ''
    addToPlan.mutate(
      {
        patientId,
        item: {
          phase: planForm.phase || 'Phase 1',
          code: planForm.code || null,
          description: planForm.description.trim(),
          toothNo: `${selectedTooth}${surf}`,
          fee: Number(planForm.fee) || 0,
        },
      },
      { onSuccess: () => setPlanModal(false) }
    )
  }

  const getToothBadgeColor = (toothNum) => {
    const data = draft[toothNum]
    if (!data || data.status === 'HEALTHY') return 'border-border bg-surface text-text-secondary hover:border-primary/50'
    const cond = CONDITIONS.find((c) => c.id === data.status)
    return `${cond?.border} bg-surface font-bold text-text-primary shadow-sm`
  }

  const getToothFill = (toothNum) => {
    const data = draft[toothNum]
    if (!data || data.status === 'HEALTHY') return '#64748B'
    return CONDITIONS.find((c) => c.id === data.status)?.hex || '#10B981'
  }

  const renderTooth = (t, isUpper) => {
    const isSelected = selectedTooth === t.num
    const status = draft[t.num]?.status
    return (
      <button
        key={t.num}
        onClick={() => setSelectedTooth(t.num)}
        className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-xs ${isSelected
            ? 'border-primary ring-2 ring-primary/20 bg-primary/10 shadow-sm scale-105'
            : getToothBadgeColor(t.num)
          }`}
      >
        <span className="font-bold text-[11px] mb-1">
          #{t.num}
          {dirty.has(t.num) && <span className="text-amber-500">*</span>}
        </span>
        <svg className="w-6 h-7" viewBox="0 0 24 28" fill="none">
          <path
            d={
              isUpper
                ? 'M4 8C4 4 7 2 12 2C17 2 20 4 20 8C20 14 17 26 12 26C7 26 4 14 4 8Z'
                : 'M4 20C4 24 7 26 12 26C17 26 20 24 20 20C20 14 17 2 12 2C7 2 4 14 4 20Z'
            }
            fill={getToothFill(t.num)}
            fillOpacity={status === 'MISSING' ? 0.05 : 0.25}
            stroke={getToothFill(t.num)}
            strokeWidth="1.5"
            strokeDasharray={status === 'MISSING' ? '3 2' : undefined}
          />
          {status === 'CARIES' && <circle cx="12" cy={isUpper ? 11 : 17} r="3" fill="#EF4444" />}
          {status === 'CROWN' && <path d={isUpper ? 'M6 6H18V12H6Z' : 'M6 16H18V22H6Z'} fill="#F59E0B" />}
        </svg>
        <span className="text-[9px] text-text-secondary mt-1 truncate max-w-full">{t.type.slice(0, 3)}</span>
      </button>
    )
  }

  const summary = useMemo(() => {
    const counts = {}
    Object.values(draft).forEach((d) => {
      if (d.status && d.status !== 'HEALTHY') counts[d.status] = (counts[d.status] || 0) + 1
    })
    return counts
  }, [draft])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading font-extrabold text-2xl text-text-primary">
              Dental Chart (Interactive Odontogram)
            </h1>
            <Badge variant="primary" size="sm">Dental Care ERP</Badge>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Adult 32-tooth anatomic diagram, restorative mapping, periodontal charting & procedural notes
          </p>
        </div>

        <div className="flex items-end gap-2.5">
          <PatientPicker value={patientId} onChange={setPatientId} className="w-64" />
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RotateCcw className="w-4 h-4" />}
            disabled={!patientId || resetChart.isPending}
            onClick={handleReset}
          >
            Reset Chart
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Save className="w-4 h-4" />}
            disabled={!patientId || !dirty.size}
            isLoading={saveChart.isPending}
            onClick={handleSave}
          >
            Save Findings{dirty.size ? ` (${dirty.size})` : ''}
          </Button>
        </div>
      </div>

      {!patientId ? (
        <EmptyState
          icon={UserRound}
          title="Select a patient"
          description="Choose a patient above to view or record their tooth-by-tooth findings."
        />
      ) : isLoading ? (
        <SkeletonChart />
      ) : isError ? (
        <EmptyState title="Could not load chart" description="Check your connection or permissions and try again." />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Interactive Odontogram */}
          <div className="xl:col-span-2 p-6 rounded-2xl border border-border bg-surface shadow-soft space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="font-heading font-bold text-base text-text-primary flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Permanent Dentition Mapping
                  {chart?.patient?.fullName && (
                    <span className="text-xs font-medium text-text-secondary">— {chart.patient.fullName}</span>
                  )}
                </h3>
                <p className="text-xs text-text-secondary">
                  Click any tooth to examine surfaces, set diagnostic findings, and log pocket depths
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary">
                {CONDITIONS.filter((c) => c.id !== 'HEALTHY').map((c) => (
                  <span key={c.id} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.hex }}></span>
                    {summary[c.id] || 0} {c.label.split(' ')[0]}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-text-secondary px-2">
                <span>Maxillary Arch (Upper Right 1–8)</span>
                <span className="font-bold text-primary">UPPER JAW</span>
                <span>(Upper Left 9–16)</span>
              </div>
              <div className="grid grid-cols-8 gap-1.5 p-3 rounded-xl bg-surface-hover/40 border border-border/60">
                {UPPER_TEETH.map((t) => renderTooth(t, true))}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs font-semibold text-text-secondary px-2">
                <span>Mandibular Arch (Lower Right 32–25)</span>
                <span className="font-bold text-primary">LOWER JAW</span>
                <span>(Lower Left 24–17)</span>
              </div>
              <div className="grid grid-cols-8 gap-1.5 p-3 rounded-xl bg-surface-hover/40 border border-border/60">
                {LOWER_TEETH.map((t) => renderTooth(t, false))}
              </div>
            </div>

            {/* Surface selector for selected tooth */}
            <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-extrabold text-lg">
                  #{selectedTooth}
                </div>
                <div>
                  <h4 className="font-heading font-bold text-sm text-text-primary">{toothName(selectedTooth)}</h4>
                  <p className="text-xs text-text-secondary">
                    Active Surface Selection: {current.surfaces.join(', ') || 'None (Whole Tooth)'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {SURFACE_KEYS.map((surf) => {
                  const isSelected = current.surfaces.includes(surf)
                  return (
                    <button
                      key={surf}
                      onClick={() => toggleSurface(surf)}
                      className={`w-9 h-9 rounded-lg font-bold text-xs border transition-all ${isSelected
                          ? 'bg-primary text-white border-primary shadow-glow'
                          : 'bg-surface border-border text-text-secondary hover:border-primary/40'
                        }`}
                    >
                      {surf}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Selected tooth controls */}
          <div className="p-6 rounded-2xl border border-border bg-surface shadow-soft space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="font-heading font-bold text-base text-text-primary">Tooth #{selectedTooth} Details</h3>
              <Badge variant="primary" size="sm">{activeCondition?.label || 'Healthy'}</Badge>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-secondary block">Set Clinical Condition:</label>
              <div className="grid grid-cols-2 gap-2">
                {CONDITIONS.map((c) => {
                  const isActive = (current.status || 'HEALTHY') === c.id
                  return (
                    <button
                      key={c.id}
                      onClick={() => editTooth(selectedTooth, { status: c.id })}
                      className={`p-2.5 rounded-xl border text-xs font-medium text-left flex items-center justify-between transition-all ${isActive
                          ? `${c.border} bg-surface ring-2 ring-primary/20 text-text-primary font-bold`
                          : 'border-border bg-surface text-text-secondary hover:border-primary/30'
                        }`}
                    >
                      <span className="truncate">{c.label}</span>
                      <span className={`w-2.5 h-2.5 rounded-full ${c.color.split(' ')[0]}`} />
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-border">
              <label className="text-xs font-semibold text-text-secondary block">Periodontal Probing Depths (mm):</label>
              <div className="grid grid-cols-6 gap-1.5 text-center">
                {PROBE_SITES.map((site) => {
                  const depth = current.probingDepths?.[site]
                  return (
                    <div key={site} className="p-1.5 rounded-lg border border-border bg-surface-hover/30">
                      <span className="text-[10px] text-text-secondary block">{site}</span>
                      <input
                        type="number"
                        min="0"
                        max="15"
                        value={depth ?? ''}
                        placeholder="–"
                        onChange={(e) => setProbe(site, e.target.value)}
                        className={`w-full text-center font-bold text-xs bg-transparent border-0 focus:outline-none ${depth >= 4 ? 'text-rose-500 font-extrabold' : 'text-text-primary'
                          }`}
                      />
                    </div>
                  )
                })}
              </div>
              <p className="text-[10px] text-text-secondary">
                Depths ≥ 4mm highlight potential periodontal pockets requiring subgingival scaling.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-border">
              <label className="text-xs font-semibold text-text-secondary block">Clinical Notes & Next Procedures:</label>
              <textarea
                rows={3}
                value={current.notes || ''}
                onChange={(e) => editTooth(selectedTooth, { notes: e.target.value })}
                placeholder="e.g. Recommended composite restoration. Check contact point."
                className="w-full p-3 rounded-xl border border-border bg-surface text-xs text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <Button
              variant="primary"
              className="w-full font-bold shadow-glow text-xs"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={openPlanModal}
            >
              Add to Treatment Plan
            </Button>
            {dirty.has(selectedTooth) && (
              <p className="text-[10px] text-amber-500">Unsaved changes on this tooth — click “Save Findings”.</p>
            )}
          </div>
        </div>
      )}

      <Modal
        isOpen={planModal}
        onClose={() => setPlanModal(false)}
        title={`Add Tooth #${selectedTooth} to Treatment Plan`}
        description="The procedure is added to this patient's active plan (a plan is created if none exists)."
      >
        <div className="p-4 sm:p-5 space-y-3 overflow-y-auto">
          <Input
            label="Procedure"
            required
            value={planForm.description}
            onChange={(e) => setPlanForm((f) => ({ ...f, description: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Code" value={planForm.code} onChange={(e) => setPlanForm((f) => ({ ...f, code: e.target.value }))} />
            <Input
              label="Fee (₹)"
              type="number"
              min="0"
              value={planForm.fee}
              onChange={(e) => setPlanForm((f) => ({ ...f, fee: e.target.value }))}
            />
          </div>
          <Input label="Phase" value={planForm.phase} onChange={(e) => setPlanForm((f) => ({ ...f, phase: e.target.value }))} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setPlanModal(false)}>Cancel</Button>
            <Button size="sm" isLoading={addToPlan.isPending} onClick={submitPlanItem}>Add Procedure</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default DentalChartPage
