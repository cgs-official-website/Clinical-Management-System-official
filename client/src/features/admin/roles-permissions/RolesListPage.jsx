import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, KeyRound, Shield, Edit2, Trash2, Users, ArrowRight, Sparkles, SlidersHorizontal } from 'lucide-react'
import { api } from '../../../lib/api'
import { DataTable } from '../../../components/ui/DataTable'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { Modal } from '../../../components/ui/Modal'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { Input } from '../../../components/ui/Input'
import { Textarea } from '../../../components/ui/Textarea'
import { notify } from '../../../components/ui/Toast'
import { useAuthStore } from '../../../store/useAuthStore'

export const RolesListPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const tenantId = user?.tenantId || user?.tenant?.id || user?.id
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })
  const [suggestPreview, setSuggestPreview] = useState(null)

  const suggestMutation = useMutation({
    mutationFn: async (roleName) => {
      const res = await api.get(`/api/admin/roles/suggest-permissions?roleName=${encodeURIComponent(roleName)}`)
      return res.data?.data || res.data
    },
    onSuccess: (data) => {
      setSuggestPreview(data)
      if (data.matchedKeywords && data.matchedKeywords.length > 0) {
        notify.success(`Found template match: ${data.matchedKeywords.join(', ')} (${data.permissions?.length || 0} permissions)`)
      } else {
        notify.info('No matching keyword template found for this title.')
      }
    }
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'roles', tenantId],
    queryFn: async () => {
      const res = await api.get(`/api/admin/roles${tenantId ? `?tenantId=${tenantId}` : ''}`)
      return res.data
    },
    enabled: !!tenantId,
  })

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/api/admin/roles', payload)
      return res.data
    },
    onSuccess: (resData) => {
      const newRole = resData?.data || resData
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] })
      setIsCreateOpen(false)
      setFormData({ name: '', description: '' })
      notify.success(`Role "${newRole.name || 'New Role'}" created! Configure its permission matrix now.`)
      navigate(`/app/admin/roles/matrix?roleId=${newRole.id}`)
    },
    onError: () => notify.error('Failed to create role.'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/api/admin/roles/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] })
      setRoleToDelete(null)
      notify.success('Role deleted successfully.')
    },
    onError: () => notify.error('Failed to delete role.'),
  })

  const roles = data?.roles || (Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []))
  const filteredRoles = roles.filter(
    (r) =>
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    {
      key: 'name',
      label: 'Role Title & Identifier',
      sortable: true,
      render: (val, row) => (
        <div>
          <div className="font-bold text-text-primary text-xs flex items-center gap-2">
            <KeyRound className="w-3.5 h-3.5 text-primary" />
            <span>{val}</span>
          </div>
          <div className="text-[11px] text-text-secondary mt-0.5 line-clamp-1">
            {row.description}
          </div>
        </div>
      ),
    },
    {
      key: 'permissions',
      label: 'Privileges Count',
      render: (val) => (
        <Badge variant="primary" size="sm">
          {val?.length || 0} permissions
        </Badge>
      ),
    },
    {
      key: 'staffCount',
      label: 'Assigned Staff',
      sortable: true,
      render: (val) => (
        <span className="font-semibold text-xs text-text-primary">
          {val || 0} clinicians
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created Date',
      render: (val) => <span className="text-xs text-text-secondary">{val}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          <Link to={`/app/admin/roles/matrix?roleId=${row.id}`}>
            <Button variant="secondary" size="xs" rightIcon={<ArrowRight className="w-3 h-3" />}>
              Configure Matrix
            </Button>
          </Link>
          <button
            onClick={() => setRoleToDelete(row)}
            className="p-1.5 rounded-lg border border-border text-text-secondary hover:text-danger hover:bg-danger/10 transition-colors"
            title="Delete role"
            aria-label="Delete role"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Tab Navigation header for Roles & Permissions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl text-text-primary">
            Roles & Permission Management
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Configure role definitions, dynamic permission matrices, and staff assignments
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <Link to="/app/admin/roles/assign" className="w-full sm:w-auto">
            <Button variant="secondary" size="sm" leftIcon={<Users className="w-4 h-4" />} className="w-full sm:w-auto">
              Assign Staff
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="w-full sm:w-auto shrink-0 shadow-sm"
          >
            Create New Role
          </Button>
        </div>
      </div>

      {/* Quick navigation sub-tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto">
        <Link
          to="/app/admin/roles"
          className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold shadow-sm shrink-0"
        >
          Roles List
        </Link>
        <Link
          to="/app/admin/roles/matrix"
          className="px-3 py-1.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface text-xs font-semibold transition-colors shrink-0"
        >
          Permission Matrix Editor
        </Link>
        <Link
          to="/app/admin/roles/assign"
          className="px-3 py-1.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface text-xs font-semibold transition-colors shrink-0"
        >
          Assign Staff & Preview
        </Link>
        <Link
          to="/app/admin/roles/staff-list"
          className="px-3 py-1.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface text-xs font-semibold transition-colors"
        >
          Staff Entitlement Roster
        </Link>
        <Link
          to="/app/admin/roles/templates"
          className="px-3 py-1.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface text-xs font-semibold transition-colors shrink-0 flex items-center gap-1.5"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
          <span>Keyword Templates</span>
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={filteredRoles}
        isLoading={isLoading}
        searchPlaceholder="Search roles by title or description..."
        searchValue={search}
        onSearchChange={setSearch}
      />

      {/* Create Role Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false)
          setSuggestPreview(null)
        }}
        title="Define Clinical Role"
        description="Create a role. When left to default, permissions will be auto-suggested based on role name keywords."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createMutation.mutate({
              ...formData,
              permissions: suggestPreview?.permissionCodes || undefined
            })
          }}
          className="space-y-4"
        >
          <div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  label="Role Title"
                  required
                  placeholder="e.g. Senior Nurse, Physician, Billing Specialist"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value })
                    setSuggestPreview(null)
                  }}
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => {
                  if (formData.name?.trim()) {
                    suggestMutation.mutate(formData.name.trim())
                  } else {
                    notify.error('Please enter a role title first.')
                  }
                }}
                isLoading={suggestMutation.isPending}
                leftIcon={<Sparkles className="w-3.5 h-3.5 text-primary" />}
                className="mb-[2px] shrink-0"
              >
                Suggest
              </Button>
            </div>
          </div>

          {/* Suggestion Live Preview Badge Box */}
          {suggestPreview && (
            <div className="p-3 rounded-xl bg-surface border border-border text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-text-primary flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>Rule Suggestion Result</span>
                </span>
                <Badge variant={suggestPreview.permissions?.length > 0 ? 'primary' : 'neutral'} size="sm">
                  {suggestPreview.permissions?.length || 0} permissions
                </Badge>
              </div>

              {suggestPreview.matchedKeywords?.length > 0 ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-text-secondary">Matched:</span>
                  {suggestPreview.matchedKeywords.map((kw) => (
                    <span key={kw} className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-primary/20 text-primary border border-primary/30">
                      #{kw}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-amber-500">
                  No keywords matched. Standard empty permissions will be created for manual assignment.
                </p>
              )}
            </div>
          )}

          <Textarea
            label="Role Description"
            placeholder="Responsibilities and clinical context for this role (optional)..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-border">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => {
                setIsCreateOpen(false)
                setSuggestPreview(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={createMutation.isPending}
            >
              Create & Open Matrix
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!roleToDelete}
        onClose={() => setRoleToDelete(null)}
        onConfirm={() => deleteMutation.mutate(roleToDelete.id)}
        isLoading={deleteMutation.isPending}
        title={`Delete Role "${roleToDelete?.name}"?`}
        message="Deleting this role will immediately revoke all associated permissions from clinical staff currently assigned to this role."
        confirmText="Confirm Delete"
      />
    </div>
  )
}

export default RolesListPage
