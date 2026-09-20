import React, { useState } from 'react'
import {
  Activity,
  Plus,
  CheckCircle2,
  Clock,
  Heart,
  FileText,
  AlertTriangle,
  Download,
  Share2,
  Calendar,
  User,
  Zap,
} from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { notify } from '../../components/ui/Toast'

export const EcgRecordsPage = () => {
  const [selectedRecord, setSelectedRecord] = useState('ecg-001')

  const ecgRecords = [
    {
      id: 'ecg-001',
      ecgNumber: 'ECG-2026-089',
      patientName: 'Arthur Pendelton',
      patientId: 'MRN-CARD-1029',
      age: 64,
      gender: 'Male',
      date: '2026-09-19 14:22',
      rhythm: 'Normal Sinus Rhythm with First-Degree AV Block',
      heartRate: 68,
      prInterval: '218 ms (Prolonged)',
      qrsDuration: '92 ms (Normal)',
      qtcInterval: '435 ms (Bazett)',
      axis: '+45° (Normal Axis)',
      stSegment: 'Isoelectric, no acute ST-elevation or depression',
      status: 'VERIFIED',
      cardiologist: 'Dr. Sarah Lin, MD, FACC',
      priority: 'ROUTINE',
      leadFindings: [
        { lead: 'Leads I, aVL, V5-V6', interpretation: 'Normal lateral repolarization' },
        { lead: 'Leads II, III, aVF', interpretation: 'Slightly prominent upright P waves' },
        { lead: 'Leads V1-V2', interpretation: 'Normal rS pattern, no RBBB' },
        { lead: 'Leads V3-V4', interpretation: 'Normal R wave transition at V3' },
      ],
    },
    {
      id: 'ecg-002',
      ecgNumber: 'ECG-2026-088',
      patientName: 'Elena Rostova',
      patientId: 'MRN-CARD-1033',
      age: 58,
      gender: 'Female',
      date: '2026-09-18 09:40',
      rhythm: 'Atrial Fibrillation with Rapid Ventricular Response',
      heartRate: 124,
      prInterval: 'Undetermined (Irregular rhythm)',
      qrsDuration: '88 ms (Narrow complex)',
      qtcInterval: '448 ms',
      axis: '+30°',
      stSegment: 'Non-specific ST-T wave changes in lateral leads',
      status: 'REQUIRES_REVIEW',
      cardiologist: 'Dr. Michael Chang, MD',
      priority: 'URGENT',
      leadFindings: [
        { lead: 'V1-V6', interpretation: 'Coarse fibrillatory waves, absent distinct P waves' },
        { lead: 'Lateral', interpretation: '1mm horizontal ST depression V5-V6' },
      ],
    },
    {
      id: 'ecg-003',
      ecgNumber: 'ECG-2026-085',
      patientName: 'David K. Morrison',
      patientId: 'MRN-CARD-0994',
      age: 72,
      gender: 'Male',
      date: '2026-09-17 16:15',
      rhythm: 'Sinus Bradycardia with Left Anterior Fascicular Block',
      heartRate: 52,
      prInterval: '172 ms',
      qrsDuration: '104 ms',
      qtcInterval: '420 ms',
      axis: '-50° (Left Axis Deviation)',
      stSegment: 'T-wave flattening in AVL, no reciprocal ST elevation',
      status: 'VERIFIED',
      cardiologist: 'Dr. Sarah Lin, MD, FACC',
      priority: 'ROUTINE',
      leadFindings: [
        { lead: 'Limb Leads', interpretation: 'qR in I and aVL, rS in II, III, aVF confirming LAFB' },
      ],
    },
  ]

  const activeRecord = ecgRecords.find((r) => r.id === selectedRecord) || ecgRecords[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading font-extrabold text-2xl text-text-primary">
              12-Lead ECG / EKG Records
            </h1>
            <Badge variant="primary" size="sm">
              Electrophysiology & Waveform Telemetry
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            12-lead electrocardiograms, rhythm diagnostics, automated interval measurements & digital cardiologist sign-off
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={() => notify.info('Exporting 12-lead ECG PDF archive...')}
          >
            Export PDF
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => notify.info('Acquisition interface opened for new 12-lead telemetry.')}
          >
            Record New ECG
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ECG Records List */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Recent Tracings ({ecgRecords.length})
          </h2>

          {ecgRecords.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedRecord(item.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedRecord === item.id
                  ? 'border-primary bg-primary/5 shadow-soft'
                  : 'border-border bg-surface hover:border-border-hover'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-primary">{item.ecgNumber}</span>
                <Badge
                  variant={item.priority === 'URGENT' ? 'danger' : 'success'}
                  size="xs"
                >
                  {item.priority}
                </Badge>
              </div>

              <h3 className="font-semibold text-sm text-text-primary mt-1">{item.patientName}</h3>
              <p className="text-xs text-text-muted">{item.patientId} • {item.age}y {item.gender}</p>

              <div className="mt-2 text-xs font-medium text-text-secondary line-clamp-1">
                {item.rhythm}
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-text-muted border-t border-border/40 pt-2">
                <span className="flex items-center gap-1 font-mono">
                  <Zap className="w-3.5 h-3.5 text-warning" /> {item.heartRate} bpm
                </span>
                <span>{item.date}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Selected ECG Detail & Waveform Viewer */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-border bg-surface shadow-soft space-y-6">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-text-primary">{activeRecord.patientName}</h2>
                  <Badge variant={activeRecord.status === 'VERIFIED' ? 'success' : 'warning'} size="sm">
                    {activeRecord.status}
                  </Badge>
                </div>
                <p className="text-xs text-text-muted font-mono mt-0.5">
                  Record: {activeRecord.ecgNumber} • Acquired: {activeRecord.date}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="xs"
                  variant="outline"
                  leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-success" />}
                  onClick={() => notify.success('ECG verified & signed off by attending cardiologist.')}
                >
                  Sign Off
                </Button>
              </div>
            </div>

            {/* Simulated 12-Lead Rhythm Strip Canvas */}
            <div className="rounded-xl border border-border/80 bg-black/90 p-4 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-emerald-400 font-mono mb-2">
                <span>Speed: 25 mm/s | Voltage: 10 mm/mV | Filter: 0.05-150 Hz</span>
                <span className="flex items-center gap-1 text-emerald-300 font-bold">
                  <Activity className="w-3.5 h-3.5 animate-pulse" /> Lead II Rhythm Strip
                </span>
              </div>

              {/* Waveform SVG */}
              <div className="h-28 w-full flex items-center justify-center">
                <svg viewBox="0 0 800 120" className="w-full h-full stroke-emerald-400 fill-none stroke-[1.5]">
                  {/* Grid background */}
                  <pattern id="ecg-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="0.5" />
                  </pattern>
                  <rect width="800" height="120" fill="url(#ecg-grid)" />

                  {/* Simulated ECG P-Q-R-S-T repeats */}
                  <path d="
                    M 0 60 L 40 60 Q 48 50 56 60 L 70 60 L 74 65 L 82 15 L 88 85 L 94 60 L 110 60 Q 124 45 138 60 L 200 60
                    L 240 60 Q 248 50 256 60 L 270 60 L 274 65 L 282 15 L 288 85 L 294 60 L 310 60 Q 324 45 338 60 L 400 60
                    L 440 60 Q 448 50 456 60 L 470 60 L 474 65 L 482 15 L 488 85 L 494 60 L 510 60 Q 524 45 538 60 L 600 60
                    L 640 60 Q 648 50 656 60 L 670 60 L 674 65 L 682 15 L 688 85 L 694 60 L 710 60 Q 724 45 738 60 L 800 60
                  " />
                </svg>
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] text-emerald-500/80 font-mono">
                <span>Calibration: 1 mV Pulse [⊓ 10mm]</span>
                <span>Heart Rate: {activeRecord.heartRate} BPM (Regular Sinus)</span>
              </div>
            </div>

            {/* Intervals Table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl border border-border bg-surface-secondary/40">
                <span className="text-[11px] text-text-muted uppercase font-semibold">Ventricular Rate</span>
                <p className="text-base font-bold text-text-primary mt-0.5">{activeRecord.heartRate} bpm</p>
              </div>
              <div className="p-3 rounded-xl border border-border bg-surface-secondary/40">
                <span className="text-[11px] text-text-muted uppercase font-semibold">PR Interval</span>
                <p className="text-base font-bold text-text-primary mt-0.5">{activeRecord.prInterval.split(' ')[0]}</p>
              </div>
              <div className="p-3 rounded-xl border border-border bg-surface-secondary/40">
                <span className="text-[11px] text-text-muted uppercase font-semibold">QRS Duration</span>
                <p className="text-base font-bold text-text-primary mt-0.5">{activeRecord.qrsDuration.split(' ')[0]}</p>
              </div>
              <div className="p-3 rounded-xl border border-border bg-surface-secondary/40">
                <span className="text-[11px] text-text-muted uppercase font-semibold">QTc Interval</span>
                <p className="text-base font-bold text-text-primary mt-0.5">{activeRecord.qtcInterval.split(' ')[0]}</p>
              </div>
            </div>

            {/* Diagnostic Impression */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Cardiologist Diagnostic Interpretation
              </h3>
              <div className="p-4 rounded-xl border border-border/80 bg-surface-secondary/30 space-y-2">
                <div className="text-sm font-semibold text-text-primary">
                  {activeRecord.rhythm}
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Axis: {activeRecord.axis}. ST Segment: {activeRecord.stSegment}.
                </p>
                <div className="text-xs text-primary font-medium pt-1">
                  Interpreting Attending: {activeRecord.cardiologist}
                </div>
              </div>
            </div>

            {/* Detailed Lead Findings */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-text-muted uppercase">Regional Lead Breakdown</h4>
              <div className="space-y-1.5">
                {activeRecord.leadFindings.map((lf, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-surface border border-border">
                    <span className="font-semibold text-text-primary">{lf.lead}</span>
                    <span className="text-text-secondary">{lf.interpretation}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EcgRecordsPage
