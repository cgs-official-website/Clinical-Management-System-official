import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Layers,
  Plus,
  CheckCircle2,
  Calendar,
  Clock,
  Award,
  AlertCircle,
  FileCheck,
  Search,
  Activity,
  Heart,
  Zap,
  X,
  Printer,
  Download,
  FileText,
  ShieldCheck
} from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { notify } from '../../components/ui/Toast'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { useAuthStore } from '../../store/useAuthStore'

export const ImplantRegistryPage = () => {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)

  const isCardio =
    location.pathname.includes('cardio') ||
    user?.clinicCategory?.name?.toLowerCase().includes('cardio') ||
    user?.clinic_category?.toLowerCase().includes('cardio')

  const initialDentalImplants = [
    {
      id: 'IMP-2026-041',
      site: 'Tooth #19 (Mandibular Left 1st Molar)',
      brand: 'Straumann BLX Roxolid SLActive',
      dimensions: 'Ø 4.5 mm × 10 mm',
      torque: '42 Ncm',
      isq: '78 (High Stability)',
      placedDate: '10 Aug 2026',
      surgeon: 'Dr. Vikram Sethi, MDS (Periodontology & Implantology)',
      stage: 'Osseointegration (Week 6 of 10)',
      status: 'HEALING',
      abutment: 'Custom Zirconia Anatomical Abutment planned',
    },
    {
      id: 'IMP-2026-018',
      site: 'Tooth #30 (Mandibular Right 1st Molar)',
      brand: 'Nobel Biocare NobelParallel CC TiUltra',
      dimensions: 'Ø 5.0 mm × 11.5 mm',
      torque: '38 Ncm',
      isq: '82 (Excellent)',
      placedDate: '14 May 2026',
      surgeon: 'Dr. Vikram Sethi',
      stage: 'Final Restoration Loaded',
      status: 'RESTORED',
      abutment: 'Screw-retained Zirconia Crown torque 35 Ncm',
    },
    {
      id: 'IMP-2026-009',
      site: 'Tooth #8 (Maxillary Right Central Incisor)',
      brand: 'BioHorizons Tapered Internal Plus',
      dimensions: 'Ø 3.8 mm × 12 mm',
      torque: '45 Ncm',
      isq: '76 (Optimal)',
      placedDate: '22 Feb 2026',
      surgeon: 'Dr. Vikram Sethi',
      stage: 'Final Restoration Loaded',
      status: 'RESTORED',
      abutment: 'Custom Titanium Base + E-max Ceramic',
    },
  ]

  const initialCardioImplants = [
    {
      id: 'CARD-IMP-001',
      site: 'LAD (Mid Left Anterior Descending Artery)',
      brand: 'Abbott XIENCE Sierra Everolimus-Eluting Coronary Stent',
      dimensions: 'Ø 3.0 mm × 24 mm',
      torque: '16 atm (Deployment)',
      isq: 'TIMI 3 Flow Post-PCI',
      placedDate: '14 Sep 2026',
      surgeon: 'Dr. Sarah Lin, MD (Interventional Cardiology)',
      stage: 'Endothelialization (Dual Antiplatelet Therapy)',
      status: 'ACTIVE_TELEMETRY',
      abutment: 'DAPT: Ticagrelor 90mg BID + Aspirin 81mg daily for 12 months',
      type: 'Coronary Drug-Eluting Stent',
      serialNumber: 'SN-XIE-98231',
    },
    {
      id: 'CARD-IMP-002',
      site: 'Left Pectoral Pocket (Dual-Chamber Pacing)',
      brand: 'Medtronic Azure XT DR MRI SureScan',
      dimensions: 'Volume: 12.8 cm³ | 22g',
      torque: 'Atrial: 0.8V @ 0.4ms',
      isq: 'Ventricular: 0.6V @ 0.4ms',
      placedDate: '02 Aug 2026',
      surgeon: 'Dr. Michael Chang, MD (Cardiac Electrophysiology)',
      stage: 'Battery Longevity Est. 12.4 Years',
      status: 'ACTIVE_TELEMETRY',
      abutment: 'Leads: Medtronic CapsureFix Novus 5076 (RA & RV bipolar active fixation)',
      type: 'Dual-Chamber Permanent Pacemaker',
      serialNumber: 'SN-AZU-44021',
    },
    {
      id: 'CARD-IMP-003',
      site: 'Left Prepectoral (Biventricular Pacing / Defibrillation)',
      brand: 'Boston Scientific Resonate CRT-D Heart Failure System',
      dimensions: 'Volume: 32.5 cm³ | 71g',
      torque: 'Bi-V Pacing: 99.2%',
      isq: 'Shock Lead: 48 Ω impedance',
      placedDate: '18 Jun 2026',
      surgeon: 'Dr. Michael Chang, MD (Electrophysiology)',
      stage: 'Pacing Optimization & Remote CareLink Enabled',
      status: 'ACTIVE_TELEMETRY',
      abutment: 'LV Coronary Sinus Lead: Acuity X4 Quadripolar',
      type: 'Cardiac Resynchronization Defibrillator (CRT-D)',
      serialNumber: 'SN-RES-77810',
    },
  ]

  const [implantsList, setImplantsList] = useState(isCardio ? initialCardioImplants : initialDentalImplants)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [passportTarget, setPassportTarget] = useState(null)

  // Form State
  const [site, setSite] = useState('')
  const [brand, setBrand] = useState(isCardio ? 'Abbott XIENCE Sierra Stent' : 'Straumann BLX Roxolid SLActive')
  const [dimensions, setDimensions] = useState('Ø 4.5 mm × 10 mm')
  const [torque, setTorque] = useState('42 Ncm')
  const [isq, setIsq] = useState('78 (High Stability)')
  const [placedDate, setPlacedDate] = useState(new Date().toISOString().split('T')[0])
  const [surgeon, setSurgeon] = useState(isCardio ? 'Dr. Sarah Lin, MD' : 'Dr. Vikram Sethi, MDS')
  const [stage, setStage] = useState('Osseointegration (Healing Phase)')
  const [status, setStatus] = useState(isCardio ? 'ACTIVE_TELEMETRY' : 'HEALING')
  const [abutment, setAbutment] = useState('')

  const handleRegisterSubmit = (e) => {
    e.preventDefault()

    const newId = isCardio
      ? `CARD-IMP-${String(implantsList.length + 1).padStart(3, '0')}`
      : `IMP-2026-${String(Math.floor(50 + Math.random() * 50)).padStart(3, '0')}`

    const newRecord = {
      id: newId,
      site: site || (isCardio ? 'LAD Artery' : 'Tooth #19 (Mandibular Molar)'),
      brand: brand || 'Straumann BLX Roxolid',
      dimensions: dimensions || 'Ø 4.5 mm × 10 mm',
      torque: torque || '40 Ncm',
      isq: isq || '78 (Optimal)',
      placedDate: new Date(placedDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
      surgeon: surgeon || 'Dr. Vikram Sethi',
      stage: stage || 'Osseointegration',
      status: status || 'HEALING',
      abutment: abutment || 'Custom Zirconia Anatomical Abutment planned',
    }

    setImplantsList((prev) => [newRecord, ...prev])
    notify.success(
      isCardio
        ? 'Cardiac device registered successfully in traceability log!'
        : 'Fixture placement registered in implant registry!'
    )
    setIsRegisterOpen(false)

    // Reset Form
    setSite('')
    setAbutment('')
  }

  const handlePrintPassport = () => {
    window.print()
  }

  const handleDownloadPassportText = (imp) => {
    if (!imp) return
    let content = `OFFICIAL MEDICAL DEVICE PASSPORT & TRACEABILITY CERTIFICATE\n`
    content += `===========================================================\n`
    content += `Device ID: ${imp.id}\n`
    content += `Anatomical Location: ${imp.site}\n`
    content += `Manufacturer & Model: ${imp.brand}\n`
    content += `Dimensions / Specs: ${imp.dimensions}\n`
    content += `Insertion Torque / Metric: ${imp.torque}\n`
    content += `ISQ Metric: ${imp.isq}\n`
    content += `Implanted Date: ${imp.placedDate}\n`
    content += `Operating Specialist: ${imp.surgeon}\n`
    content += `Current Phase / Status: ${imp.stage} (${imp.status})\n`
    content += `Restorative / Lead Plan: ${imp.abutment}\n`

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Device_Passport_${imp.id}.txt`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    notify.success(`Device passport for ${imp.id} downloaded successfully.`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading font-extrabold text-2xl text-text-primary">
              {isCardio ? 'Cardiac Implant Registry' : 'Dental Implant Registry'}
            </h1>
            <Badge variant="primary" size="sm">
              {isCardio ? 'Pacemakers, Stents & EP Device Traceability' : 'Surgical Log & Traceability'}
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            {isCardio
              ? 'Coronary stents, permanent pacemakers, ICDs, CRT-D serials, lead impedance and battery longevity'
              : 'Fixture lot numbers, insertion torque values (Ncm), ISQ stability metrics & restorative stages'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsRegisterOpen(true)}
          >
            {isCardio ? 'Register Cardiac Device' : 'Register Fixture Placement'}
          </Button>
        </div>
      </div>

      {/* Implant Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {implantsList.map((imp) => (
          <div
            key={imp.id}
            className="p-6 rounded-2xl border border-border bg-surface shadow-soft flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-primary">{imp.id}</span>
                <Badge
                  variant={
                    imp.status === 'RESTORED' || imp.status === 'ACTIVE_TELEMETRY' ? 'success' : 'primary'
                  }
                  size="sm"
                >
                  {imp.status}
                </Badge>
              </div>

              <div>
                <h3 className="font-heading font-bold text-base text-text-primary">{imp.site}</h3>
                <p className="text-xs text-text-secondary mt-0.5 font-medium">{imp.brand}</p>
                {imp.serialNumber && (
                  <span className="text-[11px] font-mono text-primary/80 block mt-0.5">
                    {imp.serialNumber} • {imp.type}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border text-xs">
                <div className="p-2 rounded-lg bg-surface-hover/30 border border-border">
                  <span className="text-[10px] text-text-secondary block">
                    {isCardio ? 'Specs / Dimensions' : 'Dimensions'}
                  </span>
                  <span className="font-bold text-text-primary">{imp.dimensions}</span>
                </div>
                <div className="p-2 rounded-lg bg-surface-hover/30 border border-border">
                  <span className="text-[10px] text-text-secondary block">
                    {isCardio ? 'Pacing / Flow Metric' : 'Torque / ISQ'}
                  </span>
                  <span className="font-bold text-primary">
                    {imp.torque} • {imp.isq.split(' ')[0]}
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-xs text-text-secondary">
                <div className="flex items-center justify-between">
                  <span>Implanted Date:</span>
                  <strong className="text-text-primary">{imp.placedDate}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Current Phase / Status:</span>
                  <strong className="text-text-primary">{imp.stage}</strong>
                </div>
                <div className="pt-2 border-t border-border text-[11px]">
                  <span>{isCardio ? 'Medication / Lead Configuration:' : 'Restorative Plan:'}</span>
                  <p className="text-text-primary font-medium mt-0.5">{imp.abutment}</p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
              <span className="text-text-secondary truncate max-w-[180px]">
                {isCardio ? 'Operator' : 'Surgeon'}: {imp.surgeon.split(',')[0]}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPassportTarget(imp)}
              >
                Device Passport
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Register Fixture / Device Modal */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title={isCardio ? 'Register Cardiac Device Placement' : 'Register Fixture Placement'}
        description={
          isCardio
            ? 'Record new pacemaker, ICD, or coronary stent placement into patient telemetry registry.'
            : 'Log surgical implant fixture lot details, insertion torque (Ncm), and ISQ metrics.'
        }
      >
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <Input
            label={isCardio ? 'Anatomical Site / Vessel' : 'Tooth / Anatomical Site'}
            required
            placeholder={isCardio ? 'e.g. LAD (Mid Left Anterior Descending)' : 'e.g. Tooth #19 (Mandibular Left 1st Molar)'}
            value={site}
            onChange={(e) => setSite(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Fixture Manufacturer & Brand"
              required
              placeholder="e.g. Straumann BLX Roxolid SLActive"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />
            <Input
              label="Dimensions / Specs"
              required
              placeholder="e.g. Ø 4.5 mm × 10 mm"
              value={dimensions}
              onChange={(e) => setDimensions(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Insertion Torque (Ncm)"
              required
              placeholder="e.g. 42 Ncm"
              value={torque}
              onChange={(e) => setTorque(e.target.value)}
            />
            <Input
              label="ISQ Metric / Stability"
              required
              placeholder="e.g. 78 (High Stability)"
              value={isq}
              onChange={(e) => setIsq(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Implanted Date"
              type="date"
              required
              value={placedDate}
              onChange={(e) => setPlacedDate(e.target.value)}
            />
            <Input
              label="Operating Specialist / Surgeon"
              required
              placeholder="e.g. Dr. Vikram Sethi, MDS"
              value={surgeon}
              onChange={(e) => setSurgeon(e.target.value)}
            />
          </div>

          <Input
            label="Current Stage / Healing Progress"
            placeholder="e.g. Osseointegration (Week 1 of 10)"
            value={stage}
            onChange={(e) => setStage(e.target.value)}
          />

          <Input
            label={isCardio ? 'Medication / Lead Configuration' : 'Restorative Plan / Abutment Notes'}
            placeholder="e.g. Custom Zirconia Anatomical Abutment planned"
            value={abutment}
            onChange={(e) => setAbutment(e.target.value)}
          />

          <Select
            label="Placement Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: 'HEALING', label: 'HEALING (In Osseointegration)' },
              { value: 'RESTORED', label: 'RESTORED (Final Crown Loaded)' },
              { value: 'ACTIVE_TELEMETRY', label: 'ACTIVE TELEMETRY (Monitored)' },
            ]}
          />

          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-border">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setIsRegisterOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Register Fixture
            </Button>
          </div>
        </form>
      </Modal>

      {/* Device Passport Modal */}
      {passportTarget && (
        <Modal
          isOpen={!!passportTarget}
          onClose={() => setPassportTarget(null)}
          title="Device Traceability & Verification Passport"
          description={`Official Manufacturer & Surgical Log Certificate for ${passportTarget.id}`}
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl border border-border bg-bg/60 space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <div>
                    <h4 className="font-heading font-bold text-sm text-text-primary">
                      {passportTarget.brand}
                    </h4>
                    <span className="font-mono text-xs text-primary font-bold">{passportTarget.id}</span>
                  </div>
                </div>
                <Badge variant="success" size="sm">
                  Verified Authentic
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-surface border border-border space-y-1">
                  <span className="text-[10px] text-text-secondary uppercase block font-semibold">Anatomical Site</span>
                  <span className="font-bold text-text-primary">{passportTarget.site}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-surface border border-border space-y-1">
                  <span className="text-[10px] text-text-secondary uppercase block font-semibold">Implanted Date</span>
                  <span className="font-bold text-text-primary">{passportTarget.placedDate}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-surface border border-border space-y-1">
                  <span className="text-[10px] text-text-secondary uppercase block font-semibold">Dimensions</span>
                  <span className="font-bold text-text-primary">{passportTarget.dimensions}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-surface border border-border space-y-1">
                  <span className="text-[10px] text-text-secondary uppercase block font-semibold">Torque & ISQ Metric</span>
                  <span className="font-bold text-primary">{passportTarget.torque} • {passportTarget.isq}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-surface border border-border text-xs space-y-1">
                <span className="text-[10px] text-text-secondary uppercase block font-semibold">Surgeon / Specialist</span>
                <span className="font-medium text-text-primary">{passportTarget.surgeon}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-surface border border-border text-xs space-y-1">
                <span className="text-[10px] text-text-secondary uppercase block font-semibold">Restorative / Clinical Plan</span>
                <p className="text-text-primary font-medium">{passportTarget.abutment}</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadPassportText(passportTarget)}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Export Passport (.TXT)
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPassportTarget(null)}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handlePrintPassport}
                  leftIcon={<Printer className="w-3.5 h-3.5" />}
                >
                  Print Passport
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default ImplantRegistryPage

