import React, { useState } from 'react'
import {
  FileText,
  Plus,
  Compass,
  Smile,
  Activity,
  Calendar,
  User,
  ChevronDown,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { notify } from '../../components/ui/Toast'

export const ProgressRecoveryNotesPage = () => {
  const [activeTab, setActiveTab] = useState('notes')

  const notes = [
    {
      id: 'note-1',
      date: '2026-09-18',
      sessionNumber: 8,
      patientName: 'Eleanor Vance-Bishop (MRN-84920)',
      therapist: 'Dr. Marcus Vance PT, DPT',
      soap: {
        subjective: 'Patient reports significant reduction in resting pain (VAS 2/10 down from 6/10). Able to reach top cabinet without sharp impingement.',
        objective: 'Shoulder active abduction improved from 115° to 142°. External rotation at 90° abduction measured at 68°. Empty can test produces mild discomfort, no overt drop.',
        assessment: 'Progressing well through Phase 2. Good motor control during dynamic scapular stabilization. Minimal compensatory cervical hiking.',
        plan: 'Initiate light Theraband resistance exercises. Continue rotator cuff strengthening. Re-assess ROM in 2 weeks.',
      },
      romMetrics: [
        { joint: 'R Shoulder Flexion', value: '155°', change: '+20°' },
        { joint: 'R Shoulder Abduction', value: '142°', change: '+27°' },
        { joint: 'R External Rotation', value: '68°', change: '+14°' },
      ],
      painScore: 2,
    },
    {
      id: 'note-2',
      date: '2026-09-11',
      sessionNumber: 6,
      patientName: 'Liam Alexander Reyes (MRN-84921)',
      therapist: 'Dr. Marcus Vance PT, DPT',
      soap: {
        subjective: 'Reports centralizing of lower back discomfort. Morning stiffness duration reduced from 45 minutes to 15 minutes.',
        objective: 'Straight Leg Raise (SLR) right lower extremity negative at 75°. Lumbar extension active range increased by 12°. Normal patellar reflexes bilaterally.',
        assessment: 'Radicular symptoms resolved; residual localized muscular tenderness over right quadratus lumborum.',
        plan: 'Advance core stabilization regimen with bird-dog and side-plank progressions. Emphasize ergonomic desk setup.',
      },
      romMetrics: [
        { joint: 'Lumbar Flexion', value: '65°', change: '+10°' },
        { joint: 'Lumbar Extension', value: '24°', change: '+12°' },
        { joint: 'Right SLR', value: '75°', change: '+20°' },
      ],
      painScore: 3,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading font-extrabold text-2xl text-text-primary">
              Progress & Recovery Notes
            </h1>
            <Badge variant="primary" size="sm">
              Clinical SOAP & ROM
            </Badge>
          </div>
          <p className="text-sm text-text-muted mt-1">
            Rehabilitation progress documentation, goniometric ROM measurements and pain scale trajectories
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => notify.info('Exporting SOAP notes packet...')}
          >
            Export Notes
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => notify.success('New SOAP Encounter Note created')}
          >
            New Progress Note
          </Button>
        </div>
      </div>

      {/* Metric Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-border bg-surface shadow-sm">
          <span className="text-xs font-semibold text-text-muted uppercase">Average Pain Reduction</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-heading font-bold text-text-primary">-62%</span>
            <Badge variant="success" size="xs">
              <TrendingDown className="w-3 h-3 mr-1" /> VAS 7.1 → 2.7
            </Badge>
          </div>
          <p className="text-xs text-text-muted mt-3">Across active rehabilitation cohorts</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface shadow-sm">
          <span className="text-xs font-semibold text-text-muted uppercase">Mean ROM Recovery</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-heading font-bold text-text-primary">+28.4°</span>
            <Badge variant="info" size="xs">
              <TrendingUp className="w-3 h-3 mr-1" /> Goniometric
            </Badge>
          </div>
          <p className="text-xs text-text-muted mt-3">8-week post-op benchmarks met</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface shadow-sm">
          <span className="text-xs font-semibold text-text-muted uppercase">Functional Milestone Rate</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-heading font-bold text-text-primary">91.4%</span>
            <Badge variant="success" size="xs">High Velocity</Badge>
          </div>
          <p className="text-xs text-text-muted mt-3">Target achieved ahead of schedule</p>
        </div>
      </div>

      {/* Progress Notes Timeline */}
      <div className="space-y-4">
        {notes.map((note) => (
          <div
            key={note.id}
            className="p-5 rounded-xl border border-border bg-surface space-y-4 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-heading font-bold text-base text-text-primary">
                    Session #{note.sessionNumber} SOAP Encounter
                  </span>
                  <Badge variant="outline" size="xs">
                    {note.date}
                  </Badge>
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  Patient: {note.patientName} • Attending: {note.therapist}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted">Pain Score (VAS):</span>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                  {note.painScore} / 10
                </span>
              </div>
            </div>

            {/* SOAP Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-lg bg-bg/50 border border-border/60 space-y-1">
                <span className="font-bold text-primary tracking-wide uppercase">S - Subjective</span>
                <p className="text-text-secondary leading-relaxed">{note.soap.subjective}</p>
              </div>

              <div className="p-3.5 rounded-lg bg-bg/50 border border-border/60 space-y-1">
                <span className="font-bold text-primary tracking-wide uppercase">O - Objective</span>
                <p className="text-text-secondary leading-relaxed">{note.soap.objective}</p>
              </div>

              <div className="p-3.5 rounded-lg bg-bg/50 border border-border/60 space-y-1">
                <span className="font-bold text-primary tracking-wide uppercase">A - Assessment</span>
                <p className="text-text-secondary leading-relaxed">{note.soap.assessment}</p>
              </div>

              <div className="p-3.5 rounded-lg bg-bg/50 border border-border/60 space-y-1">
                <span className="font-bold text-primary tracking-wide uppercase">P - Plan</span>
                <p className="text-text-secondary leading-relaxed">{note.soap.plan}</p>
              </div>
            </div>

            {/* Goniometric ROM Measurements */}
            <div className="pt-2">
              <span className="text-xs font-semibold text-text-muted block mb-2">
                Active Goniometric Measurements
              </span>
              <div className="flex flex-wrap gap-2">
                {note.romMetrics.map((m, mIdx) => (
                  <div
                    key={mIdx}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg border border-border text-xs"
                  >
                    <Compass className="w-3.5 h-3.5 text-primary" />
                    <span className="text-text-muted">{m.joint}:</span>
                    <span className="font-bold text-text-primary">{m.value}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                      ({m.change})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ProgressRecoveryNotesPage
