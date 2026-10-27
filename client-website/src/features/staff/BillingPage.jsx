import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CreditCard, DollarSign, Plus, CheckCircle, Clock } from 'lucide-react'
import { api } from '../../lib/api'
import { DataTable } from '../../components/ui/DataTable'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { notify } from '../../components/ui/Toast'

export const BillingPage = () => {
  const queryClient = useQueryClient()
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    patientName: 'Sophia Maria Gonzalez',
    amount: 250.0,
    insuranceCoverage: 200.0,
    patientResponsibility: 50.0,
    paymentMethod: 'Credit Card',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['staff', 'billing'],
    queryFn: async () => {
      const res = await api.get('/api/staff/billing?limit=100')
      return res.data
    },
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  })

  const createInvoiceMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/api/staff/billing', payload)
      return res.data
    },
    onSuccess: (newInv) => {
      queryClient.invalidateQueries({ queryKey: ['staff', 'billing'] })
      setIsInvoiceOpen(false)
      const invNum = newInv.invoiceNumber || newInv.data?.invoiceNumber || 'New'
      notify.success(`Invoice ${invNum} recorded!`)
    },
    onError: (err) => {
      notify.error(err.response?.data?.message || err.message || 'Failed to create invoice.')
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
        const isPaid = (val || '').toUpperCase() === 'PAID'
        return (
          <Badge variant={isPaid ? 'success' : 'warning'} size="sm" dot>
            {val || 'PENDING'}
          </Badge>
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
          onClick={() => setIsInvoiceOpen(true)}
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
        title="Generate Clinical Invoice"
        description="Creates an itemized billing ledger record."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createInvoiceMutation.mutate(formData)
          }}
          className="space-y-4"
        >
          <Input
            label="Patient Name"
            required
            value={formData.patientName}
            onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Total Fee (₹)"
              type="number"
              step="0.01"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
            />
            <Input
              label="Insurance Paid (₹)"
              type="number"
              step="0.01"
              value={formData.insuranceCoverage}
              onChange={(e) =>
                setFormData({ ...formData, insuranceCoverage: parseFloat(e.target.value) || 0 })
              }
            />
            <Input
              label="Patient Copay (₹)"
              type="number"
              step="0.01"
              value={formData.patientResponsibility}
              onChange={(e) =>
                setFormData({ ...formData, patientResponsibility: parseFloat(e.target.value) || 0 })
              }
            />
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
    </div>
  )
}

export default BillingPage
