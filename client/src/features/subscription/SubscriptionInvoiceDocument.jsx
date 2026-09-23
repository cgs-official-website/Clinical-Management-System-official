import React, { useRef } from 'react'
import {
  Building2,
  ShieldCheck,
  Printer,
  Download,
  BadgeAlert,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { notify } from '../../components/ui/Toast'

export const SubscriptionInvoiceDocument = ({
  invoice,
  tenant,
  companySettings,
  showActions = true,
  onClose = null,
}) => {
  const invoicePrintRef = useRef(null)

  if (!invoice) return null

  const clinicDisplayName =
    tenant?.name || invoice.tenant?.name || 'Clinic Practice'

  // Handle clean print
  const handlePrint = () => {
    const originalTitle = document.title
    document.title = `${clinicDisplayName} - Subscription Invoice`
    window.print()
    setTimeout(() => {
      document.title = originalTitle
    }, 1000)
  }

  // Handle download document (via browser PDF print)
  const handleDownload = () => {
    const originalTitle = document.title
    document.title = `${clinicDisplayName} - Subscription Invoice - ${invoice.invoiceNumber}`
    notify.info('Opening print dialog to save invoice as PDF...')
    window.print()
    setTimeout(() => {
      document.title = originalTitle
    }, 1000)
  }

  const baseVal = Number(invoice.baseAmount || 0)
  const cgstVal = Number(invoice.cgstAmount || 0)
  const sgstVal = Number(invoice.sgstAmount || 0)
  const igstVal = Number(invoice.igstAmount || 0)
  const totalVal = Number(invoice.totalAmount || 0)

  return (
    <div className="space-y-4">
      {/* Top Action Bar (hidden during window.print) */}
      {showActions && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-surface border border-border print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-primary">
              {invoice.invoiceNumber}
            </span>
            <Badge
              variant={invoice.status === 'PAID' ? 'success' : 'warning'}
              size="sm"
              dot
            >
              {invoice.status}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                Back / Close
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={handleDownload}
            >
              Download PDF
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Printer className="w-3.5 h-3.5" />}
              onClick={handlePrint}
            >
              Print Invoice
            </Button>
          </div>
        </div>
      )}

      {/* Master Invoice Document Container */}
      <div
        ref={invoicePrintRef}
        id="printable-subscription-invoice"
        className="rounded-3xl border border-border bg-surface p-6 sm:p-10 shadow-soft space-y-8 print:border-none print:shadow-none print:p-0 print:m-0"
      >
        {/* Invoice Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-border pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center p-1.5 text-primary">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                {/* DYNAMIC HOSPITAL NAME HEADING */}
                <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-text-primary tracking-tight">
                  {clinicDisplayName}
                </h2>
                <div className="text-xs font-bold tracking-widest text-primary uppercase">
                  SUBSCRIPTION INVOICE
                </div>
              </div>
            </div>
            <p className="text-xs text-text-secondary mt-1 max-w-sm">
              Clinical SaaS operating subscription for {clinicDisplayName}{' '}
              ({tenant?.subdomain || invoice.tenant?.subdomain}.clinic.io).
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <div className="font-mono font-bold text-sm sm:text-base text-primary">
              {invoice.invoiceNumber}
            </div>
            <div className="text-xs text-text-secondary">
              <span className="font-semibold text-text-primary">
                Invoice Date:{' '}
              </span>
              {new Date(
                invoice.invoiceDate || invoice.createdAt
              ).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
            <div className="text-xs text-text-secondary">
              <span className="font-semibold text-text-primary">Due Date: </span>
              {new Date(
                invoice.dueDate || invoice.createdAt
              ).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
            <div className="pt-1">
              <Badge
                variant={invoice.status === 'PAID' ? 'success' : 'warning'}
                size="sm"
                dot
              >
                Status: {invoice.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Billed To vs Provided By Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
          {/* Billed To (Client Hospital) */}
          <div className="p-5 rounded-2xl bg-surface/70 border border-border space-y-2">
            <div className="font-bold text-xs text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>Billed To (Clinic / Hospital)</span>
            </div>
            <div className="font-heading font-bold text-sm text-text-primary">
              {clinicDisplayName}
            </div>
            <div className="text-text-secondary leading-relaxed space-y-0.5">
              <div>
                Workspace:{' '}
                <span className="font-mono text-text-primary">
                  {tenant?.subdomain || invoice.tenant?.subdomain}.clinic.io
                </span>
              </div>
              <div>
                Contact Email:{' '}
                <span className="text-text-primary">
                  {tenant?.contactEmail ||
                    invoice.tenant?.contactEmail ||
                    'billing@clinic.io'}
                </span>
              </div>
              <div>
                Deployment Region:{' '}
                <span className="text-text-primary">
                  {tenant?.region ||
                    invoice.tenant?.region ||
                    'Asia / India (INR ₹)'}
                </span>
              </div>
              <div>
                Account Status:{' '}
                <span className="text-emerald-500 font-semibold uppercase">
                  {tenant?.status || invoice.tenant?.status || 'ACTIVE'}
                </span>
              </div>
            </div>
          </div>

          {/* Provided By (Zuna Legal SaaS Provider from Database Settings) */}
          <div className="p-5 rounded-2xl bg-surface/70 border border-border space-y-2">
            <div className="font-bold text-xs text-primary uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Provided By (Vendor / SaaS Issuer)</span>
            </div>
            <div className="font-heading font-bold text-sm text-text-primary">
              {companySettings?.legalCompanyName ||
                'Zuna Healthcare Technologies Private Limited'}
            </div>
            <div className="text-text-secondary leading-relaxed space-y-0.5">
              <div>
                Trade Name:{' '}
                <span className="text-text-primary font-semibold">
                  {companySettings?.tradeName || 'Zuna Clinical ERP'}
                </span>
              </div>
              <div>
                Address:{' '}
                <span>
                  {companySettings?.address || 'Outer Ring Road'},{' '}
                  {companySettings?.city || 'Bengaluru'},{' '}
                  {companySettings?.state || 'Karnataka'} -{' '}
                  {companySettings?.pincode || '560103'}
                </span>
              </div>
              <div>
                GSTIN:{' '}
                <span className="font-mono text-text-primary font-semibold">
                  {companySettings?.gstin || '29AAAAZ0000A1Z5'}
                </span>{' '}
                | PAN:{' '}
                <span className="font-mono text-text-primary">
                  {companySettings?.pan || 'AAAAZ0000A'}
                </span>
              </div>
              <div>
                CIN:{' '}
                <span className="font-mono text-text-primary">
                  {companySettings?.cin || 'U72200KA2026PTC123456'}
                </span>
              </div>
              <div>
                Support:{' '}
                <span>
                  {companySettings?.contactEmail || 'billing@zuna.io'} |{' '}
                  {companySettings?.phone || '+91 80 4567 8900'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Line Items Table */}
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b-2 border-border text-text-secondary uppercase tracking-wider font-semibold">
                  <th className="py-3 px-3">
                    Service & Operational Scale Description
                  </th>
                  <th className="py-3 px-3 text-center">SAC Code</th>
                  <th className="py-3 px-3 text-center">Billing Period</th>
                  <th className="py-3 px-3 text-right">Taxable Amount (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="py-4 px-3">
                    <div className="font-heading font-bold text-sm text-text-primary">
                      Zuna Clinical ERP —{' '}
                      {invoice.plan?.name ||
                        tenant?.planRelation?.name ||
                        invoice.tenant?.planRelation?.name ||
                        'Operational Scale'}{' '}
                      Plan
                    </div>
                    <div className="text-text-secondary text-[11px] mt-0.5">
                      Cloud deployment, automated zero-trust RBAC matrix, EHR
                      charting, and continuous compliance.
                    </div>
                  </td>
                  <td className="py-4 px-3 text-center font-mono text-text-primary">
                    {invoice.sacCode || companySettings?.sacCode || '998313'}
                  </td>
                  <td className="py-4 px-3 text-center text-text-secondary">
                    {invoice.periodStart
                      ? new Date(invoice.periodStart).toLocaleDateString('en-IN')
                      : 'N/A'}{' '}
                    to{' '}
                    {invoice.periodEnd
                      ? new Date(invoice.periodEnd).toLocaleDateString('en-IN')
                      : 'N/A'}
                  </td>
                  <td className="py-4 px-3 text-right font-mono font-bold text-text-primary text-sm">
                    ₹{baseVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tax Breakdown & Totals */}
          <div className="border-t border-border pt-4 flex flex-col sm:flex-row justify-between gap-6">
            {/* Amount in words & Remittance info */}
            <div className="space-y-3 max-w-sm text-xs">
              <div>
                <span className="font-bold text-text-secondary uppercase text-[10px] tracking-wider block mb-0.5">
                  Amount in Words:
                </span>
                <span className="font-semibold text-text-primary italic">
                  {invoice.amountInWords || 'Rupees In Words Calculated'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface/50 border border-border space-y-1">
                <span className="font-bold text-[10px] uppercase text-primary tracking-wider block">
                  Bank Remittance / Electronic Settlement
                </span>
                <div className="text-[11px] text-text-secondary space-y-0.5">
                  <div>
                    Bank:{' '}
                    <span className="font-semibold text-text-primary">
                      {companySettings?.bankName || 'HDFC Bank'}
                    </span>
                  </div>
                  <div>
                    A/C Name:{' '}
                    <span>
                      {companySettings?.accountName ||
                        'Zuna Healthcare Technologies Pvt Ltd'}
                    </span>
                  </div>
                  <div>
                    A/C Number:{' '}
                    <span className="font-mono text-text-primary font-semibold">
                      {companySettings?.accountNumber || '50200012345678'}
                    </span>
                  </div>
                  <div>
                    IFSC:{' '}
                    <span className="font-mono text-text-primary">
                      {companySettings?.ifsc || 'HDFC0001234'}
                    </span>
                  </div>
                  <div>
                    UPI ID:{' '}
                    <span className="font-mono text-primary font-bold">
                      {companySettings?.upiId || 'zunaerp@hdfcbank'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary calculations */}
            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between text-text-secondary">
                <span>Subtotal (Base Value):</span>
                <span className="font-mono font-semibold text-text-primary">
                  ₹{baseVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between text-text-secondary">
                <span>CGST (9.0%):</span>
                <span className="font-mono font-semibold text-text-primary">
                  ₹{cgstVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between text-text-secondary">
                <span>SGST (9.0%):</span>
                <span className="font-mono font-semibold text-text-primary">
                  ₹{sgstVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {igstVal > 0 && (
                <div className="flex justify-between text-text-secondary">
                  <span>IGST (18.0%):</span>
                  <span className="font-mono font-semibold text-text-primary">
                    ₹{igstVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              <div className="border-t-2 border-border pt-2 flex justify-between items-baseline">
                <span className="font-heading font-extrabold text-sm text-text-primary">
                  Total Invoice (INR):
                </span>
                <span className="font-heading font-extrabold text-lg text-primary">
                  ₹{totalVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="pt-2 text-[11px] text-text-muted flex justify-between">
                <span>Payment Method:</span>
                <span className="font-semibold text-text-primary">
                  {invoice.paymentMethod || 'Net Banking / Corporate Card / UPI'}
                </span>
              </div>
              {invoice.paymentReference && (
                <div className="text-[11px] text-text-muted flex justify-between">
                  <span>Txn Reference:</span>
                  <span className="font-mono text-text-primary">
                    {invoice.paymentReference}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Terms and Conditions Footer */}
        <div className="border-t border-border pt-6 text-[11px] text-text-secondary space-y-1.5">
          <span className="font-bold text-text-primary uppercase text-[10px] tracking-wider block">
            Terms & Conditions:
          </span>
          <p className="leading-relaxed">
            {companySettings?.invoiceTerms ||
              invoice.terms ||
              'Payment is due within 15 days of invoice issuance. Subscription automatically renews every 30 days unless canceled in writing 7 days prior to renewal.'}
          </p>
          <div className="text-[10px] text-text-muted pt-2 border-t border-border/50 flex flex-col sm:flex-row justify-between">
            <span>
              Authorized Digital Invoice Generated by Zuna Clinical ERP Cloud
              Gateway.
            </span>
            <span>
              Computer generated document. No physical signature required.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionInvoiceDocument
