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
} from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { notify } from '../../components/ui/Toast'
import { useAuthStore } from '../../store/useAuthStore'

export const ImplantRegistryPage = () => {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)

  const isCardio =
    location.pathname.includes('cardio') ||
    user?.clinicCategory?.name?.toLowerCase().includes('cardio') ||
    user?.clinic_category?.toLowerCase().includes('cardio')

  const dentalImplants = [
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

  const cardioImplants = [
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

  const implants = isCardio ? cardioImplants : dentalImplants

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
            onClick={() =>
              notify.info(
                isCardio
                  ? 'Cardiac device registration wizard initialized.'
                  : 'Surgical fixture placement wizard launched.'
              )
            }
          >
            {isCardio ? 'Register Cardiac Device' : 'Register Fixture Placement'}
          </Button>
        </div>
      </div>

      {/* Implant Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {implants.map((imp) => (
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
                onClick={() =>
                  notify.success(
                    isCardio
                      ? `Device passport & manufacturer card exported for ${imp.brand}.`
                      : `Fixture verification passport exported for ${imp.site}.`
                  )
                }
              >
                Device Passport
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ImplantRegistryPage
