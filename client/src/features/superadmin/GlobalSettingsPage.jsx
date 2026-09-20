import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Sliders, Shield, Save, Check } from 'lucide-react'
import { api } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { notify } from '../../components/ui/Toast'
import { Skeleton } from '../../components/ui/Skeleton'

export const GlobalSettingsPage = () => {
  const queryClient = useQueryClient()
  const [settings, setSettings] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['superadmin', 'settings'],
    queryFn: async () => {
      const res = await api.get('/api/superadmin/settings')
      return res.data
    },
  })

  useEffect(() => {
    if (data) {
      setSettings(data)
    }
  }, [data])

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.put('/api/superadmin/settings', payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'settings'] })
      notify.success('Global platform configurations committed!')
    },
    onError: () => notify.error('Failed to update system settings.'),
  })

  const toggleFeature = (flagKey) => {
    setSettings((prev) => ({
      ...prev,
      featureFlags: {
        ...prev.featureFlags,
        [flagKey]: !prev.featureFlags[flagKey],
      },
    }))
  }

  if (isLoading || !settings) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl text-text-primary">
            Global System Configurations
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Platform branding, security policies, and cluster-wide feature flags
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => saveMutation.mutate(settings)}
          isLoading={saveMutation.isPending}
          leftIcon={<Save className="w-4 h-4" />}
        >
          Save Configuration
        </Button>
      </div>

      {/* Security & Session Parameters */}
      <div className="p-6 rounded-2xl border border-border bg-surface shadow-soft space-y-5">
        <h3 className="font-heading font-bold text-base text-text-primary border-b border-border pb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Security & Session Management
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Platform Network Name"
            value={settings.platformName}
            onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
          />
          <Input
            label="Root Support Email"
            type="email"
            value={settings.supportEmail}
            onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Session Idle Timeout (Minutes)"
            type="number"
            value={settings.sessionTimeoutMinutes}
            onChange={(e) =>
              setSettings({ ...settings, sessionTimeoutMinutes: parseInt(e.target.value) || 30 })
            }
          />
          <div className="flex items-center gap-3 pt-6">
            <input
              type="checkbox"
              id="enforce2fa"
              checked={settings.enforceTwoFactor}
              onChange={(e) => setSettings({ ...settings, enforceTwoFactor: e.target.checked })}
              className="rounded border-border text-primary focus:ring-primary/30 w-4 h-4"
            />
            <label htmlFor="enforce2fa" className="text-xs font-semibold text-text-primary cursor-pointer">
              Enforce Multi-Factor Authentication (2FA) for All Admins
            </label>
          </div>
        </div>
      </div>

      {/* System-wide Feature Flags */}
      <div className="p-6 rounded-2xl border border-border bg-surface shadow-soft space-y-4">
        <h3 className="font-heading font-bold text-base text-text-primary border-b border-border pb-3 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-primary" />
          System Feature Toggles
        </h3>

        <div className="divide-y divide-border">
          {Object.entries(settings.featureFlags || {}).map(([key, enabled]) => (
            <div key={key} className="py-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-text-primary capitalize">
                  {key.replace(/([A-Z])/g, ' $1')}
                </div>
                <div className="text-[11px] text-text-secondary">
                  Runtime flag controlling module availability across tenant instances
                </div>
              </div>
              <button
                type="button"
                onClick={() => toggleFeature(key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  enabled ? 'bg-primary' : 'bg-border'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default GlobalSettingsPage
