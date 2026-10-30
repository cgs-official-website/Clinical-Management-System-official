import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CreditCard, DollarSign, Plus, CheckCircle, Clock, Printer, Ban } from 'lucide-react'
import { api } from '../../lib/api'
import { DataTable } from '../../components/ui/DataTable'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { notify } from '../../components/ui/Toast'
import { printReceipt } from '../../lib/printReceipt'

export const BillingPage = () => {
  const queryClient = useQueryClient()
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [payTarget, setPayTarget] = useState(null) // invoice row being marked as paid
  const [payMethod, setPayMethod] = useState('Cash')
  const [voidTarget, setVoidTarget] = useState(null) // invoice row being voided

  const initialFormData = {
    patientName: '',
    amount: '',
    insuranceCoverage: '',
    patientResponsibility: '',
    paymentMethod: 'Cash',
    status: 'PENDING',
  }
  const [formData, setFormData] = useState(initialFormData)

  const { data, isLoading } = useQuery({
    queryKey: ['staff', 'billing'],
    queryFn: async () => {
      const res = await api.get('/api/staff/billing?limit=100')
      return res.data
    },
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  })

  const { data: patientsData } = useQuery({
    queryKey: ['staff', 'patients'],
    queryFn: async () => {
      const res = await api.get('/api/staff/patients')
      return res.data?.patients || res.data?.data || []
    },
    staleTime: 60 * 1000,
  })

  const createInvoiceMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/api/staff/billing', payload)
      return res.data
    },
    onSuccess: (newInv) => {
      queryClient.invalidateQueries({ queryKey: ['staff', 'billing'] })
      setIsInvoiceOpen(false)
      setFormData(initialFormData)
      const invNum = newInv.invoiceNumber || newInv.data?.invoiceNumber || 'New'
      notify.success(`Invoice ${invNum} recorded!`)
    },
    onError: (err) => {
      notify.error(err.response?.data?.message || err.message || 'Failed to create invoice.')
    },
  })

  const statusMutation = useMutation({
    mutationFn: async ({ id, paymentStatus, paymentMethod }) => {
      const res = await api.patch(`/api/staff/billing/${id}/status`, { paymentStatus, paymentMethod })
      return res.data
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['staff', 'billing'] })
      notify.success(vars.paymentStatus === 'PAID' ? 'Payment recorded. Invoice marked as PAID.' : 'Invoice voided.')
      setPayTarget(null)
      setVoidTarget(null)
    },
    onError: (err) => {
      notify.error(err.response?.data?.message || err.message || 'Failed to update invoice status.')
    },
  })

  const rawInvoices = Array.isArray(data) ? data : data?.invoices || data?.data || []
  const invoices = rawInvoices.filter((inv) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      (inv.invoiceNumber || '').toLowerCase().includes(term) ||
      (inv.patientName || '').toLowerCase().includes(term) ||
      (inv.paymentStatus || inv.status || '').toLowerCase().includes(term)
    )
  })

  const columns = [
    {
      key: 'invoiceNumber',
      label: 'Invoice #',
      sortable: true,
      render: (val, row) => (
        <div>
          <div className="font-mono font-bold text-xs text-primary">{val}</div>
          <div className="text-[11px] text-text-secondary">
            {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : row.date || 'Today'}
          </div>
        </div>
      ),
    },
    {
      key: 'patientName',
      label: 'Patient Account',
      sortable: true,
      render: (val) => <span className="font-semibold text-xs text-text-primary">{val}</span>,
    },
    {
      key: 'amount',
      label: 'Total Fee',
      render: (val) => <span className="font-bold text-xs">₹{Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>,
    },
    {
      key: 'insuranceCoverage',
      label: 'Insurance Paid',
      render: (val) => <span className="text-xs text-emerald-500 font-semibold">₹{Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>,
    },
    {
      key: 'patientResponsibility',
      label: 'Patient Copay',
      render: (val) => <span className="text-xs font-semibold">₹{Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>,
    },
    {
      key: 'status',
      label: 'Payment Status',
      render: (val) => {
        const st = (val || 'PENDING').toUpperCase()
        return (
          <Badge variant={st === 'PAID' ? 'success' : st === 'VOID' ? 'danger' : 'warning'} size="sm" dot>
            {val || 'PENDING'}
          </Badge>
        )
      },
    },
    {
      key: 'print',
      label: 'Receipt',
      render: (_, row) => (
        <Button
          variant="secondary"
          size="xs"
          leftIcon={<Printer className="w-3.5 h-3.5" />}
          onClick={() =>
            printReceipt({
              invoiceNumber: row.invoiceNumber,
              date: row.createdAt,
              patientName: row.patientName,
              paymentMethod: row.paymentMethod,
              status: row.status || row.paymentStatus,
              items:
                Array.isArray(row.items) && row.items.length > 0
                  ? row.items.map((it) => ({ description: it.description, amount: it.fee }))
                  : [{ description: 'Medical services', amount: row.amount }],
              total: row.amount,
            })
          }
        >
          Print
        </Button>
      ),
    },
    {
      key: 'actions',
      label: 'Action',
      render: (_, row) => {
        const st = String(row.status || row.paymentStatus || 'PENDING').toUpperCase()
        if (st !== 'PENDING') {
          return <span className="text-[11px] text-text-secondary">{st === 'PAID' ? 'Completed' : 'Cancelled'}</span>
        }
        return (
          <div className="flex items-center gap-1.5">
            <Button
              variant="primary"
              size="xs"
              leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
              onClick={() => {
                setPayMethod(row.paymentMethod || 'Cash')
                setPayTarget(row)
              }}
            >
              Mark Paid
            </Button>
            <Button
              variant="ghost"
              size="xs"
              leftIcon={<Ban className="w-3.5 h-3.5" />}
              onClick={() => setVoidTarget(row)}
            >
              Void
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-text-primary">
            Billing, Invoicing & Insurance Claims
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Process copays, issue CPT coded invoices, and monitor adjudication statuses
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setFormData(initialFormData)
            setIsInvoiceOpen(true)
          }}
          leftIcon={<Plus className="w-4 h-4" />}
          className="w-full sm:w-auto shrink-0 shadow-sm"
        >
          Generate Invoice
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={invoices}
        isLoading={isLoading}
        searchPlaceholder="Search invoices..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {/* Generate Invoice Modal */}
      <Modal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        maxWidth="max-w-lg"
        title="Generate Clinical Invoice"
        description="Creates an itemized billing ledger record."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const payload = {
              ...formData,
              amount: parseFloat(formData.amount) || 0,
              insuranceCoverage: parseFloat(formData.insuranceCoverage) || 0,
              patientResponsibility: parseFloat(formData.patientResponsibility) || 0,
              status: formData.status,
              paymentMethod: formData.status === 'PAID' ? formData.paymentMethod : undefined,
            }
            createInvoiceMutation.mutate(payload)
          }}
          className="space-y-4"
        >
          <Input
            label="Patient Name"
            required
            placeholder="e.g. Liam Reyes"
            list="billing-patients-list"
            value={formData.patientName}
            onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
          />
          <datalist id="billing-patients-list">
            {(Array.isArray(patientsData) ? patientsData : []).map((p) => (
              <option key={p.id || p.fullName} value={p.fullName || p.name} />
            ))}
          </datalist>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Total Fee (₹)"
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => {
                const val = e.target.value
                setFormData((prev) => {
                  const numAmt = parseFloat(val) || 0
                  const numIns = parseFloat(prev.insuranceCoverage) || 0
                  const copay = val && prev.insuranceCoverage ? Math.max(0, numAmt - numIns).toFixed(2) : prev.patientResponsibility
                  return { ...prev, amount: val, patientResponsibility: copay }
                })
              }}
            />
            <Input
              label="Insurance Paid (₹)"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.insuranceCoverage}
              onChange={(e) => {
                const val = e.target.value
                setFormData((prev) => {
                  const numAmt = parseFloat(prev.amount) || 0
                  const numIns = parseFloat(val) || 0
                  const copay = prev.amount && val ? Math.max(0, numAmt - numIns).toFixed(2) : prev.patientResponsibility
                  return { ...prev, insuranceCoverage: val, patientResponsibility: copay }
                })
              }}
            />
            <Input
              label="Patient Copay (₹)"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.patientResponsibility}
              onChange={(e) =>
                setFormData({ ...formData, patientResponsibility: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Payment Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'PENDING', label: 'Pending (bill now, collect later)' },
                { value: 'PAID', label: 'Paid (payment received now)' },
              ]}
            />
            {formData.status === 'PAID' && (
              <Select
                label="Payment Method"
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                options={[
                  { value: 'Cash', label: 'Cash' },
                  { value: 'UPI', label: 'UPI' },
                  { value: 'Card', label: 'Card' },
                ]}
              />
            )}
          </div>

          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-border">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsInvoiceOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={createInvoiceMutation.isPending}>
              Issue Invoice
            </Button>
          </div>
        </form>
      </Modal>

      {/* Mark as Paid Modal */}
      <Modal
        isOpen={!!payTarget}
        onClose={() => setPayTarget(null)}
        maxWidth="max-w-md"
        title="Record Payment"
        description={payTarget ? `Invoice ${payTarget.invoiceNumber} • ${payTarget.patientName}` : ''}
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-primary/25 bg-primary/5 flex items-center justify-between">
            <span className="text-sm font-bold text-text-primary">Amount to collect</span>
            <span className="text-xl font-extrabold text-primary">
              ₹{Number(payTarget?.patientResponsibility ?? payTarget?.amount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <Select
            label="Payment Method"
            value={payMethod}
            onChange={(e) => setPayMethod(e.target.value)}
            options={[
              { value: 'Cash', label: 'Cash' },
              { value: 'UPI', label: 'UPI' },
              { value: 'Card', label: 'Card' },
              { value: 'Insurance', label: 'Insurance' },
            ]}
          />
          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-border">
            <Button variant="secondary" size="sm" onClick={() => setPayTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={statusMutation.isPending}
              onClick={() =>
                statusMutation.mutate({ id: payTarget.id, paymentStatus: 'PAID', paymentMethod: payMethod })
              }
            >
              Confirm Payment Received
            </Button>
          </div>
        </div>
      </Modal>

      {/* Void Confirmation */}
      <ConfirmDialog
        isOpen={!!voidTarget}
        onClose={() => setVoidTarget(null)}
        onConfirm={() => statusMutation.mutate({ id: voidTarget.id, paymentStatus: 'VOID' })}
        isLoading={statusMutation.isPending}
        title="Void this invoice?"
        message={voidTarget ? `Invoice ${voidTarget.invoiceNumber} for ${voidTarget.patientName} will be cancelled and cannot be collected.` : ''}
        confirmText="Yes, Void Invoice"
      />
    </div>
  )
}

export default BillingPage
