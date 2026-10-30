import React, { useState } from 'react'
import { CalendarX, Clock, Plus, Trash2 } from 'lucide-react'
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
import { PatientPicker } from './components/PatientPicker'
import {
  cardioHttp,
  errorMessage,
  fmtTime,
  num,
  toLocalInput,
  useCardioAccess,
  useCardioList,
  useCardioMutation,
} from './cardioApi'

const RESOURCE = 'cath-lab'

const LABS = [
  { id: 'LAB-1', label: 'Lab 1' },
  { id: 'LAB-2', label: 'Lab 2' },
  { id: 'LAB-3', label: 'Lab 3' },
]

const COMMON_PROCEDURES = [
  'Diagnostic Coronary Angiography',
  'Left Heart Cath + Coronary Angiography ± PCI',
  'Percutaneous Coronary Intervention (PCI)',
  'Permanent Pacemaker Implantation',
  'Catheter Ablation',
  'Right Heart Catheterization',
  'Peripheral Angiography',
]

const STATUS_LABEL = {
  SCHEDULED: 'Scheduled',
  PRE_OP_PREP: 'Pre-op prep',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}
const statusVariant = (s) =>
  ({ IN_PROGRESS: 'danger', PRE_OP_PREP: 'warning', COMPLETED: 'success', CANCELLED: 'neutral' })[s] || 'info'
const urgencyVariant = (u) => (u === 'EMERGENCY' || u === 'URGENT' ? 'danger' : 'neutral')

const todayStr = () => toLocalInput().slice(0, 10)

const emptyBooking = (interventionalist) => {
  const start = new Date()
  start.setMinutes(0, 0, 0)
  start.setHours(start.getHours() + 1)
  const end = new Date(start.getTime() + 60 * 60 * 1000)
  return {
    patientId: '',
    lab: 'LAB-1',
    procedure: '',
    scheduledStart: toLocalInput(start),
    scheduledEnd: toLocalInput(end),
    urgency: 'ELECTIVE',
    interventionalist: interventionalist || '',
    scrubNurse: '',
    radiologicTech: '',
    accessSite: '',
    contrastAgent: '',
  }
}

export const CathLabSchedulingPage = () => {
  const { user } = useAuthStore()
  const { canCreate, canEdit, canDelete } = useCardioAccess('cath_lab_scheduling')
  const [lab, setLab] = useState('')
  const [date, setDate] = useState(todayStr())
  const [isBookOpen, setIsBookOpen] = useState(false)
  const [form, setForm] = useState(emptyBooking())
  const [formError, setFormError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [logTarget, setLogTarget] = useState(null)
  const [log, setLog] = useState({ fluoroscopyMinutes: '', contrastAgent: '', accessSite: '', intraOpNotes: '' })

  // Day boundaries are computed in the browser's local time and sent as instants.
  const dayRange = date
    ? {
      from: new Date(`${date}T00:00:00`).toISOString(),
      to: new Date(new Date(`${date}T00:00:00`).getTime() + 24 * 60 * 60 * 1000).toISOString(),
    }
    : {}
  const { data, isLoading, isError, error } = useCardioList(RESOURCE, {
    lab: lab || undefined,
    ...dayRange,
  })
  const schedule = data?.data || []
  const suites = data?.suites || []

  const bookMutation = useCardioMutation(RESOURCE, (payload) => cardioHttp.post(RESOURCE, payload), {
    success: 'Cath lab case booked.',
    onSuccess: (res) => {
      setIsBookOpen(false)
      const booked = res?.data?.scheduledStart
      if (booked) setDate(toLocalInput(new Date(booked)).slice(0, 10))
    },
  })
  const statusMutation = useCardioMutation(
    RESOURCE,
    ({ id, status }) => cardioHttp.patch(`${RESOURCE}/${id}`, { status }),
    { success: 'Case status updated.' }
  )
  const logMutation = useCardioMutation(RESOURCE, ({ id, body }) => cardioHttp.patch(`${RESOURCE}/${id}`, body), {
    success: 'Intra-procedure log saved.',
    onSuccess: () => setLogTarget(null),
  })
  const deleteMutation = useCardioMutation(RESOURCE, (id) => cardioHttp.del(`${RESOURCE}/${id}`), {
    success: 'Case deleted.',
    onSuccess: () => setDeleteTarget(null),
  })

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const openBook = () => {
    setForm(emptyBooking(user?.fullName || user?.name))
    setFormError('')
    setIsBookOpen(true)
  }

  const submitBooking = (e) => {
    e.preventDefault()
    if (!form.patientId) return setFormError('Please select a patient.')
    if (form.procedure.trim().length < 3) return setFormError('Enter the procedure.')
    const start = new Date(form.scheduledStart)
    const end = new Date(form.scheduledEnd)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return setFormError('Enter valid start and end times.')
    if (end <= start) return setFormError('End time must be after the start time.')
    setFormError('')
    bookMutation.mutate({
      patientId: form.patientId,
      lab: form.lab,
      procedure: form.procedure.trim(),
      scheduledStart: start.toISOString(),
      scheduledEnd: end.toISOString(),
      urgency: form.urgency,
      interventionalist: form.interventionalist.trim() || undefined,
      scrubNurse: form.scrubNurse.trim() || undefined,
      radiologicTech: form.radiologicTech.trim() || undefined,
      accessSite: form.accessSite.trim() || undefined,
      contrastAgent: form.contrastAgent.trim() || undefined,
    })
  }

  const openLog = (item) => {
    setLog({
      fluoroscopyMinutes: item.fluoroscopyMinutes ?? '',
      contrastAgent: item.contrastAgent || '',
      accessSite: item.accessSite || '',
      intraOpNotes: item.intraOpNotes || '',
    })
    setLogTarget(item)
  }

  const submitLog = (e) => {
    e.preventDefault()
    logMutation.mutate({
      id: logTarget.id,
      body: {
        fluoroscopyMinutes: num(log.fluoroscopyMinutes),
        contrastAgent: log.contrastAgent.trim(),
        accessSite: log.accessSite.trim(),
        intraOpNotes: log.intraOpNotes.trim(),
      },
    })
  }

  const nextActions = (item) => {
    if (!canEdit) return []
    switch (item.status) {
      case 'SCHEDULED':
        return [
          { label: 'Start Prep', status: 'PRE_OP_PREP', variant: 'outline' },
          { label: 'Start Case', status: 'IN_PROGRESS', variant: 'primary' },
          { label: 'Cancel', status: 'CANCELLED', variant: 'ghost' },
        ]
      case 'PRE_OP_PREP':
        return [
          { label: 'Start Case', status: 'IN_PROGRESS', variant: 'primary' },
          { label: 'Cancel', status: 'CANCELLED', variant: 'ghost' },
        ]
      case 'IN_PROGRESS':
        return [{ label: 'Complete', status: 'COMPLETED', variant: 'primary' }]
      default:
        return []
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading font-extrabold text-2xl text-text-primary">Cath Lab / Procedure Scheduling</h1>
            <Badge variant="primary" size="sm">Invasive & Interventional Cardiology</Badge>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Book lab suites, track each case from prep to completion and log intra-procedure details
          </p>
        </div>
        {canCreate && (
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={openBook}>
            Book Cath Lab Case
          </Button>
        )}
      </div>

      {/* Suite status (derived from live cases) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(suites.length ? suites : [null, null, null]).map((suite, i) =>
          suite ? (
            <div key={suite.id} className="p-4 rounded-xl border border-border bg-surface shadow-soft space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-text-primary">{suite.id}</span>
                <Badge
                  variant={suite.status === 'IN_PROCEDURE' ? 'danger' : suite.status === 'READY' ? 'success' : 'warning'}
                  size="sm"
                >
                  {suite.status.replace('_', ' ')}
                </Badge>
              </div>
              <h3 className="text-xs font-semibold text-text-secondary">{suite.name}</h3>
              <p className="text-[11px] text-text-muted font-mono">{suite.currentCase}</p>
            </div>
          ) : (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          )
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-2">
        <div className="flex items-center gap-2">
          {[{ id: '', label: 'All Suites' }, ...LABS].map((tab) => (
            <button
              key={tab.id || 'all'}
              onClick={() => setLab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${lab === tab.id ? 'bg-primary text-white shadow-soft' : 'text-text-secondary hover:bg-surface-secondary'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Filter by date"
            className="rounded-xl border border-border bg-surface/80 px-3 py-1.5 text-xs text-text-primary"
          />
          {date && (
            <Button size="xs" variant="ghost" onClick={() => setDate('')}>
              All dates
            </Button>
          )}
        </div>
      </div>

      {/* Cases */}
      <div className="space-y-3">
        {isLoading && (
          <>
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
          </>
        )}
        {isError && <EmptyState title="Could not load cath lab cases" description={errorMessage(error)} />}
        {!isLoading && !isError && schedule.length === 0 && (
          <EmptyState
            icon={CalendarX}
            title="No cases scheduled"
            description={date ? 'Nothing is booked for this day and suite filter.' : 'No cath lab cases have been booked yet.'}
            actionLabel={canCreate ? 'Book Cath Lab Case' : undefined}
            onAction={openBook}
          />
        )}

        {schedule.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-2xl border border-border bg-surface shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary/40 transition-all"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-xs font-bold text-primary flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {fmtTime(item.scheduledStart)} - {fmtTime(item.scheduledEnd)}
                </span>
                <Badge variant="neutral" size="sm">{item.lab}</Badge>
                <Badge variant={statusVariant(item.status)} size="sm">{STATUS_LABEL[item.status] || item.status}</Badge>
                {item.urgency !== 'ELECTIVE' && (
                  <Badge variant={urgencyVariant(item.urgency)} size="sm">{item.urgency}</Badge>
                )}
                <span className="font-mono text-[11px] text-text-muted">{item.caseNumber}</span>
              </div>

              <h3 className="text-base font-bold text-text-primary">{item.procedure}</h3>
              <p className="text-xs text-text-muted">
                Patient: <span className="font-medium text-text-primary">{item.patientName}</span> ({item.patientMrn})
                {item.accessSite ? ` • Access: ${item.accessSite}` : ''}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary pt-1">
                <span>
                  Interventionalist: <strong className="text-text-primary">{item.interventionalist || 'Not assigned'}</strong>
                </span>
                {item.scrubNurse && <span>Scrub: {item.scrubNurse}</span>}
                {item.radiologicTech && <span>RT Tech: {item.radiologicTech}</span>}
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end gap-2 border-t md:border-t-0 md:border-l border-border pt-3 md:pt-0 md:pl-4 min-w-44">
              {item.fluoroscopyMinutes != null && (
                <div className="text-left md:text-right">
                  <span className="text-[10px] text-text-muted uppercase">Fluoro Exposure</span>
                  <p className="text-xs font-mono font-bold text-warning">{item.fluoroscopyMinutes} mins</p>
                </div>
              )}
              <div className="flex flex-wrap gap-1.5 md:justify-end">
                {nextActions(item).map((a) => (
                  <Button
                    key={a.status}
                    size="xs"
                    variant={a.variant}
                    isLoading={statusMutation.isPending && statusMutation.variables?.id === item.id}
                    onClick={() => statusMutation.mutate({ id: item.id, status: a.status })}
                  >
                    {a.label}
                  </Button>
                ))}
                {canEdit && item.status !== 'CANCELLED' && (
                  <Button size="xs" variant="outline" onClick={() => openLog(item)}>
                    Intra-Op Log
                  </Button>
                )}
                {canDelete && (
                  <Button
                    size="xs"
                    variant="ghost"
                    aria-label="Delete case"
                    onClick={() => setDeleteTarget(item)}
                    leftIcon={<Trash2 className="w-3.5 h-3.5 text-danger" />}
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Booking modal */}
      <Modal
        isOpen={isBookOpen}
        onClose={() => setIsBookOpen(false)}
        title="Book Cath Lab Case"
        description="The system blocks double-booking of the same suite"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={submitBooking} className="space-y-4">
          <PatientPicker value={form.patientId} onChange={(v) => setForm((f) => ({ ...f, patientId: v }))} />

          <div>
            <Input
              label="Procedure"
              required
              list="cath-procedures"
              placeholder="e.g. Diagnostic Coronary Angiography"
              value={form.procedure}
              onChange={setField('procedure')}
            />
            <datalist id="cath-procedures">
              {COMMON_PROCEDURES.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label="Suite" value={form.lab} onChange={setField('lab')}>
              {LABS.map((l) => (
                <option key={l.id} value={l.id}>{l.id}</option>
              ))}
            </Select>
            <Select label="Urgency" value={form.urgency} onChange={setField('urgency')}>
              <option value="ELECTIVE">Elective</option>
              <option value="ROUTINE">Routine</option>
              <option value="URGENT">Urgent</option>
              <option value="EMERGENCY">Emergency</option>
            </Select>
            <Input label="Start" type="datetime-local" required value={form.scheduledStart} onChange={setField('scheduledStart')} />
            <Input label="End" type="datetime-local" required value={form.scheduledEnd} onChange={setField('scheduledEnd')} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Interventionalist" value={form.interventionalist} onChange={setField('interventionalist')} />
            <Input label="Scrub nurse" value={form.scrubNurse} onChange={setField('scrubNurse')} />
            <Input label="Radiologic tech" value={form.radiologicTech} onChange={setField('radiologicTech')} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Access site" placeholder="e.g. Right radial artery" value={form.accessSite} onChange={setField('accessSite')} />
            <Input label="Contrast agent" placeholder="e.g. Iohexol (est. 65 mL)" value={form.contrastAgent} onChange={setField('contrastAgent')} />
          </div>

          {formError && <p className="text-xs text-danger font-medium">{formError}</p>}

          <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
            <Button variant="secondary" size="sm" onClick={() => setIsBookOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={bookMutation.isPending}>
              Book Case
            </Button>
          </div>
        </form>
      </Modal>

      {/* Intra-op log modal */}
      <Modal
        isOpen={!!logTarget}
        onClose={() => setLogTarget(null)}
        title="Intra-Procedure Log"
        description={logTarget ? `${logTarget.caseNumber} • ${logTarget.patientName} • ${logTarget.procedure}` : ''}
      >
        <form onSubmit={submitLog} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Fluoroscopy time (mins)"
              type="number"
              step="0.1"
              min="0"
              value={log.fluoroscopyMinutes}
              onChange={(e) => setLog((l) => ({ ...l, fluoroscopyMinutes: e.target.value }))}
            />
            <Input
              label="Contrast agent"
              value={log.contrastAgent}
              onChange={(e) => setLog((l) => ({ ...l, contrastAgent: e.target.value }))}
            />
          </div>
          <Input
            label="Access site"
            value={log.accessSite}
            onChange={(e) => setLog((l) => ({ ...l, accessSite: e.target.value }))}
          />
          <Textarea
            label="Procedure notes"
            rows={5}
            placeholder="Findings, devices used, complications"
            value={log.intraOpNotes}
            onChange={(e) => setLog((l) => ({ ...l, intraOpNotes: e.target.value }))}
          />
          <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
            <Button variant="secondary" size="sm" onClick={() => setLogTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={logMutation.isPending}>
              Save Log
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        isLoading={deleteMutation.isPending}
        title="Delete cath lab case"
        message={`Delete ${deleteTarget?.caseNumber} (${deleteTarget?.procedure}) for ${deleteTarget?.patientName}? This cannot be undone.`}
      />
    </div>
  )
}

export default CathLabSchedulingPage
