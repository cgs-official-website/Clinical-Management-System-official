import React, { useState } from 'react'
import {
  FileImage,
  Upload,
  ZoomIn,
  Sliders,
  Calendar,
  Eye,
  CheckCircle,
  FileText,
  Scan,
} from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { notify } from '../../components/ui/Toast'

export const XrayRecordsPage = () => {
  const [selectedScan, setSelectedScan] = useState(0)

  const scans = [
    {
      id: 'XR-9021',
      type: 'Digital Panoramic (OPG)',
      date: '15 Sep 2026',
      region: 'Full Maxillofacial Arch',
      radiologist: 'Dr. Neha Sharma, MDS (Oral Radiology)',
      findings: 'Impacted lower 3rd molars (#17, #32) mesioangular. Normal alveolar ridge height. No periapical radiolucency in anterior dentition.',
      status: 'Verified & Signed',
      aspect: 'Panoramic 16:9',
    },
    {
      id: 'XR-8842',
      type: 'Periapical (IOPA) Radiograph',
      date: '12 Sep 2026',
      region: 'Tooth #19 (Mandibular Left 1st Molar)',
      radiologist: 'Dr. Anand Verma, Endodontist',
      findings: 'Deep coronal radiolucency reaching pulp chamber. Periodontal ligament widening visible at distal root apex.',
      status: 'Verified & Signed',
      aspect: 'Periapical 4:5',
    },
    {
      id: 'XR-8711',
      type: 'Bitewing Series (Bite-wing R & L)',
      date: '02 Sep 2026',
      region: 'Posterior Interproximal Contacts',
      radiologist: 'Dr. Anand Verma',
      findings: 'Interproximal enamel caries suspected on mesial surface of #14. Restorations intact on #3 and #30.',
      status: 'Verified',
      aspect: 'Bitewing 3:2',
    },
    {
      id: 'XR-8409',
      type: 'Lateral Cephalometric Scan',
      date: '20 Aug 2026',
      region: 'Craniofacial Lateral Profile',
      radiologist: 'Dr. Neha Sharma',
      findings: 'SNA: 82°, SNB: 79°, ANB: 3°. Class I skeletal base with moderate bimaxillary dental protrusion.',
      status: 'Verified & Traced',
      aspect: 'Ceph 1:1',
    },
  ]

  const current = scans[selectedScan]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading font-extrabold text-2xl text-text-primary">
              Digital Dental X-Ray & Imaging
            </h1>
            <Badge variant="primary" size="sm">
              DICOM & Radiographic Vault
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Digital Panoramic (OPG), Intraoral Periapical (IOPA), Bitewings & 3D CBCT Imaging
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Upload className="w-4 h-4" />}
            onClick={() => notify.info('DICOM acquisition interface ready.')}
          >
            Upload New Radiograph
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Scans List */}
        <div className="p-5 rounded-2xl border border-border bg-surface shadow-soft space-y-3">
          <h3 className="font-heading font-bold text-sm text-text-primary mb-3">
            Radiographic Archive
          </h3>
          {scans.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setSelectedScan(idx)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                selectedScan === idx
                  ? 'border-primary ring-2 ring-primary/20 bg-primary/5 font-semibold text-text-primary shadow-sm'
                  : 'border-border bg-surface text-text-secondary hover:border-primary/40'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-primary">{s.id}</span>
                <span className="text-[10px] text-text-secondary flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {s.date}
                </span>
              </div>
              <h4 className="text-xs font-bold text-text-primary truncate">{s.type}</h4>
              <p className="text-[11px] text-text-secondary mt-0.5 truncate">{s.region}</p>
            </button>
          ))}
        </div>

        {/* Radiograph Viewer & Diagnosis */}
        <div className="xl:col-span-2 p-6 rounded-2xl border border-border bg-surface shadow-soft space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-base text-text-primary">
                  {current.type}
                </h3>
                <span className="font-mono text-xs font-bold text-primary">[{current.id}]</span>
              </div>
              <p className="text-xs text-text-secondary">
                Acquired on {current.date} • {current.region}
              </p>
            </div>
            <Badge variant="success" size="sm">
              {current.status}
            </Badge>
          </div>

          {/* High-Contrast Radiographic Image Simulation */}
          <div className="relative w-full h-80 rounded-2xl bg-neutral-950 border border-neutral-800 overflow-hidden flex flex-col items-center justify-center p-6 text-neutral-300">
            {/* Grid line background overlay */}
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#26A689_1px,transparent_1px)] [background-size:16px_16px]"></div>

            {/* Simulated X-Ray Skeleton / Teeth visualization */}
            <div className="relative z-10 flex flex-col items-center justify-center space-y-3">
              <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Scan className="w-10 h-10 animate-pulse" />
              </div>
              <div className="text-center">
                <span className="font-mono text-xs font-bold text-white uppercase tracking-widest block">
                  DIGITAL RADIOGRAPH FEED • {current.id}
                </span>
                <span className="text-[11px] text-neutral-400 mt-1 block">
                  Contrast: High (0.85 gamma) • Resolution: 300 DPI Medical DICOM
                </span>
              </div>
            </div>

            {/* Viewer Controls Bar */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between p-2 rounded-xl bg-neutral-900/80 backdrop-blur-md border border-neutral-800 text-xs text-neutral-300">
              <span className="font-mono text-[10px] text-neutral-400">Zoom: 100% • Filter: Bone Dense</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => notify.info('Zoom mode toggled')}
                  className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-[11px] flex items-center gap-1"
                >
                  <ZoomIn className="w-3 h-3" /> Zoom
                </button>
                <button
                  onClick={() => notify.info('Contrast calibrated')}
                  className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-[11px] flex items-center gap-1"
                >
                  <Sliders className="w-3 h-3" /> Enhance
                </button>
              </div>
            </div>
          </div>

          {/* Diagnostic Findings */}
          <div className="p-4 rounded-xl bg-surface-hover/30 border border-border space-y-2">
            <span className="text-xs font-semibold text-text-secondary block">
              Radiologist / Clinician Evaluation:
            </span>
            <p className="text-xs text-text-primary leading-relaxed">
              {current.findings}
            </p>
            <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-text-secondary">
              <span>Interpreting Clinician: <strong className="text-text-primary">{current.radiologist}</strong></span>
              <span className="flex items-center gap-1 text-emerald-500 font-semibold"><CheckCircle className="w-3 h-3" /> Electronically Signed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default XrayRecordsPage
