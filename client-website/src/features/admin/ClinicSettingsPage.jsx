import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Sliders,
  Building2,
  Shield,
  Bell,
  Sparkles,
  Save,
  Mail,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  Lock,
  Globe,
  Radio,
  FileText
} from 'lucide-react'
import { api } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { notify } from '../../components/ui/Toast'
import { useAuth } from '../../hooks/useAuth'

const DEFAULT_SETTINGS = {
  clinicName: '',
  subdomain: '',
  category: 'Cardiology',
  plan: 'Professional Health Center',
  contactEmail: '',
  contactPhone: '',
  address: '',
  timezone: 'Asia/Kolkata (IST)',
  sessionTimeoutMinutes: 30,
  enforceTwoFactor: false,
  enableSmsAlerts: true,
  enableEmailReceipts: true,
  allowTelehealth: true,
  aiDiagnosisAssist: true,
  autoInvoiceGeneration: true,
}

export const ClinicSettingsPage = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      try {
        const res = await api.get('/api/admin/settings')
        return res.data?.data || res.data
      } catch (err) {
        console.warn('Falling back to real clinic context:', err.message)
        return {
          ...DEFAULT_SETTINGS,
          clinicName: user?.clinicName || 'kmch',
          contactEmail: user?.email || '',
          contactPhone: user?.phone || '',
        }
      }
    },
    staleTime: 30000,
  })

  useEffect(() => {
    if (data) {
      setSettings((prev) => ({
        ...prev,
        ...data,
        clinicName: data.clinicName || user?.clinicName || prev.clinicName,
        contactEmail: data.contactEmail || user?.email || prev.contactEmail,
        contactPhone: data.contactPhone || user?.phone || prev.contactPhone,
      }))
    } else if (user) {
      setSettings((prev) => ({
        ...prev,
        clinicName: user.clinicName || prev.clinicName,
        contactEmail: user.email || prev.contactEmail,
        contactPhone: user.phone || prev.contactPhone,
      }))
    }
  }, [data, user])

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.put('/api/admin/settings', payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] })
      notify.success('Clinic settings saved successfully!')
    },
    onError: () => {
      notify.error('Failed to save clinic settings. Please try again.')
    },
  })

  const toggleToggle = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading font-extrabold text-2xl text-text-primary tracking-tight">
              Global Clinic Settings
            </h1>
            <Badge variant="teal" size="sm" className="font-semibold uppercase tracking-wider text-[11px]">
              {settings.category || 'Clinical Center'}
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Manage organization profile, facility preferences, patient automation & security rules
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => saveMutation.mutate(settings)}
            isLoading={saveMutation.isPending}
            leftIcon={<Save className="w-4 h-4" />}
            className="shadow-sm"
          >
            Save Configuration
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Clinic Profile & Facility Identity (2 spans) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Facility Profile Card */}
          <div className="p-6 rounded-2xl border border-border bg-surface shadow-soft space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-heading font-bold text-base text-text-primary flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                Clinic Profile & Contact Details
              </h3>
              <span className="text-xs text-text-secondary flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-text-muted" />
                {settings.subdomain ? `${settings.subdomain}.zuna.care` : 'zuna.care'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Clinic Legal Name"
                required
                placeholder="e.g. KMCH Medical Specialty Center"
                value={settings.clinicName || ''}
                onChange={(e) => setSettings({ ...settings, clinicName: e.target.value })}
              />

              <Input
                label="Administrative Contact Email"
                type="email"
                required
                placeholder="admin@clinic.org"
                value={settings.contactEmail || ''}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
              />

              <Input
                label="Direct Reception Phone"
                required
                placeholder="e.g. 1234567839 or +91 98765 43210"
                value={settings.contactPhone || ''}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
              />

              <Input
                label="Physical Facility Address"
                required
                placeholder="e.g. KMCH Campus, Avinashi Road, Coimbatore"
                value={settings.address || ''}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              />
            </div>
          </div>

          {/* Clinical Automation & AI Features */}
          <div className="p-6 rounded-2xl border border-border bg-surface shadow-soft space-y-5">
            <h3 className="font-heading font-bold text-base text-text-primary border-b border-border pb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Automated Clinical Workflows & AI Modules
            </h3>

            <div className="divide-y divide-border/60">
              {/* AI Diagnosis Assistant */}
              <div className="py-3.5 flex items-center justify-between">
                <div className="pr-4">
                  <div className="text-sm font-semibold text-text-primary flex items-center gap-2">
                    AI Clinical Diagnosis Assistant
                    <Badge variant="neutral" size="xs" className="text-[10px]">
                      Smart Copilot
                    </Badge>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Provides doctors with real-time differential diagnosis insights and medication interaction checks
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleToggle('aiDiagnosisAssist')}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                    settings.aiDiagnosisAssist ? 'bg-primary' : 'bg-border'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                      settings.aiDiagnosisAssist ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Telehealth */}
              <div className="py-3.5 flex items-center justify-between">
                <div className="pr-4">
                  <div className="text-sm font-semibold text-text-primary">
                    Telehealth Virtual Consultations
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Enable secure in-browser video visits, waiting rooms, and electronic remote vitals collection
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleToggle('allowTelehealth')}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                    settings.allowTelehealth ? 'bg-primary' : 'bg-border'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                      settings.allowTelehealth ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* SMS Reminders */}
              <div className="py-3.5 flex items-center justify-between">
                <div className="pr-4">
                  <div className="text-sm font-semibold text-text-primary flex items-center gap-2">
                    Automated Patient SMS Reminders
                    <Bell className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Dispatches automated SMS confirmation alerts 24 hours prior to appointment slot time
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleToggle('enableSmsAlerts')}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                    settings.enableSmsAlerts ? 'bg-primary' : 'bg-border'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                      settings.enableSmsAlerts ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Automatic Invoice Generation */}
              <div className="py-3.5 flex items-center justify-between">
                <div className="pr-4">
                  <div className="text-sm font-semibold text-text-primary">
                    Auto-Generate Invoices on Rx Completion
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Immediately prepares itemized billing line items whenever doctor signs off on patient prescription
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleToggle('autoInvoiceGeneration')}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                    settings.autoInvoiceGeneration ? 'bg-primary' : 'bg-border'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                      settings.autoInvoiceGeneration ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Security, Session & Tenant Info (1 span) */}
        <div className="space-y-6">
          {/* Security & Access Management */}
          <div className="p-6 rounded-2xl border border-border bg-surface shadow-soft space-y-5">
            <h3 className="font-heading font-bold text-base text-text-primary border-b border-border pb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Security & Access Control
            </h3>

            <div className="space-y-4">
              <Input
                label="Session Inactivity Timeout (Minutes)"
                type="number"
                min="5"
                max="240"
                value={settings.sessionTimeoutMinutes || 30}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    sessionTimeoutMinutes: parseInt(e.target.value) || 30,
                  })
                }
              />

              <div className="pt-2 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <div className="pr-2">
                    <span className="text-xs font-semibold text-text-primary block">
                      Enforce Staff 2FA
                    </span>
                    <span className="text-[11px] text-text-secondary block mt-0.5">
                      Require OTP verification for all clinical staff members
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleToggle('enforceTwoFactor')}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                      settings.enforceTwoFactor ? 'bg-primary' : 'bg-border'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                        settings.enforceTwoFactor ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Operational Scope Card */}
          <div className="p-6 rounded-2xl border border-border bg-surface shadow-soft space-y-4">
            <h3 className="font-heading font-bold text-base text-text-primary border-b border-border pb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Timezone & Regional Scope
            </h3>

            <div className="space-y-3">
              <label className="text-xs font-medium text-text-secondary block">
                Primary Facility Timezone
              </label>
              <select
                value={settings.timezone || 'America/New_York (UTC-5)'}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full text-xs bg-surface border border-border rounded-xl px-3 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST, UTC+5:30)</option>
                <option value="America/New_York (UTC-5)">America/New_York (UTC-5)</option>
                <option value="America/Los_Angeles (UTC-8)">America/Los_Angeles (UTC-8)</option>
                <option value="Europe/London (GMT)">Europe/London (GMT)</option>
                <option value="Asia/Dubai (GST)">Asia/Dubai (GST, UTC+4)</option>
                <option value="Asia/Singapore (SGT)">Asia/Singapore (SGT, UTC+8)</option>
              </select>

              <div className="p-3 rounded-xl bg-surface-subtle border border-border/80 text-[11px] text-text-secondary space-y-1">
                <div className="flex justify-between">
                  <span>Subscription Plan:</span>
                  <span className="font-semibold text-text-primary">{settings.plan || 'Professional'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Category Template:</span>
                  <span className="font-semibold text-primary">{settings.category || 'Specialty'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-semibold text-emerald-600">Active & Verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClinicSettingsPage
