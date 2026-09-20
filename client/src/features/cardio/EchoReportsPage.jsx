import React, { useState } from 'react'
import {
  FileText,
  Plus,
  CheckCircle2,
  Clock,
  Heart,
  Activity,
  Layers,
  Download,
  Search,
  Sliders,
  ChevronRight,
} from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { notify } from '../../components/ui/Toast'

export const EchoReportsPage = () => {
  const [selectedReport, setSelectedReport] = useState('echo-101')

  const echoReports = [
    {
      id: 'echo-101',
      reportNumber: 'ECHO-2026-0312',
      patientName: 'Jonathan M. Pierce',
      patientId: 'MRN-CARD-1044',
      modality: 'Transthoracic Echocardiogram (TTE)',
      studyDate: '2026-09-18',
      sonographer: 'Rebecca Hayes, RDCS',
      cardiologist: 'Dr. Sarah Lin, MD, FACC',
      status: 'FINALIZED',
      indication: 'Evaluation of dyspnea on exertion & murmur',
      efPercent: 55,
      efStatus: 'Preserved (Normal 50-70%)',
      dimensions: {
        lvedd: '4.8 cm',
        lvesd: '3.1 cm',
        ivsd: '1.1 cm',
        pwd: '1.0 cm',
        laVolumeIndex: '31 mL/m²',
      },
      valves: [
        { valve: 'Aortic Valve', finding: 'Trileaflet, mild fibrocalcific thickening, no significant stenosis (Peak Velocity 1.4 m/s, Mean Gradient 6 mmHg)' },
        { valve: 'Mitral Valve', finding: 'Trace to mild central regurgitation, anterior leaflet normal mobility' },
        { valve: 'Tricuspid Valve', finding: 'Physiologic TR, estimated RV systolic pressure (RVSP) 28 mmHg (Normal)' },
        { valve: 'Pulmonic Valve', finding: 'Normal structure and forward Doppler flow' },
      ],
      wallMotion: 'No focal regional wall motion abnormalities detected. Global LV systolic function is normal.',
      conclusions: [
        'Normal left ventricular size with preserved systolic function (Biplane LVEF ~55%).',
        'Normal LV diastolic filling parameters (E/A 1.1, average E/e\' 7.8).',
        'Mild aortic valve sclerosis without hemodynamic obstruction.',
        'Normal estimated pulmonary artery systolic pressures.',
      ],
    },
    {
      id: 'echo-102',
      reportNumber: 'ECHO-2026-0310',
      patientName: 'Miriam Al-Hassan',
      patientId: 'MRN-CARD-1051',
      modality: 'Transesophageal Echocardiogram (TEE)',
      studyDate: '2026-09-16',
      sonographer: 'Marcus Wright, RDCS',
      cardiologist: 'Dr. Michael Chang, MD',
      status: 'FINALIZED',
      indication: 'Rule out left atrial appendage (LAA) thrombus pre-cardioversion',
      efPercent: 42,
      efStatus: 'Mildly Reduced',
      dimensions: {
        lvedd: '5.4 cm',
        lvesd: '3.9 cm',
        ivsd: '1.2 cm',
        pwd: '1.1 cm',
        laVolumeIndex: '42 mL/m²',
      },
      valves: [
        { valve: 'Mitral Valve', finding: 'Moderate eccentric mitral regurgitation directed posteriorly' },
        { valve: 'Aortic Valve', finding: 'Normal closure line, no vegetations' },
      ],
      wallMotion: 'Mild inferolateral hypokinesis.',
      conclusions: [
        'No thrombus identified in the left atrial appendage (LAA emptying velocity 45 cm/s).',
        'Moderate mitral regurgitation secondary to annular dilation.',
        'Safe to proceed with elective DC cardioversion as planned.',
      ],
    },
  ]

  const active = echoReports.find((r) => r.id === selectedReport) || echoReports[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading font-extrabold text-2xl text-text-primary">
              Echocardiography (Echo) Reports
            </h1>
            <Badge variant="primary" size="sm">
              2D / Doppler Ultrasound Diagnostic Registry
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            TTE and TEE imaging studies, chamber quantifications, ejection fractions (LVEF %) & valvular regurgitation grades
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={() => notify.info('Exporting official DICOM structured echo report...')}
          >
            Export DICOM Report
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => notify.info('New echocardiography worksheet template initialized.')}
          >
            Create Echo Report
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports Navigation */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Echo Archive ({echoReports.length})
          </h2>

          {echoReports.map((report) => (
            <div
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedReport === report.id
                  ? 'border-primary bg-primary/5 shadow-soft'
                  : 'border-border bg-surface hover:border-border-hover'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-primary">{report.reportNumber}</span>
                <Badge variant={report.status === 'FINALIZED' ? 'success' : 'warning'} size="xs">
                  {report.status}
                </Badge>
              </div>

              <h3 className="font-semibold text-sm text-text-primary mt-1.5">{report.patientName}</h3>
              <p className="text-xs text-text-muted">{report.patientId} • {report.modality}</p>

              <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-xs">
                <span className="font-bold text-primary flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 fill-primary/20" /> LVEF: {report.efPercent}%
                </span>
                <span className="text-text-muted">{report.studyDate}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Echo Report Detail */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-border bg-surface shadow-soft space-y-6">
            {/* Report Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <span className="font-mono text-xs font-bold text-primary">{active.reportNumber}</span>
                <h2 className="text-xl font-bold text-text-primary mt-0.5">{active.patientName}</h2>
                <p className="text-xs text-text-muted">{active.patientId} • {active.modality} • {active.studyDate}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] text-text-muted uppercase font-bold">Left Ventricular EF</span>
                  <div className="text-2xl font-black text-primary flex items-center gap-1 justify-end">
                    <Heart className="w-5 h-5 fill-primary text-primary" />
                    {active.efPercent}%
                  </div>
                  <span className="text-[11px] text-text-secondary">{active.efStatus}</span>
                </div>
              </div>
            </div>

            {/* Indication */}
            <div className="text-xs p-3 rounded-xl bg-surface-secondary/40 border border-border">
              <span className="font-semibold text-text-primary">Clinical Indication:</span>{' '}
              <span className="text-text-secondary">{active.indication}</span>
            </div>

            {/* Chamber Measurements & Hemodynamics */}
            <div>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2.5">
                Chamber Quantifications & Geometry
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="p-3 rounded-xl border border-border bg-surface text-center">
                  <span className="text-[10px] text-text-muted uppercase">LVEDD</span>
                  <p className="text-sm font-bold text-text-primary mt-0.5">{active.dimensions.lvedd}</p>
                </div>
                <div className="p-3 rounded-xl border border-border bg-surface text-center">
                  <span className="text-[10px] text-text-muted uppercase">LVESD</span>
                  <p className="text-sm font-bold text-text-primary mt-0.5">{active.dimensions.lvesd}</p>
                </div>
                <div className="p-3 rounded-xl border border-border bg-surface text-center">
                  <span className="text-[10px] text-text-muted uppercase">Septal (IVSd)</span>
                  <p className="text-sm font-bold text-text-primary mt-0.5">{active.dimensions.ivsd}</p>
                </div>
                <div className="p-3 rounded-xl border border-border bg-surface text-center">
                  <span className="text-[10px] text-text-muted uppercase">Post Wall (PWd)</span>
                  <p className="text-sm font-bold text-text-primary mt-0.5">{active.dimensions.pwd}</p>
                </div>
                <div className="p-3 rounded-xl border border-border bg-surface text-center">
                  <span className="text-[10px] text-text-muted uppercase">LAVI Index</span>
                  <p className="text-sm font-bold text-text-primary mt-0.5">{active.dimensions.laVolumeIndex}</p>
                </div>
              </div>
            </div>

            {/* Valvular Assessment */}
            <div>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2.5">
                Valvular Morphology & Color Doppler
              </h3>
              <div className="space-y-2">
                {active.valves.map((v, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-border/80 bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold text-text-primary sm:w-36">{v.valve}</span>
                    <span className="text-xs text-text-secondary flex-1">{v.finding}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Impressions */}
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary" /> Attending Cardiologist Conclusions
              </h3>
              <ul className="space-y-1.5 list-disc list-inside text-xs text-text-secondary leading-relaxed">
                {active.conclusions.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
              <div className="text-[11px] text-text-muted border-t border-primary/10 pt-2 flex items-center justify-between">
                <span>Interpreting Physician: {active.cardiologist}</span>
                <span>Registered Sonographer: {active.sonographer}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EchoReportsPage
