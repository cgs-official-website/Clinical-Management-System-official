import React, { useState } from 'react'
import { FlaskConical, Plus, Trash2 } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { notify } from '../../components/ui/Toast'
import { PatientPicker } from './components/PatientPicker'
import { usePatientParam, useLabOrders, useCreateLabOrder, useUpdateLabOrder, useDeleteLabOrder } from './dentalApi'

const WORK_TYPES = ['Crown', 'Bridge', 'Veneer', 'Inlay / Onlay', 'Complete Denture', 'Partial Denture', 'Night Guard', 'Retainer', 'Implant Abutment']
const STATUSES = ['DRAFT', 'SENT', 'IN_PROGRESS', 'RECEIVED', 'FITTED', 'CANCELLED']
const STATUS_VARIANT = { DRAFT: 'neutral', SENT: 'info', IN_PROGRESS: 'warning', RECEIVED: 'primary', FITTED: 'success', CANCELLED: 'danger' }
const EMPTY = { patientId: '', lab: '', workType: WORK_TYPES[0], material: '', toothNo: '', shade: '', dueDate: '', notes: '' }
const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')

export const LabOrdersPage = () => {
  const [patientId, setPatientId] = usePatientParam()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)

  const { data: orders = [], isLoading } = useLabOrders(patientId)
  const createOrder = useCreateLabOrder()
  const updateOrder = useUpdateLabOrder()
  const deleteOrder = useDeleteLabOrder()

  const openModal = () => {
    setForm({ ...EMPTY, patientId })
    setModal(true)
  }

  const submit = () => {
    if (!form.patientId) return notify.error('Select a patient.')
    if (!form.lab.trim()) return notify.error('Enter the dental lab name.')
    createOrder.mutate(
      { ...form, dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null },
      { onSuccess: () => setModal(false) }
    )
  }

  const overdue = (o) => o.dueDate && new Date(o.dueDate) < new Date() && !['RECEIVED', 'FITTED', 'CANCELLED'].includes(o.status)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading font-extrabold text-2xl text-text-primary">Lab Work Orders</h1>
            <Badge variant="primary" size="sm">Dental Care ERP</Badge>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">Crown, bridge and prosthesis fabrication tracking</p>
        </div>
        <div className="flex items-end gap-2.5">
          <PatientPicker value={patientId} onChange={setPatientId} allowAll className="w-64" />
          <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={openModal}>New Lab Order</Button>
        </div>
      </div>

      {isLoading ? (
        <SkeletonTable rows={5} cols={7} />
      ) : !orders.length ? (
        <EmptyState icon={FlaskConical} title="No lab orders" description="Create a lab order for a crown, bridge or denture." actionLabel="New Lab Order" onAction={openModal} />
      ) : (
        <div className="rounded-2xl border border-border bg-surface shadow-soft overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-text-secondary border-b border-border">
                {['Order #', 'Patient', 'Work', 'Tooth / Shade', 'Lab', 'Due', 'Status', ''].map((h) => (
                  <th key={h} className="py-3 px-4 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-border/50">
                  <td className="py-3 px-4 font-mono text-text-secondary">{o.orderNo}</td>
                  <td className="py-3 px-4 text-text-primary font-medium">{o.patient?.fullName}</td>
                  <td className="py-3 px-4">{o.workType}{o.material ? ` · ${o.material}` : ''}</td>
                  <td className="py-3 px-4 text-text-secondary">{[o.toothNo && `#${o.toothNo}`, o.shade].filter(Boolean).join(' · ') || '—'}</td>
                  <td className="py-3 px-4">{o.lab}</td>
                  <td className={`py-3 px-4 ${overdue(o) ? 'text-danger font-bold' : ''}`}>{fmt(o.dueDate)}{overdue(o) ? ' (overdue)' : ''}</td>
                  <td className="py-3 px-4">
                    <select
                      value={o.status}
                      onChange={(e) => updateOrder.mutate({ id: o.id, status: e.target.value })}
                      className="rounded-lg border border-border bg-surface px-2 py-1 text-[11px]"
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                    <Badge variant={STATUS_VARIANT[o.status]} size="sm" className="ml-2">{o.status.replace('_', ' ')}</Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button aria-label="Delete order" className="text-text-secondary hover:text-danger"
                      onClick={() => window.confirm(`Delete ${o.orderNo}?`) && deleteOrder.mutate(o.id)}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title="New Lab Order">
        <div className="p-4 sm:p-5 space-y-3 overflow-y-auto">
          <PatientPicker value={form.patientId} onChange={(v) => setForm((f) => ({ ...f, patientId: v }))} />
          <Input label="Dental lab" required value={form.lab} onChange={(e) => setForm((f) => ({ ...f, lab: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Work type" value={form.workType} onChange={(e) => setForm((f) => ({ ...f, workType: e.target.value }))}>
              {WORK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
            <Input label="Material" value={form.material} onChange={(e) => setForm((f) => ({ ...f, material: e.target.value }))} placeholder="Zirconia / PFM" />
            <Input label="Tooth" value={form.toothNo} onChange={(e) => setForm((f) => ({ ...f, toothNo: e.target.value }))} placeholder="30" />
            <Input label="Shade" value={form.shade} onChange={(e) => setForm((f) => ({ ...f, shade: e.target.value }))} placeholder="A2" />
          </div>
          <Input label="Due date" type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
          <div>
            <label className="text-xs font-semibold text-text-primary block mb-1.5">Notes</label>
            <textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full p-3 rounded-xl border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setModal(false)}>Cancel</Button>
            <Button size="sm" isLoading={createOrder.isPending} onClick={submit}>Create Order</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default LabOrdersPage
