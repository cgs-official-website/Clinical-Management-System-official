import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  SlidersHorizontal,
  Plus,
  Trash2,
  Edit2,
  RotateCcw,
  Sparkles,
  Search,
  Shield,
  CheckCircle2,
  Info,
  Layers,
  KeyRound
} from 'lucide-react'
import { api } from '../../../lib/api'
import { DataTable } from '../../../components/ui/DataTable'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { Modal } from '../../../components/ui/Modal'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { Input } from '../../../components/ui/Input'
import { notify } from '../../../components/ui/Toast'

const MODULE_OPTIONS = [
  { value: 'patients', label: 'Patients & EHR (patients)' },
  { value: 'appointments', label: 'Appointments & Scheduling (appointments)' },
  { value: 'prescriptions', label: 'Prescriptions & Notes (prescriptions)' },
  { value: 'billing', label: 'Billing & Invoices (billing)' },
  { value: 'inventory', label: 'Pharmacy & Inventory (inventory)' },
  { value: 'reports', label: 'Analytics & Reports (reports)' },
  { value: 'staff', label: 'Staff Management (staff)' },
  { value: 'clinical_config', label: 'Clinical Config (clinical_config)' },
  { value: 'roles', label: 'Roles & Security (roles)' },
  { value: '*', label: 'All Modules (*) - Wildcard' }
]

const ACTION_OPTIONS = [
  { value: 'view', label: 'View / Read' },
  { value: 'create', label: 'Create' },
  { value: 'edit', label: 'Edit / Update' },
  { value: 'delete', label: 'Delete' },
  { value: '*', label: 'All Actions (*) - Wildcard' }
]

export const RoleTemplatesPage = () => {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [templateToDelete, setTemplateToDelete] = useState(null)
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)

  const [formData, setFormData] = useState({
    keyword: '',
    module: 'patients',
    action: 'view',
    isWildcard: false
  })

  // Query templates for tenant
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'role-templates'],
    queryFn: async () => {
      const res = await api.get('/api/admin/roles/templates')
      return res.data?.data || res.data
    }
  })

  // Create or update template mutation
  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (editingTemplate && editingTemplate.isTenantCustom) {
        return api.put(`/api/admin/roles/templates/${editingTemplate.id}`, payload)
      } else {
        return api.post('/api/admin/roles/templates', payload)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'role-templates'] })
      setIsModalOpen(false)
      setEditingTemplate(null)
      setFormData({ keyword: '', module: 'patients', action: 'view', isWildcard: false })
      notify.success('Role template mapping saved successfully!')
    },
    onError: (err) => {
      notify.error(err.response?.data?.message || err.message || 'Failed to save template.')
    }
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/api/admin/roles/templates/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'role-templates'] })
      setTemplateToDelete(null)
      notify.success('Template mapping deleted successfully.')
    },
    onError: (err) => {
      notify.error(err.response?.data?.message || 'Failed to delete template.')
    }
  })

  // Reset mutation
  const resetMutation = useMutation({
    mutationFn: async () => {
      await api.post('/api/admin/roles/templates/reset')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'role-templates'] })
      setIsResetConfirmOpen(false)
      notify.success('Templates reset to global defaults.')
    },
    onError: (err) => {
      notify.error(err.response?.data?.message || 'Failed to reset templates.')
    }
  })

  // Combine templates: if tenant has custom templates, show them, else show global defaults
  const tenantTemplates = Array.isArray(data?.tenantTemplates) ? data.tenantTemplates : []
  const globalTemplates = Array.isArray(data?.globalTemplates) ? data.globalTemplates : []
  const isUsingCustom = Boolean(data?.isUsingCustom || tenantTemplates.length > 0)

  // Current active templates list
  const allTemplates = isUsingCustom ? tenantTemplates : globalTemplates

  const filteredTemplates = allTemplates.filter((t) => {
    const q = search.toLowerCase()
    return (
      (t.keyword || '').toLowerCase().includes(q) ||
      (t.module || '').toLowerCase().includes(q) ||
      (t.action || '').toLowerCase().includes(q)
    )
  })

  const openCreateModal = () => {
    setEditingTemplate(null)
    setFormData({ keyword: '', module: 'patients', action: 'view', isWildcard: false })
    setIsModalOpen(true)
  }

  const openEditModal = (tpl) => {
    setEditingTemplate(tpl)
    setFormData({
      keyword: tpl.keyword,
      module: tpl.module,
      action: tpl.action,
      isWildcard: Boolean(t.isWildcard)
    })
    setIsModalOpen(true)
  }

  const columns = [
    {
      key: 'keyword',
      label: 'Persona / Keyword',
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-primary/10 text-primary border border-primary/20">
            #{val}
          </span>
          {row.isWildcard && (
            <Badge variant="warning" size="xs">
              Wildcard
            </Badge>
          )}
        </div>
      )
    },
    {
      key: 'module',
      label: 'Target Module',
      sortable: true,
      render: (val) => (
        <span className="font-mono text-xs font-semibold text-text-primary">
          {val === '*' ? 'All Modules (*)' : val}
        </span>
      )
    },
    {
      key: 'action',
      label: 'Granted Action',
      sortable: true,
      render: (val) => {
        let colorClass = 'bg-primary/10 text-primary'
        if (val === 'view') colorClass = 'bg-blue-500/10 text-blue-500'
        if (val === 'create') colorClass = 'bg-emerald-500/10 text-emerald-500'
        if (val === 'edit') colorClass = 'bg-amber-500/10 text-amber-500'
        if (val === 'delete') colorClass = 'bg-rose-500/10 text-rose-500'
        if (val === '*') colorClass = 'bg-purple-500/10 text-purple-500 font-bold'

        return (
          <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono uppercase font-bold border border-current/20 ${colorClass}`}>
            {val}
          </span>
        )
      }
    },
    {
      key: 'scope',
      label: 'Scope & Origin',
      render: (_, row) => (
        <Badge variant={row.isTenantCustom ? 'primary' : 'neutral'} size="sm">
          {row.isTenantCustom ? 'Clinic Custom' : 'Global Default'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => openEditModal(row)}
            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
            title="Edit rule mapping"
          >
            Edit
          </Button>

          {row.isTenantCustom && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setTemplateToDelete(row)}
              className="text-danger hover:bg-danger/10"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              title="Delete custom mapping"
            >
              Delete
            </Button>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-text-primary">
              Role Suggestion Keyword Templates
            </h1>
            <Badge variant="primary" size="sm" dot>
              Extensibility Engine
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Customize deterministic keyword-to-permission mappings for your clinic's specialty personas and modifiers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isUsingCustom && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsResetConfirmOpen(true)}
              leftIcon={<RotateCcw className="w-3.5 h-3.5 text-text-secondary" />}
            >
              Reset to Defaults
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={openCreateModal}
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-sm"
          >
            Add Keyword Rule
          </Button>
        </div>
      </div>

      {/* Navigation Sub-tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto">
        <Link
          to="/app/admin/roles"
          className="px-3 py-1.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface text-xs font-semibold transition-colors shrink-0"
        >
          Roles List
        </Link>
        <Link
          to="/app/admin/roles/matrix"
          className="px-3 py-1.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface text-xs font-semibold transition-colors shrink-0"
        >
          Dynamic Permission Matrix
        </Link>
        <Link
          to="/app/admin/roles/assign"
          className="px-3 py-1.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface text-xs font-semibold transition-colors shrink-0"
        >
          Assign Staff & Preview
        </Link>
        <Link
          to="/app/admin/roles/staff-list"
          className="px-3 py-1.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface text-xs font-semibold transition-colors shrink-0"
        >
          Staff Entitlement Roster
        </Link>
        <Link
          to="/app/admin/roles/templates"
          className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold shadow-sm shrink-0 flex items-center gap-1.5"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-white" />
          <span>Keyword Templates</span>
        </Link>
      </div>

      {/* Explanation Guide Banner */}
      <div className="glass-panel p-4 rounded-2xl border border-border flex flex-col md:flex-row items-start gap-4">
        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-xs text-text-secondary">
          <div className="font-bold text-text-primary text-sm flex items-center gap-2">
            <span>Deterministic Matching Rules & Keyword Modifiers</span>
            {isUsingCustom ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary border border-primary/30">
                Clinic Custom Active
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface border border-border text-text-muted">
                System Global Defaults
              </span>
            )}
          </div>
          <p>
            When administrators create a role or click <strong>"Suggest Permissions"</strong> on the matrix, the matching engine performs a case-insensitive substring search across these keyword templates.
          </p>
          <p className="text-[11px]">
            &bull; Base personas (<code className="font-mono text-primary font-bold">doctor</code>, <code className="font-mono text-primary font-bold">nurse</code>, <code className="font-mono text-primary font-bold">receptionist</code>, <code className="font-mono text-primary font-bold">billing</code>) define primary module access.
            <br />
            &bull; Modifiers (<code className="font-mono text-primary font-bold">senior</code>, <code className="font-mono text-primary font-bold">head</code>, <code className="font-mono text-primary font-bold">chief</code>) automatically attach <code className="font-mono text-emerald-500 font-bold">.edit</code> permissions to all matched base modules.
          </p>
        </div>
      </div>

      {/* Template Data Table */}
      <DataTable
        columns={columns}
        data={filteredTemplates}
        isLoading={isLoading}
        searchPlaceholder="Search keyword rules by persona, module or action..."
        searchValue={search}
        onSearchChange={setSearch}
      />

      {/* Create / Edit Template Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTemplate ? 'Edit Keyword Rule' : 'Add Role Keyword Rule'}
        description="Define a keyword that auto-maps to a module action during role creation and matrix suggestions."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            saveMutation.mutate(formData)
          }}
          className="space-y-4"
        >
          <Input
            label="Keyword / Substring"
            required
            placeholder="e.g. surgeon, triage, pharmacist, billing"
            value={formData.keyword}
            onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
            helperText="Matches case-insensitively if this text appears anywhere in the role title."
          />

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">
              Target Module
            </label>
            <select
              value={formData.module}
              onChange={(e) => setFormData({ ...formData, module: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
            >
              {MODULE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">
              Granted Action
            </label>
            <select
              value={formData.action}
              onChange={(e) => setFormData({ ...formData, action: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isWildcard"
              checked={formData.isWildcard}
              onChange={(e) => setFormData({ ...formData, isWildcard: e.target.checked })}
              className="w-4 h-4 rounded text-primary border-border focus:ring-primary/20 cursor-pointer"
            />
            <label htmlFor="isWildcard" className="text-xs font-semibold text-text-primary cursor-pointer select-none">
              Mark as Wildcard Rule (grants all actions or applies across all modules)
            </label>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-border">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={saveMutation.isPending}
            >
              {editingTemplate ? 'Update Rule' : 'Save Rule'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!templateToDelete}
        onClose={() => setTemplateToDelete(null)}
        onConfirm={() => deleteMutation.mutate(templateToDelete.id)}
        isLoading={deleteMutation.isPending}
        title={`Delete Keyword Rule "#${templateToDelete?.keyword}"?`}
        message="This rule will no longer be considered when auto-suggesting permissions for clinical roles in your clinic."
        confirmText="Confirm Delete"
      />

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={() => resetMutation.mutate()}
        isLoading={resetMutation.isPending}
        title="Reset to Global Default Templates?"
        message="All custom keyword mappings created for your clinic will be removed, and your suggestions will revert to standard clinic personas."
        confirmText="Reset to Defaults"
      />
    </div>
  )
}

export default RoleTemplatesPage
