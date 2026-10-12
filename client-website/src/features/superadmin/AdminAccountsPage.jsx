import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserPlus, Key, ShieldCheck, Mail, ShieldAlert, Eye, Building2, User, Clock } from 'lucide-react'
import { api } from '../../lib/api'
import { DataTable } from '../../components/ui/DataTable'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { notify } from '../../components/ui/Toast'

export const AdminAccountsPage = () => {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    clinicId: 'clinic-1',
    clinicName: 'Aura Health Memorial',
    role: 'ADMIN',
  })

  const { data: adminData, isLoading } = useQuery({
    queryKey: ['superadmin', 'admins'],
    queryFn: async () => {
      const res = await api.get('/api/superadmin/admins')
      return res.data
    },
  })

  const { data: clinicData } = useQuery({
    queryKey: ['superadmin', 'clinics'],
    queryFn: async () => {
      const res = await api.get('/api/superadmin/clinics')
      return res.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/api/superadmin/admins', payload)
      return res.data
    },
    onSuccess: (newAdmin) => {
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'admins'] })
      setIsCreateOpen(false)
      notify.success(`Admin account created for ${newAdmin.name}!`)
    },
    onError: () => notify.error('Failed to create admin account.'),
  })

  const resetPasswordMutation = useMutation({
    mutationFn: async (id) => {
      await api.post('/api/auth/forgot-password', { adminId: id })
    },
    onSuccess: () => {
      notify.info('One-time password recovery link sent to administrator.')
    },
  })

  const admins = adminData?.admins || []
  const clinics = clinicData?.clinics || []

  const filteredAdmins = admins.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      a.clinicName.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    {
      key: 'name',
      label: 'Administrator',
      sortable: true,
      render: (val, row) => (
        <div>
          <div className="font-bold text-text-primary text-xs">{val}</div>
          <div className="text-[11px] text-text-secondary">{row.email}</div>
        </div>
      ),
    },
    {
      key: 'clinicName',
      label: 'Assigned Clinic Tenant',
      sortable: true,
      render: (val) => <span className="font-semibold text-xs">{val}</span>,
    },
    {
      key: 'twoFactorEnabled',
      label: '2FA Security',
      render: (val) => (
        <Badge variant={val ? 'success' : 'warning'} size="sm">
          {val ? 'Enforced' : 'Optional'}
        </Badge>
      ),
    },
    {
      key: 'lastLogin',
      label: 'Last Active',
      render: (val) => <span className="text-xs text-text-secondary">{val}</span>,
    },
    {
      key: 'status',
      label: 'Account Status',
      render: (val) => (
        <Badge variant={val === 'active' ? 'success' : 'neutral'} size="sm" dot>
          {val}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="xs"
            leftIcon={<Eye className="w-3 h-3 text-primary" />}
            onClick={() => setSelectedAdmin(row)}
          >
            Details
          </Button>
          <Button
            variant="secondary"
            size="xs"
            leftIcon={<Key className="w-3 h-3" />}
            onClick={() => resetPasswordMutation.mutate(row.id)}
            isLoading={resetPasswordMutation.isPending}
          >
            Reset Creds
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl text-text-primary">
            Clinic Administrator Accounts
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Manage authorized root administrators designated to oversee clinic workspaces
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          leftIcon={<UserPlus className="w-4 h-4" />}
        >
          Create Clinic Admin
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={filteredAdmins}
        isLoading={isLoading}
        searchPlaceholder="Search admins by name, email or clinic..."
        searchValue={search}
        onSearchChange={setSearch}
      />

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Provision Clinic Administrator"
        description="Grants organizational super-user permissions to manage clinic staff and permissions."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createMutation.mutate(formData)
          }}
          className="space-y-4"
        >
          <Input
            label="Full Name"
            required
            placeholder="Dr. Evelyn Vance"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <Input
            label="Work Email"
            type="email"
            required
            placeholder="e.vance@aurahealth.org"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          <Select
            label="Designated Clinic Workspace"
            value={formData.clinicId}
            onChange={(e) => {
              const selectedClinic = clinics.find((c) => c.id === e.target.value)
              setFormData({
                ...formData,
                clinicId: e.target.value,
                clinicName: selectedClinic ? selectedClinic.name : '',
              })
            }}
            options={clinics.map((c) => ({ value: c.id, label: c.name }))}
          />

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
              Provision Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Admin Details Modal */}
      <Modal
        isOpen={Boolean(selectedAdmin)}
        onClose={() => setSelectedAdmin(null)}
        title="Administrator Account Profile"
        description="Detailed credentials, permissions overview, and assigned clinic workspace."
        maxWidth="max-w-md"
      >
        {selectedAdmin && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20 shrink-0">
                {selectedAdmin.name?.charAt(0) || 'A'}
              </div>
              <div className="min-w-0">
                <h3 className="font-heading font-bold text-base text-text-primary truncate">
                  {selectedAdmin.name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="primary" size="sm">
                    {selectedAdmin.role || 'ADMIN'}
                  </Badge>
                  <Badge variant={selectedAdmin.status === 'active' ? 'success' : 'neutral'} size="sm" dot>
                    {selectedAdmin.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-text-muted uppercase">
                  Work Email Address
                </span>
                <div className="flex items-center gap-2 font-mono font-medium text-text-primary bg-bg px-3 py-2 rounded-xl border border-border">
                  <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="truncate">{selectedAdmin.email}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-text-muted uppercase">
                  Assigned Clinic Tenant
                </span>
                <div className="flex items-center gap-2 font-semibold text-text-primary bg-bg px-3 py-2 rounded-xl border border-border">
                  <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="truncate">{selectedAdmin.clinicName}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-surface border border-border">
                  <span className="text-[10px] font-bold text-text-muted uppercase block mb-1">
                    2FA Security
                  </span>
                  <Badge variant={selectedAdmin.twoFactorEnabled ? 'success' : 'warning'} size="sm">
                    {selectedAdmin.twoFactorEnabled ? 'Enforced' : 'Optional'}
                  </Badge>
                </div>

                <div className="p-3 rounded-xl bg-surface border border-border">
                  <span className="text-[10px] font-bold text-text-muted uppercase block mb-1">
                    Last Active
                  </span>
                  <span className="font-medium text-text-secondary">
                    {selectedAdmin.lastLogin || 'Recent'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedAdmin(null)}
              >
                Close
              </Button>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Key className="w-3.5 h-3.5" />}
                onClick={() => {
                  resetPasswordMutation.mutate(selectedAdmin.id)
                  setSelectedAdmin(null)
                }}
                isLoading={resetPasswordMutation.isPending}
              >
                Dispatch Reset Link
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default AdminAccountsPage
