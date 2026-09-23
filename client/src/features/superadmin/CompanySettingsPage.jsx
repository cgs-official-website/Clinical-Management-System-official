import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Building2,
  Landmark,
  FileText,
  Save,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'
import { api } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { notify } from '../../components/ui/Toast'
import { Skeleton } from '../../components/ui/Skeleton'

export const CompanySettingsPage = () => {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(null)

  // Fetch official Zuna company settings
  const { data, isLoading } = useQuery({
    queryKey: ['superadmin', 'company-settings'],
    queryFn: async () => {
      const res = await api.get('/api/superadmin/company-settings')
      return res.data?.data || res.data
    },
  })

  useEffect(() => {
    if (data) {
      setForm(data)
    }
  }, [data])

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.put('/api/superadmin/company-settings', payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'company-settings'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscription'] })
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'subscription-invoices'] })
      notify.success('Zuna organization & invoice billing profile saved!')
    },
    onError: (err) => {
      notify.error(
        err.response?.data?.error?.message ||
          err.response?.data?.error ||
          'Failed to update company settings.'
      )
    },
  })

  if (isLoading || !form) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    saveMutation.mutate(form)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 selection:bg-primary/20">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SaaS Provider Identity</span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-text-primary tracking-tight">
            Company / Legal Entity
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Maintain the official Zuna legal entity, corporate credentials, GSTIN, and electronic banking coordinates for subscription tax invoicing.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleSubmit}
          isLoading={saveMutation.isPending}
          leftIcon={<Save className="w-4 h-4" />}
        >
          Save Company Profile
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Corporate Legal Identity */}
        <div className="p-6 rounded-3xl border border-border bg-surface shadow-soft space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-primary">
                Corporate Legal Identity & Tax IDs
              </h2>
              <p className="text-[11px] text-text-secondary">
                Official entity name and tax identifiers printed on customer tax invoices
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Legal Company Name (Corporate Entity)"
              value={form.legalCompanyName || ''}
              onChange={(e) => setForm({ ...form, legalCompanyName: e.target.value })}
              required
              placeholder="e.g. Zuna Healthcare Technologies Private Limited"
            />
            <Input
              label="Trade / Brand Name"
              value={form.tradeName || ''}
              onChange={(e) => setForm({ ...form, tradeName: e.target.value })}
              required
              placeholder="e.g. Zuna Clinical ERP"
            />
            <Input
              label="GSTIN (15-character GST Number)"
              value={form.gstin || ''}
              onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
              required
              placeholder="e.g. 29AAAAZ0000A1Z5"
            />
            <Input
              label="PAN (Permanent Account Number)"
              value={form.pan || ''}
              onChange={(e) => setForm({ ...form, pan: e.target.value.toUpperCase() })}
              required
              placeholder="e.g. AAAAZ0000A"
            />
            <Input
              label="Corporate Identity Number (CIN)"
              value={form.cin || ''}
              onChange={(e) => setForm({ ...form, cin: e.target.value.toUpperCase() })}
              placeholder="e.g. U72200KA2026PTC123456"
            />
            <Input
              label="SAC Code (Software Services)"
              value={form.sacCode || ''}
              onChange={(e) => setForm({ ...form, sacCode: e.target.value })}
              required
              placeholder="e.g. 998313"
            />
          </div>
        </div>

        {/* Section 2: Registered Address & Communication */}
        <div className="p-6 rounded-3xl border border-border bg-surface shadow-soft space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-primary">
                Registered Office & Support Coordinates
              </h2>
              <p className="text-[11px] text-text-secondary">
                Physical headquarters address and billing contact info
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Registered Office Address"
                value={form.address || ''}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required
                placeholder="e.g. Building 4A, Tech Park, Outer Ring Road"
              />
            </div>
            <Input
              label="City"
              value={form.city || ''}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              required
              placeholder="e.g. Bengaluru"
            />
            <Input
              label="State"
              value={form.state || ''}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              required
              placeholder="e.g. Karnataka"
            />
            <Input
              label="Pincode / Postal Code"
              value={form.pincode || ''}
              onChange={(e) => setForm({ ...form, pincode: e.target.value })}
              required
              placeholder="e.g. 560103"
            />
            <Input
              label="Country"
              value={form.country || ''}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              required
              placeholder="e.g. India"
            />
            <Input
              label="Official Billing Email"
              type="email"
              value={form.contactEmail || ''}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              required
              placeholder="e.g. billing@zuna.io"
            />
            <Input
              label="Support Contact Phone"
              value={form.phone || ''}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="e.g. +91 80 4567 8900"
            />
            <div className="md:col-span-2">
              <Input
                label="Official SaaS Portal Website"
                value={form.website || ''}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="e.g. https://zuna.io"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Bank Remittance Coordinates */}
        <div className="p-6 rounded-3xl border border-border bg-surface shadow-soft space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-primary">
                Bank Remittance & Settlement Coordinates
              </h2>
              <p className="text-[11px] text-text-secondary">
                Bank account and UPI details displayed on invoices for clinic payment remittance
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Bank Name"
              value={form.bankName || ''}
              onChange={(e) => setForm({ ...form, bankName: e.target.value })}
              required
              placeholder="e.g. HDFC Bank"
            />
            <Input
              label="Account Beneficiary Name"
              value={form.accountName || ''}
              onChange={(e) => setForm({ ...form, accountName: e.target.value })}
              required
              placeholder="e.g. Zuna Healthcare Technologies Pvt Ltd"
            />
            <Input
              label="Corporate Account Number"
              value={form.accountNumber || ''}
              onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
              required
              placeholder="e.g. 50200012345678"
            />
            <Input
              label="Bank IFSC Code"
              value={form.ifsc || ''}
              onChange={(e) => setForm({ ...form, ifsc: e.target.value.toUpperCase() })}
              required
              placeholder="e.g. HDFC0001234"
            />
            <Input
              label="Bank Branch"
              value={form.branch || ''}
              onChange={(e) => setForm({ ...form, branch: e.target.value })}
              placeholder="e.g. Koramangala, Bengaluru"
            />
            <Input
              label="Corporate Virtual UPI ID"
              value={form.upiId || ''}
              onChange={(e) => setForm({ ...form, upiId: e.target.value })}
              placeholder="e.g. zunaerp@hdfcbank"
            />
          </div>
        </div>

        {/* Section 4: Invoicing Policy & Terms */}
        <div className="p-6 rounded-3xl border border-border bg-surface shadow-soft space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-primary">
                Invoice Terms & Remittance Policy
              </h2>
              <p className="text-[11px] text-text-secondary">
                Standard terms, conditions, and SLA reminders printed at the footer of each subscription invoice
              </p>
            </div>
          </div>

          <div>
            <textarea
              rows={3}
              value={form.invoiceTerms || ''}
              onChange={(e) => setForm({ ...form, invoiceTerms: e.target.value })}
              placeholder="Payment is due within 15 days of invoice issue. Subscription renews automatically every 30 days unless cancelled 7 days prior to billing cycle end."
              className="w-full text-xs rounded-xl border border-border bg-bg/60 p-3.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={saveMutation.isPending}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save All Company Configurations
          </Button>
        </div>
      </form>
    </div>
  )
}

export default CompanySettingsPage
