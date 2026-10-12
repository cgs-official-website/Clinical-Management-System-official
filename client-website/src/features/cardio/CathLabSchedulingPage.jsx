import React, { useState } from 'react'
import {
  Clock,
  Plus,
  CheckCircle2,
  Calendar,
  AlertCircle,
  User,
  Heart,
  Activity,
  Layers,
  Search,
  Sliders,
  Filter,
} from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { notify } from '../../components/ui/Toast'

export const CathLabSchedulingPage = () => {
  const [selectedSuite, setSelectedSuite] = useState('ALL')

  const suites = [
    { id: 'LAB-1', name: 'Cath Lab 1 (Coronary Intervention Suite)', status: 'IN_PROCEDURE', currentCase: 'PCI LAD Stenting' },
    { id: 'LAB-2', name: 'Cath Lab 2 (Structural & EP Suite)', status: 'READY', currentCase: 'Next: Pacemaker Dual Chamber' },
    { id: 'LAB-3', name: 'Hybrid OR / Peripheral Suite', status: 'TURNOVER', currentCase: 'Sterilization & Restock' },
  ]

  const schedule = [
    {
      id: 'proc-01',
      time: '08:30 - 10:00',
      lab: 'Cath Lab 1',
      procedure: 'Left Heart Cath + Coronary Angiography ± PCI',
      patientName: 'Gregory Henderson',
      patientId: 'MRN-CARD-1065',
      interventionalist: 'Dr. Sarah Lin, MD',
      scrubNurse: 'Tanya Morales, RN',
      radiologicTech: 'Jason Brody, RT(R)(CI)',
      status: 'IN_PROGRESS',
      accessSite: 'Right Radial Artery (Glidesheath 6 Fr)',
      contrastAgent: 'Visipaque 320 (Est. 65 mL)',
      fluoroscopyTime: '12.4 mins (Cumulative)',
      urgency: 'ELECTIVE',
    },
    {
      id: 'proc-02',
      time: '10:30 - 12:00',
      lab: 'Cath Lab 2',
      procedure: 'Permanent Dual-Chamber Pacemaker Implantation',
      patientName: 'Harold Jenkins',
      patientId: 'MRN-CARD-1070',
      interventionalist: 'Dr. Michael Chang, MD (EP)',
      scrubNurse: 'Angela Foster, RN',
      radiologicTech: 'Samira Patel, RT(R)',
      status: 'PRE_OP_PREP',
      accessSite: 'Left Subclavian / Axillary Vein',
      urgency: 'SCHEDULED',
    },
    {
      id: 'proc-03',
      time: '12:30 - 14:00',
      lab: 'Cath Lab 1',
      procedure: 'Diagnostic Coronary Angiography (Rule Out CAD)',
      patientName: 'Patricia Lynn Alvarez',
      patientId: 'MRN-CARD-1081',
      interventionalist: 'Dr. Sarah Lin, MD',
      scrubNurse: 'Tanya Morales, RN',
      radiologicTech: 'Jason Brody, RT(R)(CI)',
      status: 'SCHEDULED',
      accessSite: 'Right Radial Artery',
      urgency: 'ROUTINE',
    },
    {
      id: 'proc-04',
      time: '14:30 - 16:30',
      lab: 'Cath Lab 2',
      procedure: 'Catheter Radiofrequency Ablation for Atrial Flutter',
      patientName: 'Donald B. Weber',
      patientId: 'MRN-CARD-1092',
      interventionalist: 'Dr. Michael Chang, MD',
      scrubNurse: 'Angela Foster, RN',
      radiologicTech: 'Samira Patel, RT(R)',
      status: 'SCHEDULED',
      accessSite: 'Bilateral Femoral Veins (Carto 3 3D Mapping)',
      urgency: 'ELECTIVE',
    },
  ]

  const filteredSchedule = selectedSuite === 'ALL'
    ? schedule
    : schedule.filter((s) => s.lab.includes(selectedSuite))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading font-extrabold text-2xl text-text-primary">
              Cath Lab / Procedure Scheduling
            </h1>
            <Badge variant="primary" size="sm">
              Invasive & Interventional Cardiology
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Cardiac catheterization lab suites, PCI stent slots, diagnostic angiograms & electrophysiology implant calendar
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => notify.info('Procedure booking wizard opened.')}
          >
            Book Cath Lab Case
          </Button>
        </div>
      </div>

      {/* Cath Lab Room Status Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {suites.map((suite) => (
          <div key={suite.id} className="p-4 rounded-xl border border-border bg-surface shadow-soft space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-text-primary">{suite.id}</span>
              <Badge
                variant={
                  suite.status === 'IN_PROCEDURE' ? 'danger' : suite.status === 'READY' ? 'success' : 'warning'
                }
                size="xs"
              >
                {suite.status}
              </Badge>
            </div>
            <h3 className="text-xs font-semibold text-text-secondary">{suite.name}</h3>
            <p className="text-[11px] text-text-muted font-mono">{suite.currentCase}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        {['ALL', 'Lab 1', 'Lab 2'].map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedSuite(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedSuite === tab
                ? 'bg-primary text-white shadow-soft'
                : 'text-text-secondary hover:bg-surface-secondary'
            }`}
          >
            {tab === 'ALL' ? 'All Operating Suites' : tab}
          </button>
        ))}
      </div>

      {/* Procedure Timeline Cards */}
      <div className="space-y-3">
        {filteredSchedule.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-2xl border border-border bg-surface shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary/40 transition-all"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-bold text-primary flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {item.time}
                </span>
                <Badge variant="outline" size="xs">
                  {item.lab}
                </Badge>
                <Badge
                  variant={item.status === 'IN_PROGRESS' ? 'danger' : 'info'}
                  size="xs"
                >
                  {item.status}
                </Badge>
              </div>

              <h3 className="text-base font-bold text-text-primary">{item.procedure}</h3>
              <p className="text-xs text-text-muted">
                Patient: <span className="font-medium text-text-primary">{item.patientName}</span> ({item.patientId}) • Access: {item.accessSite}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary pt-1">
                <span>Interventionalist: <strong className="text-text-primary">{item.interventionalist}</strong></span>
                <span>Scrub: {item.scrubNurse}</span>
                <span>RT Tech: {item.radiologicTech}</span>
              </div>
            </div>

            <div className="flex flex-row md:flex-col items-end justify-between gap-2 border-t md:border-t-0 md:border-l border-border pt-3 md:pt-0 md:pl-4 min-w-40">
              {item.fluoroscopyTime && (
                <div className="text-right">
                  <span className="text-[10px] text-text-muted uppercase">Fluoro Exposure</span>
                  <p className="text-xs font-mono font-bold text-warning">{item.fluoroscopyTime}</p>
                </div>
              )}
              <Button
                variant="outline"
                size="xs"
                onClick={() => notify.info(`Opening intra-procedure log for ${item.patientName}`)}
              >
                Intra-Op Log
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CathLabSchedulingPage
