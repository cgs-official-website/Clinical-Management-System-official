import React, { useEffect, useState } from 'react'
import { FileImage, Plus, Trash2, CheckCircle2 } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { notify } from '../../components/ui/Toast'
import { PatientPicker } from './components/PatientPicker'
import { usePatientParam, useXrays, useCreateXray, useUpdateXray, useDeleteXray } from './dentalApi'

const SCAN_TYPES = [
  'Digital Panoramic (OPG)',
  'Periapical (IOPA)',
  'Bitewing',
  'CBCT',
  'Cephalometric',
  'Occlusal',
]
const today = () => new Date().toISOString().slice(0, 10)
const EMPTY = { patientId: '', scanType: SCAN_TYPES[0], region: '', toothNo: '', takenAt: today(), radiologist: '', findings: '' }
const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

export const XrayRecordsPage = () => {
  const [patientId, setPatientId] = usePatientParam()
  const [selectedId, setSelectedId] = useState('')
  const [findings, setFindings] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)

  const { data: scans = [], isLoading } = useXrays(patientId)
  const createXray = useCreateXray()
  const updateXray = useUpdateXray()
  const deleteXray = useDeleteXray()

  const scan = scans.find((s) => s.id === selectedId) || scans[0]

  useEffect(() => {
    setFindings(scan?.findings || '')
  }, [scan?.id, scan?.findings])

  const openModal = () => {
    setForm({ ...EMPTY, patientId })
    setModal(true)
  }

  const submit = () => {
    if (!form.patientId) return notify.error('Select a patient.')
    createXray.mutate(
      {
        patientId: form.patientId,
        scanType: form.scanType,
        region: form.region,
        toothNo: form.toothNo,
        takenAt: form.takenAt ? new Date(form.takenAt).toISOString() : undefined,
        radiologist: form.radiologist,
        findings: form.findings,
      },
      { onSuccess: (created) => { setModal(false); if (created?.id) setSelectedId(created.id) } }
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading font-extrabold text-2xl text-text-primary">Dental X-Ray Records</h1>
            <Badge variant="primary" size="sm">Dental Care ERP</Badge>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">Radiograph log with clinical findings and verification</p>
        </div>
        <div className="flex items-end gap-2.5">
          <PatientPicker value={patientId} onChange={setPatientId} allowAll className="w-64" />
          <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={openModal}>Add X-Ray</Button>
        </div>
      </div>

      {isLoading ? (
        <SkeletonTable rows={5} cols={4} />
      ) : !scans.length ? (
        <EmptyState icon={FileImage} title="No X-ray records" description="Add the first radiograph record for this patient." actionLabel="Add X-Ray" onAction={openModal} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            {scans.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${scan?.id === s.id ? 'border-primary bg-primary/5 ring-2 ring-primary/10' : 'border-border bg-surface hover:border-primary/40'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-primary">{s.scanType}</span>
                  <Badge variant={s.status === 'VERIFIED' ? 'success' : 'warning'} size="sm">{s.status}</Badge>
                </div>
                <p className="text-[11px] text-text-secondary mt-1">{s.patient?.fullName} · {fmt(s.takenAt)}</p>
                {(s.region || s.toothNo) && (
                  <p className="text-[11px] text-text-secondary">{[s.toothNo && `Tooth #${s.toothNo}`, s.region].filter(Boolean).join(' · ')}</p>
                )}
              </button>
            ))}
          </div>

          {scan && (
            <div className="lg:col-span-2 p-6 rounded-2xl border border-border bg-surface shadow-soft space-y-5">
              <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
                <div>
                  <h3 className="font-heading font-bold text-base text-text-primary">{scan.scanType}</h3>
                  <p className="text-xs text-text-secondary">
                    {scan.patient?.fullName} ({scan.patient?.mrn}) · {fmt(scan.takenAt)}
                  </p>
                </div>
                <Badge variant={scan.status === 'VERIFIED' ? 'success' : 'warning'}>{scan.status}</Badge>
              </div>

              <dl className="grid grid-cols-2 gap-4 text-xs">
                <div><dt className="text-text-secondary">Region</dt><dd className="font-semibold text-text-primary">{scan.region || '—'}</dd></div>
                <div><dt className="text-text-secondary">Tooth</dt><dd className="font-semibold text-text-primary">{scan.toothNo ? `#${scan.toothNo}` : '—'}</dd></div>
                <div className="col-span-2"><dt className="text-text-secondary">Radiologist / Dentist</dt><dd className="font-semibold text-text-primary">{scan.radiologist || '—'}</dd></div>
              </dl>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-secondary block">Clinical Findings</label>
                <textarea
                  rows={5}
                  value={findings}
                  onChange={(e) => setFindings(e.target.value)}
                  className="w-full p-3 rounded-xl border border-border bg-surface text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Describe radiographic findings"
                />
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="secondary" size="sm" leftIcon={<Trash2 className="w-4 h-4" />}
                  onClick={() => window.confirm('Delete this X-ray record?') && deleteXray.mutate(scan.id)}>
                  Delete
                </Button>
                <Button variant="secondary" size="sm" disabled={findings === (scan.findings || '')} isLoading={updateXray.isPending}
                  onClick={() => updateXray.mutate({ id: scan.id, findings })}>
                  Save Findings
                </Button>
                {scan.status !== 'VERIFIED' && (
                  <Button size="sm" leftIcon={<CheckCircle2 className="w-4 h-4" />}
                    onClick={() => updateXray.mutate({ id: scan.id, findings, status: 'VERIFIED' })}>
                    Verify & Sign
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Add X-Ray Record">
        <div className="p-4 sm:p-5 space-y-3 overflow-y-auto">
          <PatientPicker value={form.patientId} onChange={(v) => setForm((f) => ({ ...f, patientId: v }))} />
          <Select label="Scan type" value={form.scanType} onChange={(e) => setForm((f) => ({ ...f, scanType: e.target.value }))}>
            {SCAN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Tooth (optional)" value={form.toothNo} onChange={(e) => setForm((f) => ({ ...f, toothNo: e.target.value }))} placeholder="19" />
            <Input label="Date" type="date" value={form.takenAt} onChange={(e) => setForm((f) => ({ ...f, takenAt: e.target.value }))} />
          </div>
          <Input label="Region" value={form.region} onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))} placeholder="e.g. Mandibular left molar region" />
          <Input label="Radiologist / Dentist" value={form.radiologist} onChange={(e) => setForm((f) => ({ ...f, radiologist: e.target.value }))} />
          <div>
            <label className="text-xs font-semibold text-text-primary block mb-1.5">Findings</label>
            <textarea rows={3} value={form.findings} onChange={(e) => setForm((f) => ({ ...f, findings: e.target.value }))}
              className="w-full p-3 rounded-xl border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setModal(false)}>Cancel</Button>
            <Button size="sm" isLoading={createXray.isPending} onClick={submit}>Save Record</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default XrayRecordsPage
