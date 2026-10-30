import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Activity, Calculator, ShieldAlert, Search, Trash2, Printer } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { Modal } from '../../components/ui/Modal'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { useAuthStore } from '../../store/useAuthStore'
import { api } from '../../lib/api'
import { PatientPicker } from './components/PatientPicker'
import { Checkbox } from './components/Field'
import {
  cardioHttp,
  errorMessage,
  fmtDate,
  num,
  useCardioAccess,
  useCardioList,
  useCardioMutation,
} from './cardioApi'

const RESOURCE = 'risk-assessments'

// Pooled Cohort Equations validity ranges (same limits the server enforces)
const LIMITS = { age: [40, 79], totalCholesterol: [130, 320], hdl: [20, 100], sbp: [90, 200] }
const inRange = (v, [min, max]) => Number.isFinite(v) && v >= min && v <= max

const CATEGORY_VARIANT = { HIGH: 'danger', INTERMEDIATE: 'warning', BORDERLINE: 'warning', LOW: 'success' }
const TABS = ['ALL', 'HIGH', 'INTERMEDIATE', 'BORDERLINE', 'LOW']

const ageFromDob = (dob) => {
  if (!dob) return ''
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--
  return age
}

const emptyForm = (physician) => ({
  patientId: '',
  age: '',
  sex: 'Male',
  race: 'OTHER',
  sbp: '',
  totalCholesterol: '',
  hdl: '',
  ldl: '',
  cacScore: '',
  diabetes: false,
  smoker: false,
  onBpTreatment: false,
  onStatin: false,
  onAspirin: false,
  physician: physician || '',
  recommendation: '',
})

const escapeHtml = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

const printPlan = (item) => {
  const w = window.open('', '_blank', 'width=800,height=900')
  if (!w) return
  const yn = (b) => (b ? 'Yes' : 'No')
  w.document.write(`<!doctype html><html><head><title>ASCVD plan - ${escapeHtml(item.patientName)}</title>
<style>body{font-family:Arial,sans-serif;padding:32px;color:#111}h1{font-size:20px}table{border-collapse:collapse;width:100%;margin:16px 0}
td,th{border:1px solid #ccc;padding:6px 10px;font-size:13px;text-align:left}.big{font-size:28px;font-weight:bold}p{font-size:13px;line-height:1.5}</style></head><body>
<h1>10-Year ASCVD Risk Assessment</h1>
<p><strong>${escapeHtml(item.patientName)}</strong> (${escapeHtml(item.patientMrn)}) &middot; ${escapeHtml(item.age)}y ${escapeHtml(item.sex)} &middot; Assessed ${escapeHtml(fmtDate(item.assessedAt))}</p>
<p class="big">${escapeHtml(item.scorePercent)}% &mdash; ${escapeHtml(item.riskCategory)} risk</p>
<table><tr><th>SBP</th><th>Total chol.</th><th>HDL</th><th>LDL</th><th>CAC</th></tr>
<tr><td>${escapeHtml(item.sbp)} mmHg</td><td>${escapeHtml(item.totalCholesterol)} mg/dL</td><td>${escapeHtml(item.hdl)} mg/dL</td><td>${escapeHtml(item.ldl ?? '-')} mg/dL</td><td>${escapeHtml(item.cacScore ?? '-')}</td></tr></table>
<p>Diabetes: ${yn(item.diabetes)} &middot; Smoker: ${yn(item.smoker)} &middot; On BP treatment: ${yn(item.onBpTreatment)} &middot; On statin: ${yn(item.onStatin)} &middot; On aspirin: ${yn(item.onAspirin)}</p>
<h3>Prevention plan</h3><p>${escapeHtml(item.recommendation)}</p>
<p>Cardiologist: ${escapeHtml(item.physician || 'Not recorded')}</p>
<p style="color:#666;font-size:11px">Estimated with the ACC/AHA Pooled Cohort Equations. Decision support only; clinical judgement applies.</p>
</body></html>`)
  w.document.close()
  w.focus()
  w.print()
}

export const CardiacRiskAssessmentPage = () => {
  const { user } = useAuthStore()
  const { canCreate, canDelete } = useCardioAccess('cardiac_risk_assessment')
  const [category, setCategory] = useState('ALL')
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [formError, setFormError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data, isLoading, isError, error } = useCardioList(RESOURCE, {
    category: category === 'ALL' ? undefined : category,
    search: search || undefined,
    limit: 100,
  })
  const items = data?.data || []

  const saveMutation = useCardioMutation(RESOURCE, (payload) => cardioHttp.post(RESOURCE, payload), {
    success: 'Risk assessment saved.',
    onSuccess: () => setIsOpen(false),
  })
  const deleteMutation = useCardioMutation(RESOURCE, (id) => cardioHttp.del(`${RESOURCE}/${id}`), {
    success: 'Risk assessment deleted.',
    onSuccess: () => setDeleteTarget(null),
  })

  // Live score preview comes from the server so the number shown equals the number saved.
  const inputs = useMemo(
    () => ({
      age: num(form.age),
      sex: form.sex,
      race: form.race,
      sbp: num(form.sbp),
      totalCholesterol: num(form.totalCholesterol),
      hdl: num(form.hdl),
      diabetes: form.diabetes,
      smoker: form.smoker,
      onBpTreatment: form.onBpTreatment,
      onStatin: form.onStatin,
      cacScore: num(form.cacScore),
    }),
    [form]
  )
  const inputsValid =
    inRange(inputs.age, LIMITS.age) &&
    inRange(inputs.sbp, LIMITS.sbp) &&
    inRange(inputs.totalCholesterol, LIMITS.totalCholesterol) &&
    inRange(inputs.hdl, LIMITS.hdl)

  const preview = useQuery({
    queryKey: ['cardio', 'risk-preview', inputs],
    queryFn: async () => (await api.post(`/api/staff/cardio/${RESOURCE}/calculate`, inputs)).data?.data,
    enabled: isOpen && inputsValid,
    staleTime: 60 * 1000,
    retry: false,
  })

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const setFlag = (key) => (checked) => setForm((f) => ({ ...f, [key]: checked }))

  const openCalc = () => {
    setForm(emptyForm(user?.fullName || user?.name))
    setFormError('')
    setIsOpen(true)
  }

  const onPatientChange = (id, patient) =>
    setForm((f) => ({
      ...f,
      patientId: id,
      age: patient ? ageFromDob(patient.dob) || f.age : f.age,
      sex: patient?.gender && /^f/i.test(patient.gender) ? 'Female' : patient?.gender && /^m/i.test(patient.gender) ? 'Male' : f.sex,
    }))

  const submit = (e) => {
    e.preventDefault()
    if (!form.patientId) return setFormError('Please select a patient.')
    if (!inputsValid) {
      return setFormError(
        'Enter age 40-79, systolic BP 90-200, total cholesterol 130-320 and HDL 20-100 (the range this calculator is validated for).'
      )
    }
    setFormError('')
    saveMutation.mutate({
      ...inputs,
      patientId: form.patientId,
      ldl: num(form.ldl),
      onAspirin: form.onAspirin,
      physician: form.physician.trim() || undefined,
      recommendation: form.recommendation.trim() || undefined,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading font-extrabold text-2xl text-text-primary">Cardiac Risk Assessment</h1>
            <Badge variant="primary" size="sm">ACC / AHA 10-Year ASCVD Risk Calculator</Badge>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            10-year atherosclerotic cardiovascular disease risk, calculated with the Pooled Cohort Equations
          </p>
        </div>
        {canCreate && (
          <Button variant="primary" size="sm" leftIcon={<Calculator className="w-4 h-4" />} onClick={openCalc}>
            Calculate Patient Risk
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setCategory(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${category === tab ? 'bg-primary text-white shadow-soft' : 'text-text-secondary hover:bg-surface-secondary'
                }`}
            >
              {tab === 'ALL' ? 'All Risk Strata' : `${tab} Risk`}
            </button>
          ))}
        </div>
        <div className="w-full sm:w-64">
          <Input
            placeholder="Search patient name or MRN"
            leftIcon={<Search className="w-4 h-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      )}
      {isError && <EmptyState title="Could not load assessments" description={errorMessage(error)} />}
      {!isLoading && !isError && items.length === 0 && (
        <EmptyState
          icon={ShieldAlert}
          title="No risk assessments"
          description={
            category !== 'ALL' || search
              ? 'No assessments match the current filters.'
              : 'Run the first 10-year ASCVD risk calculation for a registered patient.'
          }
          actionLabel={canCreate && category === 'ALL' && !search ? 'Calculate Patient Risk' : undefined}
          onAction={openCalc}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-6 rounded-2xl border border-border bg-surface shadow-soft flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-primary">{item.patientMrn}</span>
                <Badge variant={CATEGORY_VARIANT[item.riskCategory] || 'neutral'} size="sm">
                  {item.riskCategory} RISK ({item.scorePercent}%)
                </Badge>
              </div>

              <div>
                <h3 className="font-bold text-base text-text-primary">{item.patientName}</h3>
                <p className="text-xs text-text-muted">
                  {item.age}y {item.sex} • Assessed: {fmtDate(item.assessedAt)}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-surface-secondary/50 border border-border/60">
                  <span className="text-[10px] text-text-muted uppercase">SBP</span>
                  <p className="font-bold text-text-primary">{item.sbp} mmHg</p>
                </div>
                <div className="p-2 rounded-lg bg-surface-secondary/50 border border-border/60">
                  <span className="text-[10px] text-text-muted uppercase">LDL-C</span>
                  <p className="font-bold text-text-primary">{item.ldl != null ? `${item.ldl} mg/dL` : '-'}</p>
                </div>
                <div className="p-2 rounded-lg bg-surface-secondary/50 border border-border/60">
                  <span className="text-[10px] text-text-muted uppercase">HDL-C</span>
                  <p className="font-bold text-text-primary">{item.hdl} mg/dL</p>
                </div>
              </div>

              {item.cacScore != null && (
                <div className="p-2.5 rounded-lg bg-surface-secondary/30 border border-border text-xs flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-medium text-text-primary">CAC score: {item.cacScore}</span>
                </div>
              )}

              <div className="flex flex-wrap gap-1.5">
                {item.diabetes && <Badge variant="warning" size="sm">Diabetes</Badge>}
                {item.smoker && <Badge variant="danger" size="sm">Smoker</Badge>}
                {item.onBpTreatment && <Badge variant="neutral" size="sm">BP treatment</Badge>}
                {item.onStatin && <Badge variant="neutral" size="sm">On statin</Badge>}
                {item.onAspirin && <Badge variant="neutral" size="sm">On aspirin</Badge>}
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-text-muted uppercase">Prevention Regimen</span>
                <p className="text-xs text-text-secondary leading-relaxed bg-primary/5 p-3 rounded-xl border border-primary/10">
                  {item.recommendation}
                </p>
              </div>
            </div>

            <div className="border-t border-border/60 pt-3 flex items-center justify-between gap-2 text-xs text-text-muted">
              <span className="truncate">Cardiologist: {item.physician || 'Not recorded'}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button size="xs" variant="outline" leftIcon={<Printer className="w-3.5 h-3.5" />} onClick={() => printPlan(item)}>
                  Print Plan
                </Button>
                {canDelete && (
                  <Button
                    size="xs"
                    variant="ghost"
                    aria-label="Delete assessment"
                    leftIcon={<Trash2 className="w-3.5 h-3.5 text-danger" />}
                    onClick={() => setDeleteTarget(item)}
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Calculator modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="10-Year ASCVD Risk Calculator"
        description="Valid for ages 40-79 without existing cardiovascular disease"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={submit} className="space-y-4">
          <PatientPicker value={form.patientId} onChange={onPatientChange} />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Input label="Age" type="number" required min="40" max="79" value={form.age} onChange={setField('age')} />
            <Select label="Sex" value={form.sex} onChange={setField('sex')}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </Select>
            <div className="col-span-2">
              <Select label="Race (for equation)" value={form.race} onChange={setField('race')}>
                <option value="OTHER">White / Other</option>
                <option value="AFRICAN_AMERICAN">African American</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Input label="Systolic BP (mmHg)" type="number" required min="90" max="200" value={form.sbp} onChange={setField('sbp')} />
            <Input label="Total chol. (mg/dL)" type="number" required min="130" max="320" value={form.totalCholesterol} onChange={setField('totalCholesterol')} />
            <Input label="HDL (mg/dL)" type="number" required min="20" max="100" value={form.hdl} onChange={setField('hdl')} />
            <Input label="LDL (mg/dL)" type="number" min="20" max="400" value={form.ldl} onChange={setField('ldl')} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-xl border border-border bg-surface-secondary/30">
            <Checkbox label="Diabetes" checked={form.diabetes} onChange={setFlag('diabetes')} />
            <Checkbox label="Current smoker" checked={form.smoker} onChange={setFlag('smoker')} />
            <Checkbox label="On BP treatment" checked={form.onBpTreatment} onChange={setFlag('onBpTreatment')} />
            <Checkbox label="On statin" checked={form.onStatin} onChange={setFlag('onStatin')} />
            <Checkbox label="On aspirin" checked={form.onAspirin} onChange={setFlag('onAspirin')} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="CAC score (optional)" type="number" min="0" value={form.cacScore} onChange={setField('cacScore')} />
            <Input label="Cardiologist" value={form.physician} onChange={setField('physician')} />
          </div>

          {/* Live result */}
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
            {!inputsValid && (() => {
              const issues = []
              const check = (label, value, limits, unit = '') => {
                if (value === '' || value === undefined || value === null) return
                if (!inRange(Number(value), limits)) {
                  issues.push(`${label} must be ${limits[0]}-${limits[1]}${unit}`)
                }
              }
              check('Age', form.age, LIMITS.age, ' years')
              check('Systolic BP', form.sbp, LIMITS.sbp, ' mmHg')
              check('Total cholesterol', form.totalCholesterol, LIMITS.totalCholesterol, ' mg/dL')
              check('HDL', form.hdl, LIMITS.hdl, ' mg/dL')
              return (
                <p className="text-xs text-text-secondary">
                  {issues.length > 0
                    ? `Cannot calculate: ${issues.join('; ')}. This calculator is valid only for ages 40-79.`
                    : 'Fill age (40-79), systolic BP, total cholesterol and HDL to see the 10-year risk.'}
                </p>
              )
            })()}
            {inputsValid && preview.isFetching && <p className="text-xs text-text-secondary">Calculating...</p>}
            {inputsValid && preview.isError && (
              <p className="text-xs text-danger">{errorMessage(preview.error)}</p>
            )}
            {inputsValid && preview.data && !preview.isFetching && (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-black text-text-primary">{preview.data.scorePercent}%</span>
                  <Badge variant={CATEGORY_VARIANT[preview.data.riskCategory]} size="md">
                    {preview.data.riskCategory} RISK
                  </Badge>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">{preview.data.recommendation}</p>
              </>
            )}
          </div>

          <Textarea
            label="Your plan (optional)"
            rows={3}
            placeholder="Leave empty to save the suggested plan above"
            value={form.recommendation}
            onChange={setField('recommendation')}
          />

          {formError && <p className="text-xs text-danger font-medium">{formError}</p>}

          <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
            <Button variant="secondary" size="sm" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={saveMutation.isPending} disabled={!inputsValid}>
              Save Assessment
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        isLoading={deleteMutation.isPending}
        title="Delete risk assessment"
        message={`Delete the assessment for ${deleteTarget?.patientName}? This cannot be undone.`}
      />
    </div>
  )
}

export default CardiacRiskAssessmentPage