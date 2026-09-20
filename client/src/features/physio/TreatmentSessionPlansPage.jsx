import React, { useState } from 'react'
import {
  ClipboardList,
  Plus,
  CheckCircle2,
  Clock,
  ArrowRight,
  Activity,
  Calendar,
  User,
  Sparkles,
  FileCheck,
} from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { notify } from '../../components/ui/Toast'

export const TreatmentSessionPlansPage = () => {
  const [selectedPlan, setSelectedPlan] = useState('Rotator Cuff Post-Surgical Rehab')

  const samplePlans = [
    {
      id: 'plan-1',
      title: 'Rotator Cuff Post-Surgical Rehab',
      patientName: 'Eleanor Vance-Bishop',
      patientId: 'MRN-84920',
      status: 'IN_PROGRESS',
      progress: 65,
      sessionsCompleted: 8,
      totalSessions: 12,
      startDate: '2026-08-15',
      therapist: 'Dr. Marcus Vance PT, DPT',
      phases: [
        {
          name: 'Phase 1: Passive ROM & Pain Modulation',
          sessions: 'Sessions 1-4',
          status: 'COMPLETED',
          modalities: ['Cryotherapy', 'Gentle PROM', 'Scapular Clocks', 'Pendulum Swings'],
        },
        {
          name: 'Phase 2: Active-Assisted ROM & Dynamic Stabilization',
          sessions: 'Sessions 5-8',
          status: 'COMPLETED',
          modalities: ['Pulley Exercises', 'Isometric External Rotation', 'Sleeper Stretch'],
        },
        {
          name: 'Phase 3: Progressive Resistance & Functional Strengthening',
          sessions: 'Sessions 9-12',
          status: 'IN_PROGRESS',
          modalities: ['Theraband Row', 'Prone Y/T/W', 'PNF D2 Flexion Pattern'],
        },
      ],
    },
    {
      id: 'plan-2',
      title: 'Lumbar Disc Herniation & Core Re-education',
      patientName: 'Liam Alexander Reyes',
      patientId: 'MRN-84921',
      status: 'ACTIVE',
      progress: 40,
      sessionsCompleted: 4,
      totalSessions: 10,
      startDate: '2026-09-02',
      therapist: 'Dr. Marcus Vance PT, DPT',
      phases: [
        {
          name: 'Phase 1: McKenzie Extension & Neural Glides',
          sessions: 'Sessions 1-3',
          status: 'COMPLETED',
          modalities: ['Prone on Elbows', 'Sciatic Nerve Flossing', 'TENS Neuromodulation'],
        },
        {
          name: 'Phase 2: Deep Core Activation & Spinal Decompression',
          sessions: 'Sessions 4-7',
          status: 'IN_PROGRESS',
          modalities: ['Dead Bug Progressions', 'Bird-Dog Neutral Spine', 'Pelvic Tilts'],
        },
      ],
    },
  ]

  const currentPlan = samplePlans.find((p) => p.title === selectedPlan) || samplePlans[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading font-extrabold text-2xl text-text-primary">
              Treatment & Session Plans
            </h1>
            <Badge variant="primary" size="sm">
              Physiotherapy Protocol
            </Badge>
          </div>
          <p className="text-sm text-text-muted mt-1">
            Structured rehabilitation plans, targeted milestones, session frequency and modalities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => notify.info('Exporting therapy session summary...')}
          >
            Export Plan
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => notify.success('New session plan protocol initialized')}
          >
            New Session Plan
          </Button>
        </div>
      </div>

      {/* Plan Selector & Progress KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {samplePlans.map((plan) => (
          <div
            key={plan.id}
            onClick={() => setSelectedPlan(plan.title)}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              selectedPlan === plan.title
                ? 'bg-primary/5 border-primary shadow-sm'
                : 'bg-surface border-border hover:border-primary/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                {plan.patientName}
              </span>
              <Badge variant={plan.status === 'COMPLETED' ? 'success' : 'info'} size="xs">
                {plan.status}
              </Badge>
            </div>
            <h3 className="font-heading font-semibold text-sm text-text-primary mt-1 truncate">
              {plan.title}
            </h3>
            <div className="flex items-center justify-between text-xs text-text-muted mt-3">
              <span>{plan.sessionsCompleted} of {plan.totalSessions} Sessions</span>
              <span className="font-semibold text-text-primary">{plan.progress}%</span>
            </div>
            <div className="w-full bg-border/40 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${plan.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Active Plan Phases Breakdown */}
      <div className="bg-surface border border-border rounded-xl p-5 space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
          <div>
            <h2 className="font-heading font-bold text-lg text-text-primary">
              {currentPlan.title}
            </h2>
            <div className="flex items-center gap-3 text-xs text-text-muted mt-1">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Patient: {currentPlan.patientName} ({currentPlan.patientId})
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Started: {currentPlan.startDate}
              </span>
            </div>
          </div>
          <Badge variant="primary">Lead Therapist: {currentPlan.therapist}</Badge>
        </div>

        <div className="space-y-4">
          {currentPlan.phases.map((phase, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-border/80 bg-bg/40 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    phase.status === 'COMPLETED'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-primary/10 text-primary'
                  }`}>
                    {idx + 1}
                  </div>
                  <h4 className="font-heading font-semibold text-sm text-text-primary">
                    {phase.name}
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted font-medium">{phase.sessions}</span>
                  <Badge
                    variant={phase.status === 'COMPLETED' ? 'success' : 'info'}
                    size="xs"
                  >
                    {phase.status}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pl-8">
                {phase.modalities.map((mod, mIdx) => (
                  <span
                    key={mIdx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-surface border border-border text-xs text-text-secondary"
                  >
                    <Activity className="w-3 h-3 text-primary" />
                    {mod}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TreatmentSessionPlansPage
