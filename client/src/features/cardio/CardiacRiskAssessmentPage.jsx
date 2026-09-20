import React, { useState } from 'react'
import {
  ShieldAlert,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Heart,
  Activity,
  Calculator,
  Percent,
  Sliders,
  Award,
  Sparkles,
  Download,
} from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { notify } from '../../components/ui/Toast'

export const CardiacRiskAssessmentPage = () => {
  const [activeTab, setActiveTab] = useState('ALL')

  const assessments = [
    {
      id: 'ascvd-01',
      patientName: 'Robert Langdon',
      patientId: 'MRN-CARD-1011',
      age: 56,
      gender: 'Male',
      date: '2026-09-19',
      scorePercent: 14.8,
      riskCategory: 'INTERMEDIATE', // <5% Low, 5-7.4% Borderline, 7.5-19.9% Intermediate, >=20% High
      sbp: 138,
      totalCholesterol: 215,
      hdl: 44,
      ldl: 142,
      diabetes: false,
      smoker: false,
      onStatin: false,
      onAspirin: false,
      cacScore: 'CAC = 85 (Mild Coronary Plaque)',
      recommendation: 'Initiate moderate-intensity statin therapy (Atorvastatin 20mg daily). Target LDL-C reduction >= 30-49%. Lifestyle counseling.',
      physician: 'Dr. Sarah Lin, MD',
    },
    {
      id: 'ascvd-02',
      patientName: 'Catherine Sterling',
      patientId: 'MRN-CARD-1019',
      age: 67,
      gender: 'Female',
      date: '2026-09-17',
      scorePercent: 22.4,
      riskCategory: 'HIGH',
      sbp: 152,
      totalCholesterol: 248,
      hdl: 38,
      ldl: 168,
      diabetes: true,
      smoker: true,
      onStatin: true,
      onAspirin: true,
      cacScore: 'CAC = 420 (Extensive Calcified Plaque)',
      recommendation: 'High-intensity statin (Rosuvastatin 40mg) + Ezetimibe 10mg. Strict BP goal <130/80 mmHg. Smoking cessation program enrollment.',
      physician: 'Dr. Michael Chang, MD',
    },
    {
      id: 'ascvd-03',
      patientName: 'Julian Vance',
      patientId: 'MRN-CARD-1025',
      age: 44,
      gender: 'Male',
      date: '2026-09-15',
      scorePercent: 3.2,
      riskCategory: 'LOW',
      sbp: 118,
      totalCholesterol: 175,
      hdl: 58,
      ldl: 96,
      diabetes: false,
      smoker: false,
      onStatin: false,
      onAspirin: false,
      cacScore: 'CAC = 0',
      recommendation: 'Maintain cardioprotective Mediterranean diet, 150 min/wk aerobic physical activity. Re-evaluate in 3-5 years.',
      physician: 'Dr. Sarah Lin, MD',
    },
  ]

  const filtered = activeTab === 'ALL'
    ? assessments
    : assessments.filter((a) => a.riskCategory === activeTab)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading font-extrabold text-2xl text-text-primary">
              Cardiac Risk Assessment
            </h1>
            <Badge variant="primary" size="sm">
              ACC / AHA 10-Year ASCVD Risk Calculator
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            10-Year Atherosclerotic Cardiovascular Disease (ASCVD) risk estimation, coronary calcium scoring & preventive pharmacotherapy
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Calculator className="w-4 h-4" />}
            onClick={() => notify.info('Interactive ASCVD Calculator modal launched.')}
          >
            Calculate Patient Risk
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        {['ALL', 'HIGH', 'INTERMEDIATE', 'LOW'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab
                ? 'bg-primary text-white shadow-soft'
                : 'text-text-secondary hover:bg-surface-secondary'
            }`}
          >
            {tab === 'ALL' ? 'All Risk Strata' : `${tab} Risk`}
          </button>
        ))}
      </div>

      {/* Assessment Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="p-6 rounded-2xl border border-border bg-surface shadow-soft flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-primary">{item.patientId}</span>
                <Badge
                  variant={
                    item.riskCategory === 'HIGH'
                      ? 'danger'
                      : item.riskCategory === 'INTERMEDIATE'
                      ? 'warning'
                      : 'success'
                  }
                  size="sm"
                >
                  {item.riskCategory} RISK ({item.scorePercent}%)
                </Badge>
              </div>

              <div>
                <h3 className="font-bold text-base text-text-primary">{item.patientName}</h3>
                <p className="text-xs text-text-muted">
                  {item.age}y {item.gender} • Assessed: {item.date}
                </p>
              </div>

              {/* Lipid & BP Metrics Pill Grid */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-surface-secondary/50 border border-border/60">
                  <span className="text-[10px] text-text-muted uppercase">SBP</span>
                  <p className="font-bold text-text-primary">{item.sbp} mmHg</p>
                </div>
                <div className="p-2 rounded-lg bg-surface-secondary/50 border border-border/60">
                  <span className="text-[10px] text-text-muted uppercase">LDL-C</span>
                  <p className="font-bold text-text-primary">{item.ldl} mg/dL</p>
                </div>
                <div className="p-2 rounded-lg bg-surface-secondary/50 border border-border/60">
                  <span className="text-[10px] text-text-muted uppercase">HDL-C</span>
                  <p className="font-bold text-text-primary">{item.hdl} mg/dL</p>
                </div>
              </div>

              {/* CAC Score Badge */}
              <div className="p-2.5 rounded-lg bg-surface-secondary/30 border border-border text-xs flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary shrink-0" />
                <span className="font-medium text-text-primary">{item.cacScore}</span>
              </div>

              {/* Evidence-Based Guidance */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-text-muted uppercase">Prevention Regimen</span>
                <p className="text-xs text-text-secondary leading-relaxed bg-primary/5 p-3 rounded-xl border border-primary/10">
                  {item.recommendation}
                </p>
              </div>
            </div>

            <div className="border-t border-border/60 pt-3 flex items-center justify-between text-xs text-text-muted">
              <span>Cardiologist: {item.physician}</span>
              <Button
                size="xs"
                variant="outline"
                onClick={() => notify.info(`ASCVD report printed for ${item.patientName}`)}
              >
                Print Plan
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CardiacRiskAssessmentPage
