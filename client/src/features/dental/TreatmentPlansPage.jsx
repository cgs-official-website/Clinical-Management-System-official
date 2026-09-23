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
  X,
  Printer,
  FileText,
  Trash2
} from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { notify } from '../../components/ui/Toast'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'

export const TreatmentPlansPage = () => {
  const [procedures, setProcedures] = useState([
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
  ])

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)

  // Add Procedure Form State
  const [selectedPhase, setSelectedPhase] = useState('Phase 1: Emergency & Preventative Care')
  const [customPhase, setCustomPhase] = useState('')
  const [adaCode, setAdaCode] = useState('D2740')
  const [description, setDescription] = useState('')
  const [toothSite, setToothSite] = useState('#19')
  const [fee, setFee] = useState('')
  const [insuranceCover, setInsuranceCover] = useState('')
  const [status, setStatus] = useState('PLANNED')

  const totalFee = procedures.flatMap(p => p.items).reduce((acc, i) => acc + i.fee, 0)
  const totalInsurance = procedures.flatMap(p => p.items).reduce((acc, i) => acc + i.copay, 0)
  const totalPatientPortion = procedures.flatMap(p => p.items).reduce((acc, i) => acc + i.outOfPocket, 0)
  const totalProceduresCount = procedures.flatMap(p => p.items).length

  // Add Procedure Submit Handler
  const handleAddProcedure = (e) => {
    e.preventDefault()

    const feeNum = parseFloat(fee) || 0
    const copayNum = parseFloat(insuranceCover) || 0
    const outOfPocketNum = Math.max(0, feeNum - copayNum)
    const targetPhaseName = selectedPhase === 'NEW_PHASE' ? (customPhase || 'Phase 4: Additional Procedures') : selectedPhase

    const newItem = {
      code: adaCode || 'D9999',
      desc: description || 'Dental Procedure',
      tooth: toothSite || 'All',
      fee: feeNum,
      copay: copayNum,
      outOfPocket: outOfPocketNum,
      status: status
    }

    setProcedures(prev => {
      const existingPhaseIndex = prev.findIndex(p => p.phase === targetPhaseName)
      if (existingPhaseIndex >= 0) {
        const updated = [...prev]
        updated[existingPhaseIndex] = {
          ...updated[existingPhaseIndex],
          items: [...updated[existingPhaseIndex].items, newItem]
        }
        return updated
      } else {
        return [...prev, { phase: targetPhaseName, items: [newItem] }]
      }
    })

    notify.success('New procedure added to treatment plan!')
    setIsAddOpen(false)

    // Reset Form
    setDescription('')
    setFee('')
    setInsuranceCover('')
    setToothSite('#19')
  }

  // Remove Procedure Handler
  const handleRemoveProcedure = (phaseIndex, itemIndex) => {
    setProcedures(prev => {
      const updated = [...prev]
      const targetItems = [...updated[phaseIndex].items]
      targetItems.splice(itemIndex, 1)

      if (targetItems.length === 0) {
        updated.splice(phaseIndex, 1)
      } else {
        updated[phaseIndex] = { ...updated[phaseIndex], items: targetItems }
      }
      return updated
    })
    notify.info('Procedure removed from treatment plan.')
  }

  // Export & Print Handler
  const handlePrintEstimate = () => {
    window.print()
  }

  const handleDownloadTextEstimate = () => {
    let content = `DENTAL TREATMENT PLAN & PATIENT ESTIMATE\n`
    content += `==========================================\n`
    content += `Generated Date: ${new Date().toLocaleDateString()}\n`
    content += `Total Treatment Cost: ₹${totalFee.toLocaleString('en-IN')}\n`
    content += `Estimated Insurance Cover: ₹${totalInsurance.toLocaleString('en-IN')}\n`
    content += `Patient Out-of-Pocket: ₹${totalPatientPortion.toLocaleString('en-IN')}\n\n`

    procedures.forEach(p => {
      content += `--- ${p.phase} ---\n`
      p.items.forEach(i => {
        content += `[${i.code}] ${i.desc} | Tooth: ${i.tooth} | Fee: ₹${i.fee} | Insurance: ₹${i.copay} | Patient Due: ₹${i.outOfPocket} | Status: ${i.status}\n`
      })
      content += `\n`
    })

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Dental_Treatment_Estimate_${Date.now()}.txt`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    notify.success('Treatment estimate exported successfully!')
  }

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
            onClick={() => setIsExportOpen(true)}
          >
            Export Estimate
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddOpen(true)}
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
          <span className="text-xs text-text-secondary mt-1 block">
            {totalProceduresCount} planned clinical procedures
          </span>
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
                    <th className="py-2.5 px-3 font-semibold text-center">Action</th>
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
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleRemoveProcedure(idx, itemIdx)}
                          className="text-text-secondary hover:text-rose-500 p-1 rounded transition-colors"
                          title="Remove Procedure"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Add Procedure Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Clinical Procedure"
        description="Add a new ADA mapped dental procedure to the patient's treatment plan."
      >
        <form onSubmit={handleAddProcedure} className="space-y-4">
          <Select
            label="Treatment Phase"
            value={selectedPhase}
            onChange={(e) => setSelectedPhase(e.target.value)}
            options={[
              ...procedures.map(p => ({ value: p.phase, label: p.phase })),
              { value: 'NEW_PHASE', label: '+ Create Custom Treatment Phase' }
            ]}
          />

          {selectedPhase === 'NEW_PHASE' && (
            <Input
              label="New Phase Title"
              required
              placeholder="e.g. Phase 4: Orthodontic Alignment"
              value={customPhase}
              onChange={(e) => setCustomPhase(e.target.value)}
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="ADA Code"
              required
              placeholder="e.g. D2740"
              value={adaCode}
              onChange={(e) => setAdaCode(e.target.value)}
            />
            <Input
              label="Tooth / Anatomical Site"
              required
              placeholder="e.g. #19, #14 (MO), All"
              value={toothSite}
              onChange={(e) => setToothSite(e.target.value)}
            />
          </div>

          <Input
            label="Procedure Description"
            required
            placeholder="e.g. Crown - Porcelain / Ceramic Substrate"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Standard Fee (INR ₹)"
              type="number"
              required
              placeholder="14500"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
            />
            <Input
              label="Estimated Insurance Cover (INR ₹)"
              type="number"
              placeholder="7250"
              value={insuranceCover}
              onChange={(e) => setInsuranceCover(e.target.value)}
            />
          </div>

          <Select
            label="Initial Procedure Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: 'PLANNED', label: 'PLANNED' },
              { value: 'ACCEPTED', label: 'ACCEPTED' },
              { value: 'IN_PROGRESS', label: 'IN_PROGRESS' },
              { value: 'COMPLETED', label: 'COMPLETED' },
            ]}
          />

          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-border">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setIsAddOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Procedure
            </Button>
          </div>
        </form>
      </Modal>

      {/* Export Estimate Modal */}
      <Modal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        title="Dental Treatment Estimate Breakdown"
        description="Official patient cost calculation, insurance copay breakdown & ADA mapping summary."
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border border-border bg-bg/60 space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div>
                <h4 className="font-heading font-bold text-sm text-text-primary">
                  Clinical Care Estimate Statement
                </h4>
                <p className="text-[11px] text-text-secondary">
                  Generated: {new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <Badge variant="primary" size="sm">
                Official Estimate
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center py-1">
              <div className="p-2 rounded-xl bg-surface border border-border">
                <span className="text-[10px] text-text-secondary uppercase block">Total Cost</span>
                <span className="font-mono font-bold text-xs text-text-primary">₹{totalFee.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-2 rounded-xl bg-surface border border-border">
                <span className="text-[10px] text-text-secondary uppercase block">Insurance</span>
                <span className="font-mono font-bold text-xs text-emerald-500">₹{totalInsurance.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-2 rounded-xl bg-surface border border-border">
                <span className="text-[10px] text-text-secondary uppercase block">Patient Due</span>
                <span className="font-mono font-bold text-xs text-primary">₹{totalPatientPortion.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              {procedures.map((p, pIdx) => (
                <div key={pIdx} className="space-y-1">
                  <span className="text-[11px] font-bold text-text-primary block">{p.phase}</span>
                  {p.items.map((it, itIdx) => (
                    <div key={itIdx} className="flex items-center justify-between text-[11px] text-text-secondary px-2 py-1 rounded bg-surface">
                      <span className="truncate max-w-[200px]"><strong className="text-primary font-mono">{it.code}</strong> - {it.desc}</span>
                      <span className="font-mono font-semibold text-text-primary">₹{it.outOfPocket.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTextEstimate}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Download (.TXT)
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsExportOpen(false)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handlePrintEstimate}
                leftIcon={<Printer className="w-3.5 h-3.5" />}
              >
                Print Estimate
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default TreatmentPlansPage

