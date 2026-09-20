import React, { useState } from 'react'
import {
  ClipboardList,
  Plus,
  CheckCircle2,
  Clock,
  ArrowRight,
  DollarSign,
  Download,
  Share2,
  FileCheck,
} from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { notify } from '../../components/ui/Toast'

export const TreatmentPlansPage = () => {
  const [activePlan, setActivePlan] = useState('Comprehensive Full Mouth Rehabilitation')

  const procedures = [
    {
      phase: 'Phase 1: Emergency & Preventative Care',
      items: [
        { code: 'D0150', desc: 'Comprehensive Oral Evaluation', tooth: 'All', fee: 1800, copay: 1800, outOfPocket: 0, status: 'COMPLETED' },
        { code: 'D1110', desc: 'Adult Prophylaxis & Calculus Scaling', tooth: 'All', fee: 2400, copay: 1920, outOfPocket: 480, status: 'COMPLETED' },
        { code: 'D0210', desc: 'Complete Intraoral Full-Mouth Radiographic Series', tooth: 'All', fee: 1500, copay: 1500, outOfPocket: 0, status: 'COMPLETED' },
      ],
    },
    {
      phase: 'Phase 2: Restorative & Endodontic Care',
      items: [
        { code: 'D3330', desc: 'Endodontic Therapy - Molar (Tooth #19)', tooth: '#19', fee: 8500, copay: 5100, outOfPocket: 3400, status: 'IN_PROGRESS' },
        { code: 'D2392', desc: 'Resin-based Composite - Two Surfaces, Posterior', tooth: '#14 (MO)', fee: 3200, copay: 2240, outOfPocket: 960, status: 'ACCEPTED' },
        { code: 'D2391', desc: 'Resin-based Composite - One Surface, Posterior', tooth: '#3 (O)', fee: 2600, copay: 1820, outOfPocket: 780, status: 'ACCEPTED' },
      ],
    },
    {
      phase: 'Phase 3: Prosthodontic & Crown Restoration',
      items: [
        { code: 'D2740', desc: 'Crown - Porcelain / Ceramic Substrate', tooth: '#19', fee: 14500, copay: 7250, outOfPocket: 7250, status: 'PLANNED' },
        { code: 'D2950', desc: 'Core Buildup, Including Any Pins', tooth: '#19', fee: 3800, copay: 1900, outOfPocket: 1900, status: 'PLANNED' },
      ],
    },
  ]

  const totalFee = procedures.flatMap(p => p.items).reduce((acc, i) => acc + i.fee, 0)
  const totalInsurance = procedures.flatMap(p => p.items).reduce((acc, i) => acc + i.copay, 0)
  const totalPatientPortion = procedures.flatMap(p => p.items).reduce((acc, i) => acc + i.outOfPocket, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading font-extrabold text-2xl text-text-primary">
              Dental Treatment Plans
            </h1>
            <Badge variant="primary" size="sm">
              ADA Procedure Mapping
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Multi-phase clinical procedure sequencing, ADA dental codes, copay calculations & patient estimates
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={() => notify.success('Treatment estimate PDF generated for patient.')}
          >
            Export Estimate
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => notify.info('Procedure catalog selector opened.')}
          >
            Add Procedure
          </Button>
        </div>
      </div>

      {/* Summary Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-border bg-surface shadow-soft">
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1">
            Total Treatment Cost
          </span>
          <div className="font-heading font-extrabold text-2xl text-text-primary">
            ₹{totalFee.toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-text-secondary mt-1 block">8 planned clinical procedures</span>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-surface shadow-soft">
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1">
            Estimated Insurance Cover
          </span>
          <div className="font-heading font-extrabold text-2xl text-emerald-500">
            ₹{totalInsurance.toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-text-secondary mt-1 block">TPA Pre-authorization confirmed</span>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-surface shadow-soft">
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1">
            Patient Out-of-Pocket
          </span>
          <div className="font-heading font-extrabold text-2xl text-primary">
            ₹{totalPatientPortion.toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-text-secondary mt-1 block">Flexible installment plan eligible</span>
        </div>
      </div>

      {/* Phased Procedure Table */}
      <div className="space-y-6">
        {procedures.map((phaseGroup, idx) => (
          <div key={idx} className="p-5 rounded-2xl border border-border bg-surface shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-heading font-bold text-sm text-text-primary flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-primary" />
                {phaseGroup.phase}
              </h3>
              <Badge variant="secondary" size="sm">
                {phaseGroup.items.length} Procedures
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-text-secondary border-b border-border">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">ADA Code</th>
                    <th className="py-2.5 px-3 font-semibold">Procedure Description</th>
                    <th className="py-2.5 px-3 font-semibold">Tooth / Site</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Fee (INR)</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Insurance</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Patient Due</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {phaseGroup.items.map((item, itemIdx) => (
                    <tr key={itemIdx} className="hover:bg-surface-hover/50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-primary">{item.code}</td>
                      <td className="py-3 px-3 font-medium text-text-primary">{item.desc}</td>
                      <td className="py-3 px-3 font-semibold text-text-secondary">{item.tooth}</td>
                      <td className="py-3 px-3 font-mono text-right text-text-primary">₹{item.fee.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3 font-mono text-right text-emerald-500">₹{item.copay.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3 font-mono text-right font-bold text-primary">₹{item.outOfPocket.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'COMPLETED'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : item.status === 'IN_PROGRESS'
                              ? 'bg-amber-500/10 text-amber-500'
                              : 'bg-primary/10 text-primary'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TreatmentPlansPage
