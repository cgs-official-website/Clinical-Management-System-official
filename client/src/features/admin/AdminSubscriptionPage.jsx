import React, { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  CreditCard,
  FileText,
  Printer,
  Download,
  CheckCircle2,
  Calendar,
  Building2,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  Clock,
  Info,
  ChevronRight,
  ExternalLink,
  Eye,
} from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { Modal } from '../../components/ui/Modal'
import { notify } from '../../components/ui/Toast'
import { SubscriptionInvoiceDocument } from '../subscription/SubscriptionInvoiceDocument'

export const AdminSubscriptionPage = () => {
  const { user } = useAuth()
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [viewingInvoice, setViewingInvoice] = useState(null)
  const invoicePrintRef = useRef(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'subscription'],
    queryFn: async () => {
      const res = await api.get('/api/admin/subscription')
      return res.data?.data || res.data
    },
  })

  const { tenant, currentPlan, latestInvoice, invoices = [], companySettings } = data || {}

  // Default selected invoice to latest invoice
  useEffect(() => {
    if (latestInvoice && !selectedInvoice) {
      setSelectedInvoice(latestInvoice)
    }
  }, [latestInvoice, selectedInvoice])

  // Handle clean print
  const handlePrint = (invToPrint) => {
    const target = invToPrint || selectedInvoice || latestInvoice
    if (!target) return

    const clinicTitle = tenant?.name || user?.clinicName || 'Clinic'
    const originalTitle = document.title
    document.title = `${clinicTitle} - Subscription Invoice`

    window.print()

    setTimeout(() => {
      document.title = originalTitle
    }, 1000)
  }

  // Handle download document
  const handleDownload = (invToDownload) => {
    const target = invToDownload || selectedInvoice || latestInvoice
    if (!target) return

    const clinicTitle = tenant?.name || user?.clinicName || 'Clinic'
    const originalTitle = document.title
    document.title = `${clinicTitle} - Subscription Invoice - ${target.invoiceNumber}`

    notify.info('Opening print dialog to save invoice as PDF...')
    window.print()

    setTimeout(() => {
      document.title = originalTitle
    }, 1000)
  }

  // Handle viewing specific invoice details dynamically by ID/data
  const handleViewDetails = async (inv) => {
    if (!inv) return
    setSelectedInvoice(inv)
    setViewingInvoice(inv)

    // Dynamically fetch and synchronize authoritative invoice by ID if available
    if (inv.id) {
      try {
        const res = await api.get(`/api/admin/subscription/invoices/${inv.id}`)
        if (res.data?.data?.invoice) {
          const freshInv = res.data.data.invoice
          setSelectedInvoice(freshInv)
          setViewingInvoice(freshInv)
        }
      } catch (err) {
        // Fallback safely to already loaded invoice data
      }
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-44 w-full rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 rounded-3xl" />
          <Skeleton className="h-96 lg:col-span-2 rounded-3xl" />
        </div>
      </div>
    )
  }

  if (isError || !tenant) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 rounded-3xl border border-danger/30 bg-surface text-center space-y-4 shadow-soft">
        <div className="w-12 h-12 rounded-2xl bg-danger/10 text-danger flex items-center justify-center mx-auto">
          <Info className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Unable to Load Clinic Subscription</h2>
        <p className="text-xs text-text-secondary">
          Could not retrieve subscription details for your clinic. Please check your network connection or verify admin permissions.
        </p>
        <Button variant="primary" onClick={() => refetch()}>
          Retry Connection
        </Button>
      </div>
    )
  }

  const activeInv = selectedInvoice || latestInvoice
  const clinicDisplayName = tenant?.name || user?.clinicName || 'Clinic Practice'

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 selection:bg-primary/20 print:p-0 print:m-0 print:max-w-none print:w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5 print:hidden">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Practice Infrastructure</span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-text-primary tracking-tight">
            Subscription & Invoices
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Official Zuna Clinical ERP license, operational scale tier, and billing ledger for{' '}
            <span className="font-bold text-text-primary">{clinicDisplayName}</span>.
          </p>
        </div>

        {activeInv && (
          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handlePrint(activeInv)}
              leftIcon={<Printer className="w-4 h-4" />}
            >
              Print Invoice
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleDownload(activeInv)}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Download PDF
            </Button>
          </div>
        )}
      </div>

      {/* Top Card: Active Plan Summary */}
      <div className="p-6 sm:p-8 rounded-3xl border border-primary/25 bg-gradient-to-br from-surface via-surface to-primary/5 shadow-soft relative overflow-hidden print:hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center relative z-10">
          <div className="lg:col-span-2 space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Current Operational Tier
              </span>
              <Badge variant="success" size="sm" dot>
                {tenant.status === 'ACTIVE' || tenant.status === 'active' ? 'Active Subscription' : tenant.status}
              </Badge>
            </div>
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-text-primary">
              {currentPlan?.name || tenant.plan || 'Professional Center'}
            </h2>
            <p className="text-xs text-text-secondary max-w-md leading-relaxed">
              {currentPlan?.description ||
                'Full EHR, automated AI charting, multi-specialty workflows, and unlimited practitioner scalability.'}
            </p>
          </div>

          <div className="border-t sm:border-t-0 sm:border-l border-border/80 sm:pl-6 space-y-1">
            <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
              Subscription Fee
            </span>
            <div className="font-heading font-extrabold text-2xl text-primary">
              ₹{(currentPlan?.priceINR || activeInv?.baseAmount || 0).toLocaleString('en-IN')}
              <span className="text-xs font-medium text-text-secondary"> / month</span>
            </div>
            <div className="text-[11px] text-text-muted">
              +18% GST (CGST 9% + SGST 9%)
            </div>
          </div>

          <div className="border-t sm:border-t-0 sm:border-l border-border/80 sm:pl-6 space-y-1">
            <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
              Billing Cycle Period
            </span>
            <div className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>
                {activeInv?.periodStart ? new Date(activeInv.periodStart).toLocaleDateString('en-IN') : 'N/A'} -{' '}
                {activeInv?.periodEnd ? new Date(activeInv.periodEnd).toLocaleDateString('en-IN') : 'N/A'}
              </span>
            </div>
            <div className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Full Access Unlocked</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left = Invoices History, Right = Dynamic Rendered Invoice */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start print:block print:w-full print:m-0 print:p-0">
        {/* Invoices List Sidebar */}
        <div className="lg:col-span-4 rounded-3xl border border-border bg-surface p-5 shadow-soft space-y-4 print:hidden">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-heading font-bold text-sm text-text-primary flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span>Issued Invoices ({invoices.length})</span>
            </h3>
            <span className="text-[11px] text-text-muted">INR (₹)</span>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {invoices.map((inv) => {
              const isSelected = activeInv?.id === inv.id
              return (
                <div
                  key={inv.id}
                  onClick={() => setSelectedInvoice(inv)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col gap-1.5 ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-soft ring-2 ring-primary/20'
                      : 'border-border bg-surface hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-primary">{inv.invoiceNumber}</span>
                    <Badge variant={inv.status === 'PAID' ? 'success' : 'warning'} size="sm">
                      {inv.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-text-primary">{inv.plan?.name || currentPlan?.name}</span>
                    <span className="font-extrabold text-text-primary">
                      ₹{inv.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-text-muted pt-1 border-t border-border/50">
                    <span>{new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString('en-IN')}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewDetails(inv)
                      }}
                      className="text-primary hover:text-primary-hover font-semibold flex items-center gap-1 hover:underline transition-all py-1 px-2.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-xs active:scale-95"
                      title={`View details for invoice ${inv.invoiceNumber}`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Detailed Rendered Subscription Invoice View */}
        <div className={`lg:col-span-8 print:w-full print:max-w-none print:m-0 print:p-0 ${viewingInvoice ? 'print:hidden' : ''}`}>
          {activeInv ? (
            <SubscriptionInvoiceDocument
              invoice={activeInv}
              tenant={tenant}
              companySettings={companySettings}
              showActions={false}
            />
          ) : (
            <div className="p-12 rounded-3xl border border-border bg-surface text-center space-y-3">
              <FileText className="w-10 h-10 text-text-muted mx-auto" />
              <h3 className="font-heading font-bold text-base text-text-primary">No Invoice Selected</h3>
              <p className="text-xs text-text-secondary">Please select an invoice from the history ledger.</p>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Invoice Details Modal */}
      <Modal
        isOpen={!!viewingInvoice}
        onClose={() => setViewingInvoice(null)}
        maxWidth="max-w-4xl"
        title={`Subscription Invoice — ${viewingInvoice?.invoiceNumber || ''}`}
        description={`Official Zuna Clinical ERP operational scale license invoice for ${tenant?.name || 'Clinic Practice'}`}
      >
        {viewingInvoice && (
          <div className="space-y-4">
            <SubscriptionInvoiceDocument
              invoice={viewingInvoice}
              tenant={tenant}
              companySettings={companySettings}
              showActions={true}
              onClose={() => setViewingInvoice(null)}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}

export default AdminSubscriptionPage
