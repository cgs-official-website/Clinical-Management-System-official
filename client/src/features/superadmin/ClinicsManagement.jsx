import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  ShieldAlert,
  CheckCircle,
  CheckCircle2,
  Trash2,
  Power,
  Clock,
  Building2,
  User,
  Mail,
  Sparkles,
  XCircle,
  ArrowRight,
  Radio,
  Eye,
  Phone,
  Globe,
} from 'lucide-react'
import { api } from '../../lib/api'
import { DataTable } from '../../components/ui/DataTable'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { notify } from '../../components/ui/Toast'

import { usePermissions } from '../../hooks/usePermissions'

export const ClinicsManagement = () => {
  const queryClient = useQueryClient()
  const { isSuperadmin } = usePermissions()
  const [activeTab, setActiveTab] = useState('active')
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [clinicToDelete, setClinicToDelete] = useState(null)
  const [selectedRegistration, setSelectedRegistration] = useState(null)
  const [rejectionModalTarget, setRejectionModalTarget] = useState(null)
  const [rejectionReasonText, setRejectionReasonText] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    plan: 'Professional',
    region: 'North America (East)',
    contactEmail: '',
    domain: '',
  })

  // Fetch clinics
  const { data, isLoading } = useQuery({
    queryKey: ['superadmin', 'clinics'],
    queryFn: async () => {
      const res = await api.get('/api/superadmin/clinics')
      return res.data
    },
    enabled: !!isSuperadmin,
    retry: (failureCount, error) => {
      if (error?.response?.status === 403) return false
      return failureCount < 2
    },
  })

  // Fetch pending registration requests
  const { data: pendingData, isLoading: isPendingLoading } = useQuery({
    queryKey: ['superadmin', 'pending-registrations'],
    queryFn: async () => {
      const res = await api.get('/api/superadmin/pending-registrations')
      return res.data
    },
    enabled: !!isSuperadmin,
    refetchInterval: isSuperadmin ? 5000 : false,
    retry: (failureCount, error) => {
      if (error?.response?.status === 403) return false
      return failureCount < 2
    },
  })

  // Real-time synchronization across open tabs/windows
  useEffect(() => {
    let channel = null
    try {
      channel = new BroadcastChannel('clinic_registration_channel')
      channel.onmessage = (event) => {
        if (event.data?.type === 'REGISTRATION_CREATED') {
          queryClient.invalidateQueries({ queryKey: ['superadmin', 'pending-registrations'] })
          queryClient.invalidateQueries({ queryKey: ['superadmin', 'clinics'] })
          queryClient.invalidateQueries({ queryKey: ['superadmin', 'kpis'] })
          notify.info(`New clinic registration received: ${event.data.clinicName || 'Pending Tenant'}`)
        }
      }
    } catch (e) {}

    const handleStorage = (e) => {
      if (e.key === 'clinic_last_created_registration' && e.newValue) {
        queryClient.invalidateQueries({ queryKey: ['superadmin', 'pending-registrations'] })
        queryClient.invalidateQueries({ queryKey: ['superadmin', 'clinics'] })
        queryClient.invalidateQueries({ queryKey: ['superadmin', 'kpis'] })
      }
    }
    window.addEventListener('storage', handleStorage)

    return () => {
      if (channel) channel.close()
      window.removeEventListener('storage', handleStorage)
    }
  }, [queryClient])

  // Approve pending registration mutation
  const approveMutation = useMutation({
    mutationFn: async (registrationId) => {
      const res = await api.patch(`/api/superadmin/clinics/${registrationId}/status`, {
        status: 'ACTIVE',
      }).catch(async () => {
        return api.post(`/api/superadmin/registrations/${registrationId}/approve`)
      })
      return { ...res.data, registrationId }
    },
    onSuccess: (resData) => {
      const regId = resData?.registrationId
      // 1. BroadcastChannel notification for zero-latency cross-tab sync
      try {
        const channel = new BroadcastChannel('clinic_registration_channel')
        channel.postMessage({
          type: 'REGISTRATION_APPROVED',
          registrationId: regId,
          clinic: resData?.clinic,
          user: resData?.user,
          tokens: resData?.tokens,
        })
        channel.close()
      } catch (e) {}

      // 2. LocalStorage beacon for cross-tab storage event
      try {
        localStorage.setItem(
          'clinic_last_approved_registration',
          JSON.stringify({
            registrationId: regId,
            timestamp: Date.now(),
            user: resData?.user,
            tokens: resData?.tokens,
          })
        )
      } catch (e) {}

      queryClient.invalidateQueries({ queryKey: ['superadmin', 'pending-registrations'] })
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'clinics'] })
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'kpis'] })
      setSelectedRegistration(null)
      notify.success(resData?.message || 'Clinic approved & provisioned successfully!')
    },
    onError: (err) => {
      notify.error(err.response?.data?.error?.message || err.response?.data?.error || 'Failed to approve registration request.')
    },
  })

  // Reject registration mutation (calls PATCH /api/superadmin/clinics/:id/status with { status: "REJECTED", rejection_reason })
  const rejectMutation = useMutation({
    mutationFn: async ({ id, rejectionReason }) => {
      const res = await api.patch(`/api/superadmin/clinics/${id}/status`, {
        status: 'REJECTED',
        rejection_reason: rejectionReason,
      }).catch(async () => {
        return api.post(`/api/superadmin/registrations/${id}/reject`, {
          reason: rejectionReason,
        })
      })
      return { ...res.data, id, rejectionReason }
    },
    onSuccess: (resData) => {
      const targetId = resData?.id
      const rejectionReason = resData?.rejectionReason

      // 1. BroadcastChannel notification for zero-latency cross-tab sync
      try {
        const channel = new BroadcastChannel('clinic_registration_channel')
        channel.postMessage({
          type: 'REGISTRATION_REJECTED',
          registrationId: targetId,
          status: 'rejected',
          rejectionReason,
          rejectedAt: new Date().toISOString(),
        })
        channel.close()
      } catch (e) {}

      // 2. LocalStorage beacon for cross-tab storage event
      try {
        localStorage.setItem(
          'clinic_last_rejected_registration',
          JSON.stringify({
            registrationId: targetId,
            timestamp: Date.now(),
            status: 'rejected',
            rejectionReason,
            rejectedAt: new Date().toISOString(),
          })
        )
      } catch (e) {}

      queryClient.invalidateQueries({ queryKey: ['superadmin', 'pending-registrations'] })
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'clinics'] })
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'kpis'] })
      setRejectionModalTarget(null)
      setRejectionReasonText('')
      if (selectedRegistration) setSelectedRegistration(null)
      notify.info('Clinic registration request rejected.')
    },
    onError: (err) => {
      notify.error(err.response?.data?.error?.message || err.message || 'Failed to reject registration.')
    },
  })

  // Create clinic mutation
  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/api/superadmin/clinics', payload)
      return res.data
    },
    onSuccess: (newClinic) => {
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'clinics'] })
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'kpis'] })
      setIsCreateOpen(false)
      setFormData({
        name: '',
        slug: '',
        plan: 'Professional',
        region: 'North America (East)',
        contactEmail: '',
        domain: '',
      })
      notify.success(`Tenant ${newClinic.name} successfully provisioned!`)
    },
    onError: () => notify.error('Failed to create clinic tenant.'),
  })

  // Toggle status (suspend / activate)
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const nextStatus = status === 'active' ? 'suspended' : 'active'
      const res = await api.put(`/api/superadmin/clinics/${id}`, { status: nextStatus })
      return res.data
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'clinics'] })
      notify.info(`Clinic tenant status updated to ${updated.status}.`)
    },
    onError: () => notify.error('Failed to update clinic status.'),
  })

  // Delete clinic mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/api/superadmin/clinics/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'clinics'] })
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'kpis'] })
      setClinicToDelete(null)
      notify.success('Clinic tenant decommissioned successfully.')
    },
    onError: () => notify.error('Failed to delete clinic tenant.'),
  })

  const clinics = data?.clinics || []
  const filteredClinics = clinics.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.contactEmail?.toLowerCase().includes(search.toLowerCase()) ||
      c.region?.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    {
      key: 'name',
      label: 'Clinic Name',
      sortable: true,
      render: (val, row) => (
        <div>
          <div className="font-bold text-text-primary text-xs">{val}</div>
          <div className="text-[11px] text-text-secondary">{row.domain}</div>
        </div>
      ),
    },
    {
      key: 'plan',
      label: 'Subscription Plan',
      render: (val) => (
        <Badge variant={val === 'Enterprise' ? 'primary' : 'neutral'} size="sm">
          {val}
        </Badge>
      ),
    },
    {
      key: 'region',
      label: 'Server Region',
      render: (val) => <span className="text-xs text-text-secondary">{val}</span>,
    },
    {
      key: 'patientsCount',
      label: 'Patients',
      sortable: true,
      render: (val) => <span className="font-semibold">{val.toLocaleString()}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <Badge variant={val === 'active' ? 'success' : 'danger'} size="sm" dot>
          {val}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          {row.status === 'pending' ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  approveMutation.mutate(row.id)
                }}
                className="px-2 py-1 text-xs font-semibold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors flex items-center gap-1"
                title="Approve Clinic"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Approve</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setRejectionModalTarget({ id: row.id, tenantId: row.id, clinicName: row.name })
                  setRejectionReasonText('')
                }}
                className="px-2 py-1 text-xs font-semibold rounded-lg border border-danger/40 text-danger hover:bg-danger/10 transition-colors flex items-center gap-1"
                title="Reject Clinic"
              >
                <XCircle className="w-3 h-3" />
                <span>Reject</span>
              </button>
            </>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation()
                statusMutation.mutate({ id: row.id, status: row.status })
              }}
              className="p-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-border/30 transition-colors"
              title={row.status === 'active' ? 'Suspend Tenant' : 'Reactivate Tenant'}
            >
              <Power className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setClinicToDelete(row)
            }}
            className="p-1.5 rounded-lg border border-border text-text-secondary hover:text-danger hover:bg-danger/10 transition-colors"
            title="Decommission Tenant"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ]

  const pendingList =
    pendingData?.registrations ||
    pendingData?.data?.registrations ||
    (Array.isArray(pendingData?.data) ? pendingData.data : []) ||
    (Array.isArray(pendingData) ? pendingData : [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl text-text-primary">
            Clinic Tenant Directory & Approvals
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Provision, monitor, approve incoming registrations, and configure hospital branches
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Provision New Clinic
        </Button>
      </div>

      {/* Directory vs Pending Approvals Tabs */}
      <div className="flex items-center gap-2 border-b border-border/70 pb-3">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'active'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-surface text-text-secondary hover:text-text-primary border border-border/80'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Active Clinic Tenants</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-mono">
            {clinics.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 relative ${
            activeTab === 'pending'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'bg-surface text-text-secondary hover:text-text-primary border border-border/80'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Approvals</span>
          {pendingList.length > 0 && (
            <span
              className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'pending'
                  ? 'bg-white text-amber-600'
                  : 'bg-amber-500 text-white animate-pulse'
              }`}
            >
              {pendingList.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'active' ? (
        <DataTable
          columns={columns}
          data={filteredClinics}
          isLoading={isLoading}
          searchPlaceholder="Filter clinics by name, region or email..."
          searchValue={search}
          onSearchChange={setSearch}
          emptyTitle="No clinic tenants found"
          emptyDescription="Create a new clinic tenant above to begin onboarding hospitals."
        />
      ) : (
        /* Pending Registration Approvals Queue */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Real-time verification queue ({pendingList.length} waiting approval)</span>
            </div>
            <span className="text-[11px] text-text-muted">
              Approvals immediately provision workspace and notify awaiting tenant
            </span>
          </div>

          {pendingList.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-surface/50">
              <CheckCircle2 className="w-12 h-12 text-emerald-500/70 mx-auto mb-3" />
              <h3 className="font-heading font-bold text-base text-text-primary">
                Queue is Clear!
              </h3>
              <p className="text-xs text-text-secondary mt-1">
                There are no clinic registrations awaiting verification at this time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingList.map((reg) => (
                <div
                  key={reg.id}
                  className="p-5 sm:p-6 rounded-2xl border border-border/90 bg-surface/85 backdrop-blur-md shadow-soft hover:border-primary/40 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="font-heading font-bold text-base sm:text-lg text-text-primary">
                        {reg.clinicName}
                      </h3>
                      <Badge variant="warning" size="sm" dot>
                        Awaiting Approval
                      </Badge>
                      <span className="text-xs font-mono text-primary bg-primary/10 px-2.5 py-0.5 rounded-md">
                        {reg.subdomain}.clinic.io
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                      <div className="flex items-center gap-2 text-text-secondary">
                        <User className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span className="truncate">
                          <strong className="text-text-primary">{reg.adminName}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-text-secondary">
                        <Mail className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span className="truncate font-mono">{reg.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-text-secondary">
                        <Building2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span>{reg.specialty || 'General Care'}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-text-muted pt-1">
                      <span>Plan: <strong className="text-text-secondary">{reg.plan}</strong></span>
                      <span>Region: <strong className="text-text-secondary">{reg.region}</strong></span>
                      <span>
                        Submitted:{' '}
                        {new Date(reg.submittedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="font-mono text-[10px] text-text-muted/80">Ref: {reg.id}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/60">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs font-semibold hover:border-primary/50 hover:text-primary transition-colors"
                      onClick={() => setSelectedRegistration(reg)}
                      leftIcon={<Eye className="w-3.5 h-3.5 text-primary" />}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger hover:bg-danger/10 text-xs"
                      onClick={() => {
                        setRejectionModalTarget(reg)
                        setRejectionReasonText('')
                      }}
                      disabled={rejectMutation.isPending || approveMutation.isPending}
                      leftIcon={<XCircle className="w-3.5 h-3.5" />}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      className="font-bold shadow-glow hover:shadow-glow/80 text-xs px-4"
                      onClick={() => approveMutation.mutate(reg.tenantId || reg.id)}
                      isLoading={
                        approveMutation.isPending &&
                        approveMutation.variables === (reg.tenantId || reg.id)
                      }
                      disabled={approveMutation.isPending}
                      leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    >
                      Approve & Provision
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Provision Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Provision Clinic Tenant"
        description="Allocate an isolated healthcare workspace with dedicated database partitions."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createMutation.mutate(formData)
          }}
          className="space-y-4"
        >
          <Input
            label="Clinic / Hospital Name"
            required
            placeholder="Mount Sinai Health Center"
            value={formData.name}
            onChange={(e) =>
              setFormData({
                ...formData,
                name: e.target.value,
                slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                domain: `${e.target.value.toLowerCase().replace(/\s+/g, '')}.clinic.io`,
              })
            }
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Tenant Slug"
              required
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            />
            <Select
              label="Subscription Tier"
              value={formData.plan}
              onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
              options={[
                { value: 'Starter', label: 'Starter Practice (₹24,999/mo)' },
                { value: 'Professional', label: 'Professional Clinic (₹59,999/mo)' },
                { value: 'Enterprise', label: 'Enterprise Network (Custom)' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Server Region"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              options={[
                { value: 'North America (East)', label: 'North America (East)' },
                { value: 'North America (West)', label: 'North America (West)' },
                { value: 'Europe (Central)', label: 'Europe (Frankfurt)' },
                { value: 'Asia (Singapore)', label: 'Asia Pacific (Singapore)' },
              ]}
            />
            <Input
              label="Primary Admin Email"
              type="email"
              required
              placeholder="admin@mountsinai.org"
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-border">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={createMutation.isPending}
            >
              Confirm & Provision
            </Button>
          </div>
        </form>
      </Modal>

      {/* Decommission Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!clinicToDelete}
        onClose={() => setClinicToDelete(null)}
        onConfirm={() => deleteMutation.mutate(clinicToDelete.id)}
        isLoading={deleteMutation.isPending}
        title={`Decommission ${clinicToDelete?.name}?`}
        message="This action will permanently suspend clinical staff access and archive electronic patient charts associated with this workspace."
        confirmText="Confirm Decommission"
      />

      {/* View Admin Details & Approval Modal */}
      <Modal
        isOpen={Boolean(selectedRegistration)}
        onClose={() => setSelectedRegistration(null)}
        title="Review Admin Onboarding Details"
        description="Verify administrator credentials, facility domain, and security authorization prior to granting approval."
        maxWidth="max-w-2xl"
      >
        {selectedRegistration && (
          <div className="space-y-5">
            {/* Top Status Banner */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-sm text-text-primary">
                      Awaiting Superadmin Authorization
                    </span>
                    <Badge variant="warning" size="sm" dot>
                      Pending Review
                    </Badge>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Application submitted on {new Date(selectedRegistration.submittedAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-surface border border-border text-text-secondary shrink-0">
                {selectedRegistration.id}
              </span>
            </div>

            {/* Section 1: Administrator Profile */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-primary" />
                <span>Designated Root Administrator Profile</span>
              </h4>

              <div className="p-4 rounded-2xl bg-surface border border-border/80 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="flex items-start gap-3 sm:col-span-2 pb-3 border-b border-border/60">
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base shadow-sm shrink-0 border border-primary/20">
                    {selectedRegistration.adminName?.charAt(0) || 'A'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-heading font-bold text-base text-text-primary truncate">
                      {selectedRegistration.adminName}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="primary" size="sm">
                        Clinic Director / Admin
                      </Badge>
                      <span className="text-xs text-text-secondary">Root Account Privilege</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-text-muted uppercase">
                    Work Email Address
                  </span>
                  <div className="flex items-center gap-2 text-xs font-mono font-medium text-text-primary bg-bg px-3 py-2 rounded-xl border border-border">
                    <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">{selectedRegistration.email}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-text-muted uppercase">
                    Direct Contact Phone
                  </span>
                  <div className="flex items-center gap-2 text-xs font-mono font-medium text-text-primary bg-bg px-3 py-2 rounded-xl border border-border">
                    <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{selectedRegistration.phone || '+91 (Not Specified)'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Clinic Tenant Configuration */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                <span>Clinic Facility & Infrastructure Details</span>
              </h4>

              <div className="p-4 rounded-2xl bg-surface border border-border/80 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2 space-y-1">
                  <span className="text-[11px] font-semibold text-text-muted uppercase">
                    Facility Name
                  </span>
                  <div className="text-sm font-bold text-text-primary flex items-center gap-2 bg-bg px-3 py-2 rounded-xl border border-border">
                    <Building2 className="w-4 h-4 text-primary shrink-0" />
                    <span className="truncate">{selectedRegistration.clinicName}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-text-muted uppercase">
                    Dedicated Workspace Subdomain
                  </span>
                  <div className="flex items-center gap-2 text-xs font-mono text-primary bg-primary/10 px-3 py-2 rounded-xl border border-primary/20">
                    <Globe className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{selectedRegistration.subdomain}.clinic.io</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-text-muted uppercase">
                    Clinic Category
                  </span>
                  <div className="text-xs font-medium text-text-primary bg-bg px-3 py-2 rounded-xl border border-border truncate">
                    {selectedRegistration.clinicCategoryName || selectedRegistration.clinicCategory?.name || selectedRegistration.specialty || 'General Care'}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-text-muted uppercase">
                    Subscription Tier
                  </span>
                  <div>
                    <Badge variant={selectedRegistration.plan === 'Enterprise' ? 'primary' : 'neutral'} size="md">
                      {selectedRegistration.plan || 'Professional'}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-text-muted uppercase">
                    Server Deployment Region
                  </span>
                  <div className="text-xs font-medium text-text-secondary bg-bg px-3 py-2 rounded-xl border border-border truncate">
                    {selectedRegistration.region || 'Asia / India (INR ₹)'}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Automated Workflow Info */}
            <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/15 space-y-2">
              <span className="text-xs font-bold text-primary flex items-center gap-2 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Automated Workflow Upon Approval</span>
              </span>
              <ul className="text-xs text-text-secondary space-y-1 list-disc list-inside">
                <li>Instantly provision isolated tenant database schemas and subdomains</li>
                <li>Activate Root Administrator account with full RBAC permissions</li>
                <li>Broadcast live authorization updates for zero-friction sign in</li>
              </ul>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-border flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedRegistration(null)}
              >
                Close
              </Button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-danger hover:bg-danger/10 text-xs"
                  onClick={() => {
                    setRejectionModalTarget(selectedRegistration)
                    setRejectionReasonText('')
                  }}
                  disabled={rejectMutation.isPending || approveMutation.isPending}
                  leftIcon={<XCircle className="w-3.5 h-3.5" />}
                >
                  Reject Request
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  className="font-bold shadow-glow hover:shadow-glow/80 text-xs px-5"
                  onClick={() => approveMutation.mutate(selectedRegistration.id)}
                  isLoading={
                    approveMutation.isPending &&
                    approveMutation.variables === selectedRegistration.id
                  }
                  disabled={approveMutation.isPending}
                  leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                >
                  Approve & Provision Workspace
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Rejection Reason Modal */}
      <Modal
        isOpen={!!rejectionModalTarget}
        onClose={() => setRejectionModalTarget(null)}
        title="Reject Clinic Registration"
        description={`Please provide a rejection reason for "${rejectionModalTarget?.clinicName || 'Clinic'}". This reason will be persisted and displayed to the registrant upon login.`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!rejectionReasonText.trim()) {
              notify.error('Please enter a rejection reason.')
              return
            }
            rejectMutation.mutate({
              id: rejectionModalTarget.tenantId || rejectionModalTarget.id,
              rejectionReason: rejectionReasonText.trim(),
            })
          }}
          className="space-y-4 pt-2"
        >
          <div className="p-3.5 rounded-2xl bg-danger/5 border border-danger/20 text-xs text-text-secondary flex items-start gap-2.5">
            <XCircle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-danger">Rejection Reason Required</p>
              <p className="mt-0.5 text-[11px]">
                The clinic administrator will see this explanation verbatim on their dedicated rejection screen, along with options to contact support or re-register.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1.5">
              Rejection Reason <span className="text-danger">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={rejectionReasonText}
              onChange={(e) => setRejectionReasonText(e.target.value)}
              placeholder="e.g. State medical council registration certificate not attached or invalid. Please re-submit with valid licensing credentials."
              className="w-full text-xs rounded-xl border border-border bg-bg/60 p-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-danger/30"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRejectionModalTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              isLoading={rejectMutation.isPending}
              disabled={!rejectionReasonText.trim() || rejectMutation.isPending}
            >
              Confirm Rejection
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default ClinicsManagement
