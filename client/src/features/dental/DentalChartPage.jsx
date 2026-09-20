import React, { useState } from 'react'
import {
  Activity,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  RotateCcw,
  Sparkles,
  Save,
  Clock,
  Search,
  Layers,
  ChevronRight,
} from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { notify } from '../../components/ui/Toast'

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

export const DentalChartPage = () => {
  const [selectedTooth, setSelectedTooth] = useState(14)
  const [dentitionState, setDentitionState] = useState({
    3: { status: 'RESTORED', surfaces: ['O', 'D'], notes: 'Class II Composite placed 2025' },
    14: { status: 'CARIES', surfaces: ['M', 'O'], notes: 'Moderate dentin caries, sensitivity to cold' },
    19: { status: 'ROOT_CANAL', surfaces: ['O'], notes: 'Gutta-percha obturation completed' },
    30: { status: 'CROWN', surfaces: ['All'], notes: 'Monolithic Zirconia Crown seated' },
  })

  const [activeSurfaces, setActiveSurfaces] = useState(['M', 'O'])
  const [probingDepths, setProbingDepths] = useState({ DB: 2, B: 3, MB: 3, DL: 2, L: 2, ML: 2 })

  const currentToothData = dentitionState[selectedTooth] || { status: 'HEALTHY', surfaces: [], notes: '' }
  const activeCondition = CONDITIONS.find(c => c.id === (currentToothData.status || 'HEALTHY'))

  const handleUpdateStatus = (statusId) => {
    setDentitionState(prev => ({
      ...prev,
      [selectedTooth]: {
        ...prev[selectedTooth],
        status: statusId,
        surfaces: activeSurfaces,
        notes: prev[selectedTooth]?.notes || `Marked as ${statusId} on ${new Date().toLocaleDateString()}`,
      }
    }))
    notify.success(`Tooth #${selectedTooth} marked as ${statusId}`)
  }

  const toggleSurface = (surf) => {
    setActiveSurfaces(prev =>
      prev.includes(surf) ? prev.filter(s => s !== surf) : [...prev, surf]
    )
  }

  const getToothBadgeColor = (toothNum) => {
    const data = dentitionState[toothNum]
    if (!data || data.status === 'HEALTHY') return 'border-border bg-surface text-text-secondary hover:border-primary/50'
    const cond = CONDITIONS.find(c => c.id === data.status)
    return `${cond?.border} bg-surface font-bold text-text-primary shadow-sm`
  }

  const getToothFill = (toothNum) => {
    const data = dentitionState[toothNum]
    if (!data || data.status === 'HEALTHY') return '#64748B'
    const cond = CONDITIONS.find(c => c.id === data.status)
    return cond?.hex || '#10B981'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading font-extrabold text-2xl text-text-primary">
              Dental Chart (Interactive Odontogram)
            </h1>
            <Badge variant="primary" size="sm">
              Dental Care ERP
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Adult 32-tooth anatomic diagram, restorative mapping, periodontal charting & procedural notes
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RotateCcw className="w-4 h-4" />}
            onClick={() => {
              setDentitionState({})
              notify.info('Chart reset to sound baseline.')
            }}
          >
            Reset Chart
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Save className="w-4 h-4" />}
            onClick={() => notify.success('Odontogram records synced to patient chart.')}
          >
            Save Findings
          </Button>
        </div>
      </div>

      {/* Main Chart Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Interactive Odontogram (Teeth Arch) */}
        <div className="xl:col-span-2 p-6 rounded-2xl border border-border bg-surface shadow-soft space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h3 className="font-heading font-bold text-base text-text-primary flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Permanent Dentition Mapping
              </h3>
              <p className="text-xs text-text-secondary">
                Click any tooth to examine surfaces, set diagnostic findings, and log pocket depths
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-text-secondary">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Sound</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Caries</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Crown</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> RCT</span>
            </div>
          </div>

          {/* Maxillary (Upper) Arch */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-text-secondary px-2">
              <span>Maxillary Arch (Upper Right 1–8)</span>
              <span className="font-bold text-primary">UPPER JAW</span>
              <span>(Upper Left 9–16)</span>
            </div>
            <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5 p-3 rounded-xl bg-surface-hover/40 border border-border/60">
              {UPPER_TEETH.map(t => {
                const isSelected = selectedTooth === t.num
                return (
                  <button
                    key={t.num}
                    onClick={() => setSelectedTooth(t.num)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-xs ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/20 bg-primary/10 shadow-sm scale-105'
                        : getToothBadgeColor(t.num)
                    }`}
                  >
                    <span className="font-bold text-[11px] mb-1">#{t.num}</span>
                    <svg className="w-6 h-7" viewBox="0 0 24 28" fill="none">
                      <path
                        d="M4 8C4 4 7 2 12 2C17 2 20 4 20 8C20 14 17 26 12 26C7 26 4 14 4 8Z"
                        fill={getToothFill(t.num)}
                        fillOpacity="0.25"
                        stroke={getToothFill(t.num)}
                        strokeWidth="1.5"
                      />
                      {dentitionState[t.num]?.status === 'CARIES' && (
                        <circle cx="12" cy="11" r="3" fill="#EF4444" />
                      )}
                      {dentitionState[t.num]?.status === 'CROWN' && (
                        <path d="M6 6H18V12H6Z" fill="#F59E0B" />
                      )}
                    </svg>
                    <span className="text-[9px] text-text-secondary mt-1 truncate max-w-full">
                      {t.type.slice(0, 3)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Mandibular (Lower) Arch */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs font-semibold text-text-secondary px-2">
              <span>Mandibular Arch (Lower Right 32–25)</span>
              <span className="font-bold text-primary">LOWER JAW</span>
              <span>(Lower Left 24–17)</span>
            </div>
            <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5 p-3 rounded-xl bg-surface-hover/40 border border-border/60">
              {LOWER_TEETH.map(t => {
                const isSelected = selectedTooth === t.num
                return (
                  <button
                    key={t.num}
                    onClick={() => setSelectedTooth(t.num)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-xs ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/20 bg-primary/10 shadow-sm scale-105'
                        : getToothBadgeColor(t.num)
                    }`}
                  >
                    <span className="font-bold text-[11px] mb-1">#{t.num}</span>
                    <svg className="w-6 h-7" viewBox="0 0 24 28" fill="none">
                      <path
                        d="M4 20C4 24 7 26 12 26C17 26 20 24 20 20C20 14 17 2 12 2C7 2 4 14 4 20Z"
                        fill={getToothFill(t.num)}
                        fillOpacity="0.25"
                        stroke={getToothFill(t.num)}
                        strokeWidth="1.5"
                      />
                      {dentitionState[t.num]?.status === 'CARIES' && (
                        <circle cx="12" cy="17" r="3" fill="#EF4444" />
                      )}
                      {dentitionState[t.num]?.status === 'CROWN' && (
                        <path d="M6 16H18V22H6Z" fill="#F59E0B" />
                      )}
                    </svg>
                    <span className="text-[9px] text-text-secondary mt-1 truncate max-w-full">
                      {t.type.slice(0, 3)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Multi-Surface Odontogram Visualizer for Selected Tooth */}
          <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-extrabold text-lg">
                #{selectedTooth}
              </div>
              <div>
                <h4 className="font-heading font-bold text-sm text-text-primary">
                  {UPPER_TEETH.find(t => t.num === selectedTooth)?.name ||
                    LOWER_TEETH.find(t => t.num === selectedTooth)?.name}
                </h4>
                <p className="text-xs text-text-secondary">
                  Active Surface Selection: {activeSurfaces.join(', ') || 'None (Whole Tooth)'}
                </p>
              </div>
            </div>

            {/* Surface Toggle Buttons */}
            <div className="flex items-center gap-1.5">
              {['M', 'O', 'D', 'B', 'L'].map(surf => {
                const isSelected = activeSurfaces.includes(surf)
                return (
                  <button
                    key={surf}
                    onClick={() => toggleSurface(surf)}
                    className={`w-9 h-9 rounded-lg font-bold text-xs border transition-all ${
                      isSelected
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

        {/* Selected Tooth Diagnosis & Treatment Controls */}
        <div className="p-6 rounded-2xl border border-border bg-surface shadow-soft space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h3 className="font-heading font-bold text-base text-text-primary">
              Tooth #{selectedTooth} Details
            </h3>
            <Badge variant="primary" size="sm">
              {activeCondition?.label || 'Healthy'}
            </Badge>
          </div>

          {/* Quick Status Tagging */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-text-secondary block">
              Set Clinical Condition:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CONDITIONS.map(c => {
                const isActive = (currentToothData.status || 'HEALTHY') === c.id
                return (
                  <button
                    key={c.id}
                    onClick={() => handleUpdateStatus(c.id)}
                    className={`p-2.5 rounded-xl border text-xs font-medium text-left flex items-center justify-between transition-all ${
                      isActive
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

          {/* Periodontal Probing Depths */}
          <div className="space-y-2 pt-2 border-t border-border">
            <label className="text-xs font-semibold text-text-secondary block">
              Periodontal Probing Depths (mm):
            </label>
            <div className="grid grid-cols-6 gap-1.5 text-center">
              {Object.entries(probingDepths).map(([site, depth]) => (
                <div key={site} className="p-1.5 rounded-lg border border-border bg-surface-hover/30">
                  <span className="text-[10px] text-text-secondary block">{site}</span>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={depth}
                    onChange={e => {
                      const val = parseInt(e.target.value, 10) || 1
                      setProbingDepths(prev => ({ ...prev, [site]: val }))
                    }}
                    className={`w-full text-center font-bold text-xs bg-transparent border-0 focus:outline-none ${
                      depth >= 4 ? 'text-rose-500 font-extrabold' : 'text-text-primary'
                    }`}
                  />
                </div>
              ))}
            </div>
            <p className="text-[10px] text-text-secondary">
              Depths ≥ 4mm highlight potential periodontal pockets requiring subgingival scaling.
            </p>
          </div>

          {/* Clinical Findings & Treatment Plan */}
          <div className="space-y-2 pt-2 border-t border-border">
            <label className="text-xs font-semibold text-text-secondary block">
              Clinical Notes & Next Procedures:
            </label>
            <textarea
              rows={3}
              value={currentToothData.notes || ''}
              onChange={e => {
                const val = e.target.value
                setDentitionState(prev => ({
                  ...prev,
                  [selectedTooth]: { ...prev[selectedTooth], notes: val }
                }))
              }}
              placeholder="e.g. Recommended composite restoration. Check contact point."
              className="w-full p-3 rounded-xl border border-border bg-surface text-xs text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <Button
            variant="primary"
            className="w-full font-bold shadow-glow text-xs"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => notify.success(`Procedure for Tooth #${selectedTooth} added to Treatment Plan.`)}
          >
            Add to Treatment Plan
          </Button>
        </div>
      </div>
    </div>
  )
}

export default DentalChartPage
