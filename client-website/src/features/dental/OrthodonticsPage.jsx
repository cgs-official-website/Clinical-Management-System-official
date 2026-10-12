import React, { useState } from 'react'
import {
  Smile,
  CheckCircle2,
  Clock,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Award,
  Sparkles,
  Plus,
} from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { notify } from '../../components/ui/Toast'

export const OrthodonticsPage = () => {
  const [currentTray, setCurrentTray] = useState(14)
  const totalTrays = 28

  const milestones = [
    { stage: 'Stage 1: Initial Crowding Relief', trays: 'Trays 1–8', status: 'Completed', date: 'May – Aug 2026' },
    { stage: 'Stage 2: Canine Retraction & Space Closure', trays: 'Trays 9–16', status: 'In Progress (Tray 14)', date: 'Sep – Nov 2026' },
    { stage: 'Stage 3: Arch Expansion & Derotation', trays: 'Trays 17–24', status: 'Upcoming', date: 'Dec 2026 – Feb 2027' },
    { stage: 'Stage 4: Occlusal Detailing & Retention', trays: 'Trays 25–28', status: 'Upcoming', date: 'Mar 2027' },
  ]

  const archwires = [
    { arch: 'Upper Arch', currentWire: '.016 x .022 Nickel-Titanium (NiTi)', installedDate: '01 Sep 2026', nextWire: '.019 x .025 Stainless Steel' },
    { arch: 'Lower Arch', currentWire: '.014 Heat-Activated Thermal NiTi', installedDate: '15 Aug 2026', nextWire: '.016 Round NiTi' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading font-extrabold text-2xl text-text-primary">
              Orthodontics & Aligner Tracker
            </h1>
            <Badge variant="primary" size="sm">
              Class II Division 1 Case
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Clear aligner schedule, bracket archwire sequences, elastic compliance & cephalometric metrics
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => notify.info('Aligner delivery check-in logged.')}
          >
            Log Tray Progression
          </Button>
        </div>
      </div>

      {/* Progress Bar Card */}
      <div className="p-6 rounded-2xl border border-border bg-surface shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-heading font-bold text-base text-text-primary flex items-center gap-2">
              <Smile className="w-5 h-5 text-primary" />
              Clear Aligner Progression
            </h3>
            <p className="text-xs text-text-secondary">
              Wearing Aligner Tray <strong>#{currentTray}</strong> of {totalTrays} • Compliance: 22 hrs / day
            </p>
          </div>
          <div className="text-right">
            <span className="font-heading font-extrabold text-2xl text-primary">
              {Math.round((currentTray / totalTrays) * 100)}%
            </span>
            <span className="text-xs text-text-secondary block">Treatment Completion</span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-surface-hover rounded-full h-3.5 overflow-hidden border border-border">
          <div
            className="bg-primary h-full rounded-full transition-all duration-500 shadow-glow"
            style={{ width: `${(currentTray / totalTrays) * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-text-secondary">
          <span>Started: May 2026</span>
          <span className="font-bold text-text-primary">Next Tray Switch: In 4 Days (Tray #{currentTray + 1})</span>
          <span>Target Completion: March 2027</span>
        </div>
      </div>

      {/* Milestones & Archwire Sequencing Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Treatment Milestones */}
        <div className="p-6 rounded-2xl border border-border bg-surface shadow-soft space-y-4">
          <h3 className="font-heading font-bold text-sm text-text-primary flex items-center gap-2 border-b border-border pb-3">
            <Clock className="w-4 h-4 text-primary" />
            Clinical Orthodontic Milestones
          </h3>

          <div className="space-y-3">
            {milestones.map((m, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-border bg-surface-hover/30 flex items-center justify-between gap-3"
              >
                <div>
                  <h4 className="font-heading font-bold text-xs text-text-primary">{m.stage}</h4>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    {m.trays} • {m.date}
                  </p>
                </div>
                <Badge
                  variant={m.status.includes('Completed') ? 'success' : m.status.includes('In Progress') ? 'primary' : 'secondary'}
                  size="sm"
                >
                  {m.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Fixed Appliance (Brackets & Archwire) Tracking */}
        <div className="p-6 rounded-2xl border border-border bg-surface shadow-soft space-y-4">
          <h3 className="font-heading font-bold text-sm text-text-primary flex items-center gap-2 border-b border-border pb-3">
            <Layers className="w-4 h-4 text-primary" />
            Fixed Appliance & Archwire Protocol
          </h3>

          <div className="space-y-3">
            {archwires.map((w, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-border bg-surface-hover/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-primary">{w.arch}</span>
                  <span className="text-[10px] text-text-secondary">Engaged: {w.installedDate}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-text-primary block">{w.currentWire}</span>
                  <span className="text-[11px] text-text-secondary mt-1 block">
                    Next wire transition scheduled: <strong>{w.nextWire}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-text-secondary">
            <p className="font-medium text-text-primary">Elastic Traction Instructions:</p>
            <p className="mt-0.5">Class II Elastics (3/16" 4.5 oz) active full-time from Upper Canine (#6, #11) to Lower First Molar (#19, #30).</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrthodonticsPage
