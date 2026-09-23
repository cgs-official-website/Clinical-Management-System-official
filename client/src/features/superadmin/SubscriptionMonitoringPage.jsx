import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Receipt,
  Search,
  Eye,
  Printer,
  Download,
  ArrowLeft,
  Sparkles,
  Building2,
  Filter,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { api } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Skeleton } from '../../components/ui/Skeleton'
import { SubscriptionInvoiceDocument } from '../subscription/SubscriptionInvoiceDocument'

export const SubscriptionMonitoringPage = () => {
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [planFilter, setPlanFilter] = useState('ALL')

  // Fetch all tenant subscription invoices (Superadmin scope)
  const { data: invoicesData, isLoading, refetch } = useQuery({
    queryKey: ['superadmin', 'subscription-invoices'],
    queryFn: async () => {
      const res = await api.get('/api/superadmin/subscriptions/invoices')
      return res.data
    },
  })

  // Fetch official Zuna company settings
  const { data: companyData } = useQuery({
    queryKey: ['superadmin', 'company-settings'],
    queryFn: async () => {
      const res = await api.get('/api/superadmin/company-settings')
      return res.data?.data || res.data
    },
  })

  const invoices = invoicesData?.data || []
  const companySettings = companyData || invoicesData?.companySettings || {}

  // Filter invoices
  const filteredInvoices = invoices.filter((inv) => {
    const q = search.toLowerCase().trim()
    const matchesSearch =
      !q ||
      inv.invoiceNumber?.toLowerCase().includes(q) ||
      inv.tenant?.name?.toLowerCase().includes(q) ||
      inv.tenant?.subdomain?.toLowerCase().includes(q) ||
      inv.tenant?.contactEmail?.toLowerCase().includes(q) ||
      inv.tenant?.email?.toLowerCase().includes(q)

    const matchesStatus =
      statusFilter === 'ALL' || inv.status?.toUpperCase() === statusFilter

    const matchesPlan =
      planFilter === 'ALL' ||
      inv.plan?.code?.toUpperCase() === planFilter ||
      inv.tenant?.planRelation?.code?.toUpperCase() === planFilter ||
      inv.tenant?.planRelation?.name?.toUpperCase()?.includes(planFilter)

    return matchesSearch && matchesStatus && matchesPlan
  })

  // Quick Metrics
  const totalVolume = invoices.reduce(
    (acc, curr) => acc + Number(curr.totalAmount || 0),
    0
  )
  const totalTax = invoices.reduce(
    (acc, curr) =>
      acc +
      Number(curr.cgstAmount || 0) +
      Number(curr.sgstAmount || 0) +
      Number(curr.taxAmount || 0),
    0
  )

  // Direct print from table
  const handleQuickPrint = (inv) => {
    const clinicTitle = inv.tenant?.name || 'Clinic'
    const originalTitle = document.title
    document.title = `${clinicTitle} - Subscription Invoice`
    setSelectedInvoice(inv)
    setTimeout(() => {
      window.print()
      document.title = originalTitle
    }, 150)
  }

  // If Superadmin has selected an invoice to inspect, render the MASTER INVOICE UI
  if (selectedInvoice) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-16 selection:bg-primary/20 print:p-0 print:m-0 print:max-w-none print:w-full">
        {/* Navigation back bar */}
        <div className="flex items-center justify-between gap-4 border-b border-border pb-4 print:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedInvoice(null)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Subscription Monitoring Ledger
          </Button>

          <div className="text-xs text-text-secondary flex items-center gap-2">
            <span>Viewing Clinic:</span>
            <strong className="text-text-primary">
              {selectedInvoice.tenant?.name}
            </strong>
          </div>
        </div>

        {/* Master Shared Invoice Renderer */}
        <SubscriptionInvoiceDocument
          invoice={selectedInvoice}
          tenant={selectedInvoice.tenant}
          companySettings={companySettings}
          showActions={true}
          onClose={() => setSelectedInvoice(null)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 selection:bg-primary/20">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Superadmin Financial Governance</span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-text-primary tracking-tight">
            Subscription Monitoring
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Monitor recurring subscriptions, view tenant billing statements, audit 18% GST tax breakdown, and issue official invoices across all clinics.
          </p>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-border bg-surface shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Active Subscriptions
            </span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-heading font-extrabold text-text-primary font-mono">
            {invoices.length}
          </div>
          <p className="text-[11px] text-text-muted mt-1">
            Tenants with verified database-backed subscriptions
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-surface shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Total Invoiced Volume
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-heading font-extrabold text-emerald-500 font-mono">
            ₹{totalVolume.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-text-muted mt-1">
            Gross subscription revenue across all clinic tenants
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-surface shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              GST Collected (18%)
            </span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-heading font-extrabold text-primary font-mono">
            ₹{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-text-muted mt-1">
            Statutory tax (CGST 9% + SGST 9%) for electronic filing
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl border border-border bg-surface/70 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-96 relative">
          <Input
            placeholder="Search by clinic, subdomain, or invoice #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="sm"
            leftIcon={<Search className="w-4 h-4 text-text-muted" />}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="w-36">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              size="sm"
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'PAID', label: 'Paid' },
                { value: 'PENDING', label: 'Pending' },
              ]}
            />
          </div>

          <div className="w-44">
            <Select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              size="sm"
              options={[
                { value: 'ALL', label: 'All Plans' },
                { value: 'STARTER', label: 'Starter Practice' },
                { value: 'PRO', label: 'Professional Center' },
                { value: 'ENTERPRISE', label: 'Hospital Network' },
              ]}
            />
          </div>

          {(search || statusFilter !== 'ALL' || planFilter !== 'ALL') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('')
                setStatusFilter('ALL')
                setPlanFilter('ALL')
              }}
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Subscription Invoices Table */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="p-16 text-center rounded-3xl border border-dashed border-border bg-surface text-center space-y-3">
          <Receipt className="w-12 h-12 text-text-muted mx-auto" />
          <h3 className="font-heading font-bold text-lg text-text-primary">
            No Subscription Invoices Found
          </h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            {search || statusFilter !== 'ALL' || planFilter !== 'ALL'
              ? 'No subscription invoices match your active filters. Try adjusting your search query.'
              : 'Subscription invoices are automatically generated when clinic registrations are approved or renewed.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-soft">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg/70 border-b border-border text-[11px] uppercase tracking-wider font-semibold text-text-secondary">
              <tr>
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Clinic / Tenant</th>
                <th className="py-3.5 px-4">Operating Plan</th>
                <th className="py-3.5 px-4">Billing Period</th>
                <th className="py-3.5 px-4 text-right">Base Value</th>
                <th className="py-3.5 px-4 text-right">CGST (9%)</th>
                <th className="py-3.5 px-4 text-right">SGST (9%)</th>
                <th className="py-3.5 px-4 text-right">Total (INR)</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredInvoices.map((inv) => {
                const cgst = Number(inv.cgstAmount || 0)
                const sgst = Number(inv.sgstAmount || 0)
                const base = Number(inv.baseAmount || 0)
                const total = Number(inv.totalAmount || 0)

                return (
                  <tr
                    key={inv.id}
                    className="hover:bg-border/20 transition-colors cursor-pointer group"
                    onClick={() => setSelectedInvoice(inv)}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-primary whitespace-nowrap">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-text-primary">
                        {inv.tenant?.name || 'Unnamed Clinic'}
                      </div>
                      <div className="text-[11px] text-text-muted font-mono">
                        {inv.tenant?.subdomain}.clinic.io
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                        {inv.plan?.name ||
                          inv.tenant?.planRelation?.name ||
                          'Standard'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-text-secondary whitespace-nowrap font-mono text-[11px]">
                      {inv.periodStart
                        ? new Date(inv.periodStart).toLocaleDateString('en-IN')
                        : 'N/A'}{' '}
                      -{' '}
                      {inv.periodEnd
                        ? new Date(inv.periodEnd).toLocaleDateString('en-IN')
                        : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-text-secondary whitespace-nowrap">
                      ₹{base.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-text-secondary whitespace-nowrap">
                      ₹{cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-text-secondary whitespace-nowrap">
                      ₹{sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-extrabold text-text-primary whitespace-nowrap">
                      ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <Badge
                        variant={inv.status === 'PAID' ? 'success' : 'warning'}
                        size="sm"
                        dot
                      >
                        {inv.status}
                      </Badge>
                    </td>
                    <td
                      className="py-3.5 px-4 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="text-[11px] h-7 px-2.5"
                          onClick={() => setSelectedInvoice(inv)}
                          leftIcon={<Eye className="w-3 h-3 text-primary" />}
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[11px] h-7 px-2"
                          onClick={() => handleQuickPrint(inv)}
                          title="Print Subscription Invoice"
                        >
                          <Printer className="w-3 h-3 text-text-secondary" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default SubscriptionMonitoringPage
