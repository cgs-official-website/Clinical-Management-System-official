import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, Plus, Receipt, Trash2, Printer, UserRound } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { notify } from '../../components/ui/Toast'
import { PatientPicker } from './components/PatientPicker'
import {
  usePatientParam,
  usePlans,
  useCreatePlan,
  useUpdatePlan,
  useDeletePlan,
  useAddPlanItem,
  useUpdatePlanItem,
  useDeletePlanItem,
  useInvoicePlan,
} from './dentalApi'

const ITEM_STATUSES = ['PLANNED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED']
const STATUS_VARIANT = { PLANNED: 'neutral', ACCEPTED: 'info', IN_PROGRESS: 'warning', COMPLETED: 'success' }
const inr = (n) => `₹${(Number(n) || 0).toLocaleString('en-IN')}`
const EMPTY_ITEM = { phase: 'Phase 1', code: '', description: '', toothNo: '', fee: '', insuranceCoverage: '' }

export const TreatmentPlansPage = () => {
  const [patientId, setPatientId] = usePatientParam()
  const [activePlanId, setActivePlanId] = useState('')
  const [planModal, setPlanModal] = useState(false)
  const [planName, setPlanName] = useState('')
  const [itemModal, setItemModal] = useState(false)
  const [itemForm, setItemForm] = useState(EMPTY_ITEM)

  const { data: plans = [], isLoading } = usePlans(patientId)
  const createPlan = useCreatePlan()
  const updatePlan = useUpdatePlan()
  const deletePlan = useDeletePlan()
  const addItem = useAddPlanItem()
  const updateItem = useUpdatePlanItem()
  const deleteItem = useDeletePlanItem()
  const invoicePlan = useInvoicePlan()

  // keep a valid plan selected
  useEffect(() => {
    if (!plans.length) return setActivePlanId('')
    if (!plans.some((p) => p.id === activePlanId)) setActivePlanId(plans[0].id)
  }, [plans, activePlanId])

  const plan = plans.find((p) => p.id === activePlanId)

  const phases = useMemo(() => {
    const map = new Map()
    for (const it of plan?.items || []) {
      if (!map.has(it.phase)) map.set(it.phase, [])
      map.get(it.phase).push(it)
    }
    return [...map.entries()].map(([phase, items]) => ({ phase, items }))
  }, [plan])

  const totals = useMemo(() => {
    const items = plan?.items || []
    const fee = items.reduce((s, i) => s + (i.fee || 0), 0)
    const insurance = items.reduce((s, i) => s + (i.insuranceCoverage || 0), 0)
    return { fee, insurance, patient: fee - insurance }
  }, [plan])

  const submitPlan = () => {
    if (!planName.trim()) return notify.error('Enter a plan name.')
    createPlan.mutate(
      { patientId, name: planName.trim(), items: [] },
      {
        onSuccess: (created) => {
          setPlanModal(false)
          setPlanName('')
          if (created?.id) setActivePlanId(created.id)
        },
      }
    )
  }

  const submitItem = () => {
    if (!itemForm.description.trim()) return notify.error('Enter a procedure description.')
    addItem.mutate(
      {
        planId: plan.id,
        phase: itemForm.phase || 'Phase 1',
        code: itemForm.code || null,
        description: itemForm.description.trim(),
        toothNo: itemForm.toothNo || null,
        fee: Number(itemForm.fee) || 0,
        insuranceCoverage: Number(itemForm.insuranceCoverage) || 0,
      },
      {
        onSuccess: () => {
          setItemModal(false)
          setItemForm(EMPTY_ITEM)
        },
      }
    )
  }

  const handleDeletePlan = () => {
    if (!window.confirm(`Delete plan "${plan.name}" and all its procedures?`)) return
    deletePlan.mutate(plan.id)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading font-extrabold text-2xl text-text-primary">Dental Treatment Plans</h1>
            <Badge variant="primary" size="sm">Dental Care ERP</Badge>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Phased procedures, fee estimates, insurance share and patient portion
          </p>
        </div>
        <div className="flex items-end gap-2.5">
          <PatientPicker value={patientId} onChange={setPatientId} className="w-64" />
          <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} disabled={!patientId} onClick={() => setPlanModal(true)}>
            New Plan
          </Button>
        </div>
      </div>

      {!patientId ? (
        <EmptyState icon={UserRound} title="Select a patient" description="Choose a patient to view or create treatment plans." />
      ) : isLoading ? (
        <SkeletonTable rows={5} cols={6} />
      ) : !plan ? (
        <EmptyState
          icon={ClipboardList}
          title="No treatment plans yet"
          description="Create a plan here, or use “Add to Treatment Plan” from the patient's Dental Chart."
          actionLabel="Create Plan"
          onAction={() => setPlanModal(true)}
        />
      ) : (
        <>
          {/* Plan tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {plans.map((p) => (
              <button
                key={p.id}
                onClick={() => setActivePlanId(p.id)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${p.id === activePlanId ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-secondary hover:border-primary/40'
                  }`}
              >
                {p.name}
              </button>
            ))}
          </div>

          {/* Totals */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              ['Total Treatment Cost', totals.fee, 'text-text-primary'],
              ['Insurance / Covered', totals.insurance, 'text-emerald-500'],
              ['Patient Portion', totals.patient, 'text-primary'],
            ].map(([label, value, color]) => (
              <div key={label} className="p-5 rounded-2xl border border-border bg-surface shadow-soft">
                <p className="text-xs text-text-secondary">{label}</p>
                <p className={`font-heading font-extrabold text-2xl mt-1 ${color}`}>{inr(value)}</p>
              </div>
            ))}
          </div>

          {/* Plan card */}
          <div className="p-6 rounded-2xl border border-border bg-surface shadow-soft space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <h3 className="font-heading font-bold text-base text-text-primary">{plan.name}</h3>
                <p className="text-xs text-text-secondary">
                  {plan.patient?.fullName} · {plan.items.length} procedure{plan.items.length === 1 ? '' : 's'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={plan.status}
                  onChange={(e) => updatePlan.mutate({ id: plan.id, status: e.target.value })}
                  className="rounded-xl border border-border bg-surface px-2.5 py-1.5 text-xs text-text-primary"
                >
                  {['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <Button variant="secondary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setItemModal(true)}>
                  Add Procedure
                </Button>
                <Button variant="secondary" size="sm" leftIcon={<Printer className="w-4 h-4" />} onClick={() => window.print()}>
                  Print
                </Button>
                {plan.invoiceId ? (
                  <Link to="/app/staff/billing">
                    <Badge variant="success" size="md">Invoiced · View in Billing</Badge>
                  </Link>
                ) : (
                  <Button
                    size="sm"
                    leftIcon={<Receipt className="w-4 h-4" />}
                    isLoading={invoicePlan.isPending}
                    disabled={!plan.items.length}
                    onClick={() => invoicePlan.mutate(plan.id)}
                  >
                    Generate Invoice
                  </Button>
                )}
                <Button variant="secondary" size="sm" leftIcon={<Trash2 className="w-4 h-4" />} onClick={handleDeletePlan}>
                  Delete
                </Button>
              </div>
            </div>

            {!plan.items.length ? (
              <EmptyState title="No procedures in this plan" description="Add a procedure to start building the estimate." actionLabel="Add Procedure" onAction={() => setItemModal(true)} />
            ) : (
              phases.map(({ phase, items }) => (
                <div key={phase} className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-primary">{phase}</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-text-secondary border-b border-border">
                          <th className="py-2 px-3 font-semibold">Code</th>
                          <th className="py-2 px-3 font-semibold">Procedure</th>
                          <th className="py-2 px-3 font-semibold">Tooth</th>
                          <th className="py-2 px-3 font-semibold text-right">Fee</th>
                          <th className="py-2 px-3 font-semibold text-right">Insurance</th>
                          <th className="py-2 px-3 font-semibold text-right">Patient</th>
                          <th className="py-2 px-3 font-semibold">Status</th>
                          <th className="py-2 px-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((it) => (
                          <tr key={it.id} className="border-b border-border/50">
                            <td className="py-3 px-3 font-mono text-text-secondary">{it.code || '—'}</td>
                            <td className="py-3 px-3 text-text-primary font-medium">{it.description}</td>
                            <td className="py-3 px-3 text-text-secondary">{it.toothNo || '—'}</td>
                            <td className="py-3 px-3 font-mono text-right text-text-primary">{inr(it.fee)}</td>
                            <td className="py-3 px-3 font-mono text-right text-emerald-500">{inr(it.insuranceCoverage)}</td>
                            <td className="py-3 px-3 font-mono text-right font-bold text-primary">{inr(it.fee - it.insuranceCoverage)}</td>
                            <td className="py-3 px-3">
                              <select
                                value={it.status}
                                onChange={(e) => updateItem.mutate({ planId: plan.id, itemId: it.id, status: e.target.value })}
                                className="rounded-lg border border-border bg-surface px-2 py-1 text-[11px]"
                              >
                                {ITEM_STATUSES.map((s) => (
                                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                                ))}
                              </select>
                              <Badge variant={STATUS_VARIANT[it.status]} size="sm" className="ml-2">{it.status.replace('_', ' ')}</Badge>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                aria-label="Remove procedure"
                                className="text-text-secondary hover:text-danger"
                                onClick={() => deleteItem.mutate({ planId: plan.id, itemId: it.id })}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      <Modal isOpen={planModal} onClose={() => setPlanModal(false)} title="New Treatment Plan">
        <div className="p-4 sm:p-5 space-y-3">
          <Input label="Plan name" required value={planName} onChange={(e) => setPlanName(e.target.value)} placeholder="e.g. Restorative plan – upper left" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setPlanModal(false)}>Cancel</Button>
            <Button size="sm" isLoading={createPlan.isPending} onClick={submitPlan}>Create Plan</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={itemModal} onClose={() => setItemModal(false)} title="Add Procedure">
        <div className="p-4 sm:p-5 space-y-3 overflow-y-auto">
          <Input label="Procedure" required value={itemForm.description} onChange={(e) => setItemForm((f) => ({ ...f, description: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Code" value={itemForm.code} onChange={(e) => setItemForm((f) => ({ ...f, code: e.target.value }))} />
            <Input label="Tooth" value={itemForm.toothNo} onChange={(e) => setItemForm((f) => ({ ...f, toothNo: e.target.value }))} placeholder="14 (MO) / All" />
            <Input label="Fee (₹)" type="number" min="0" value={itemForm.fee} onChange={(e) => setItemForm((f) => ({ ...f, fee: e.target.value }))} />
            <Input label="Insurance (₹)" type="number" min="0" value={itemForm.insuranceCoverage} onChange={(e) => setItemForm((f) => ({ ...f, insuranceCoverage: e.target.value }))} />
          </div>
          <Input label="Phase" value={itemForm.phase} onChange={(e) => setItemForm((f) => ({ ...f, phase: e.target.value }))} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setItemModal(false)}>Cancel</Button>
            <Button size="sm" isLoading={addItem.isPending} onClick={submitItem}>Add</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default TreatmentPlansPage
