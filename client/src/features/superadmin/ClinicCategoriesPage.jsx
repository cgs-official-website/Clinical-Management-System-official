import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  FolderTree,
  Plus,
  Shield,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Settings,
  Search,
  Building2,
  Layers,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react'
import { api } from '../../lib/api'
import { DataTable } from '../../components/ui/DataTable'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Input } from '../../components/ui/Input'
import { notify } from '../../components/ui/Toast'

const MODULE_OPTIONS = [
  'patients',
  'appointments',
  'prescriptions',
  'billing',
  'inventory',
  'staff',
  'roles',
  'reports',
  'clinical_config',
  'settings',
]

const ACTION_OPTIONS = ['view', 'create', 'edit', 'delete', 'export', 'approve']

export const ClinicCategoriesPage = () => {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [categoryToDelete, setCategoryToDelete] = useState(null)

  // Template editor modal state
  const [selectedCategoryForTemplates, setSelectedCategoryForTemplates] = useState(null)
  const [templatesList, setTemplatesList] = useState([])
  const [newTemplateRow, setNewTemplateRow] = useState({
    roleName: '',
    module: 'patients',
    action: 'view',
  })

  // Form state for category create/edit
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  })

  // Fetch categories
  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['superadmin', 'clinic-categories'],
    queryFn: async () => {
      const res = await api.get('/api/superadmin/clinic-categories')
      return res.data?.data || []
    },
  })

  // Fetch templates for selected category
  const { isLoading: isTemplatesLoading } = useQuery({
    queryKey: ['superadmin', 'clinic-category-templates', selectedCategoryForTemplates?.id],
    queryFn: async () => {
      if (!selectedCategoryForTemplates?.id) return []
      const res = await api.get(
        `/api/superadmin/clinic-categories/${selectedCategoryForTemplates.id}/role-templates`
      )
      const list = res.data?.templates || res.data?.data || []
      setTemplatesList(list)
      return list
    },
    enabled: !!selectedCategoryForTemplates?.id,
  })

  // Create / Update Category Mutation
  const saveCategoryMutation = useMutation({
    mutationFn: async (payload) => {
      if (editingCategory) {
        const res = await api.put(`/api/superadmin/clinic-categories/${editingCategory.id}`, payload)
        return res.data
      } else {
        const res = await api.post('/api/superadmin/clinic-categories', payload)
        return res.data
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'clinic-categories'] })
      setIsCategoryModalOpen(false)
      setEditingCategory(null)
      setFormData({ name: '', description: '', isActive: true })
      notify.success(
        editingCategory
          ? 'Clinic category updated successfully!'
          : 'New clinic category created successfully!'
      )
    },
    onError: (err) => {
      notify.error(err.response?.data?.error?.message || err.message || 'Failed to save clinic category.')
    },
  })

  // Delete Category Mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/api/superadmin/clinic-categories/${id}`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'clinic-categories'] })
      setCategoryToDelete(null)
      notify.success('Clinic category removed successfully.')
    },
    onError: (err) => {
      notify.error(err.response?.data?.error?.message || err.message || 'Failed to delete category.')
    },
  })

  // Save Templates Mutation
  const saveTemplatesMutation = useMutation({
    mutationFn: async ({ categoryId, templates }) => {
      const res = await api.post(
        `/api/superadmin/clinic-categories/${categoryId}/role-templates`,
        { templates }
      )
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'clinic-categories'] })
      queryClient.invalidateQueries({
        queryKey: ['superadmin', 'clinic-category-templates', selectedCategoryForTemplates?.id],
      })
      notify.success('Default role templates updated successfully!')
      setSelectedCategoryForTemplates(null)
    },
    onError: (err) => {
      notify.error(err.response?.data?.error?.message || 'Failed to update role templates.')
    },
  })

  const openCreateModal = () => {
    setEditingCategory(null)
    setFormData({ name: '', description: '', isActive: true })
    setIsCategoryModalOpen(true)
  }

  const openEditModal = (cat) => {
    setEditingCategory(cat)
    setFormData({
      name: cat.name,
      description: cat.description || '',
      isActive: cat.isActive !== false,
    })
    setIsCategoryModalOpen(true)
  }

  const openTemplatesModal = (cat) => {
    setSelectedCategoryForTemplates(cat)
    setTemplatesList([])
    setNewTemplateRow({ roleName: '', module: 'patients', action: 'view' })
  }

  const handleAddTemplateRow = () => {
    if (!newTemplateRow.roleName.trim()) {
      notify.error('Please enter a role name (e.g. Dentist, Radiologist).')
      return
    }

    const exists = templatesList.some(
      (t) =>
        t.roleName.toLowerCase() === newTemplateRow.roleName.trim().toLowerCase() &&
        t.module === newTemplateRow.module &&
        t.action === newTemplateRow.action
    )

    if (exists) {
      notify.error('This role and permission mapping already exists in the list.')
      return
    }

    setTemplatesList([
      ...templatesList,
      {
        roleName: newTemplateRow.roleName.trim(),
        module: newTemplateRow.module,
        action: newTemplateRow.action,
      },
    ])

    // keep roleName so admin can quickly add more permissions to the same role
    notify.info(`Added permission to "${newTemplateRow.roleName.trim()}"`)
  }

  const handleRemoveTemplateRow = (index) => {
    const next = [...templatesList]
    next.splice(index, 1)
    setTemplatesList(next)
  }

  const categories = categoriesData || []
  const filtered = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    {
      key: 'name',
      label: 'Category Name',
      sortable: true,
      render: (val, row) => (
        <div>
          <div className="font-bold text-text-primary text-xs flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-primary" />
            <span>{val}</span>
          </div>
          <div className="text-[11px] text-text-secondary mt-0.5 line-clamp-1">
            {row.description || 'No description provided'}
          </div>
        </div>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (val) => (
        <Badge variant={val ? 'success' : 'neutral'} size="sm" dot>
          {val ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'roleTemplatesCount',
      label: 'Starter Role Templates',
      render: (val) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-border text-xs font-mono text-text-primary font-semibold">
          <Layers className="w-3 h-3 text-primary" />
          <span>{val} rules</span>
        </span>
      ),
    },
    {
      key: 'tenantsCount',
      label: 'Clinics Using',
      render: (val) => (
        <span className="text-xs text-text-secondary font-medium">
          {val} {val === 1 ? 'clinic' : 'clinics'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="text-xs py-1 px-2.5 flex items-center gap-1.5 hover:border-primary/50"
            onClick={() => openTemplatesModal(row)}
          >
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span>Configure Roles</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs p-1.5 text-text-secondary hover:text-text-primary"
            onClick={() => openEditModal(row)}
            title="Edit Category"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs p-1.5 text-danger hover:bg-danger/10"
            onClick={() => setCategoryToDelete(row)}
            title="Delete Category"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  // Group templates by roleName for the modal preview
  const groupedTemplates = templatesList.reduce((acc, curr) => {
    if (!acc[curr.roleName]) acc[curr.roleName] = []
    acc[curr.roleName].push(curr)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-surface/80 border border-border/80 backdrop-blur-md shadow-soft">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <FolderTree className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-text-primary tracking-tight">
              Clinic Categories & Role Blueprints
            </h1>
          </div>
          <p className="text-xs text-text-secondary">
            Manage specialty categories. Approved clinics automatically inherit tailored default roles matching their category.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          className="flex items-center gap-2 shadow-sm flex-shrink-0"
          onClick={openCreateModal}
        >
          <Plus className="w-4 h-4" />
          <span>New Clinic Category</span>
        </Button>
      </div>

      {/* Categories Table */}
      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        searchPlaceholder="Search categories by name or description..."
        searchValue={search}
        onSearchChange={setSearch}
        emptyTitle="No clinic categories configured"
        emptyDescription="Create a clinic category above to enable category-specific starter roles during clinic approvals."
      />

      {/* Category Create/Edit Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={editingCategory ? 'Edit Clinic Category' : 'Create Clinic Category'}
        description="Categories determine which starter roles are automatically provisioned upon Superadmin approval."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            saveCategoryMutation.mutate(formData)
          }}
          className="space-y-4 pt-2"
        >
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1.5">
              Category Name <span className="text-danger">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Dental Clinic, Diagnostic Center, Ophthalmology Center"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1.5">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full text-xs rounded-xl border border-border bg-bg/60 p-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Brief description of clinical facility type and operational scope..."
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="isCatActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-primary rounded border-border focus:ring-primary/30"
            />
            <label htmlFor="isCatActive" className="text-xs font-medium text-text-primary cursor-pointer">
              Active Category (visible on public clinic registration dropdown)
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCategoryModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={saveCategoryMutation.isPending}
            >
              {saveCategoryMutation.isPending ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Role Templates Configuration Modal */}
      <Modal
        isOpen={!!selectedCategoryForTemplates}
        onClose={() => setSelectedCategoryForTemplates(null)}
        title={`Role Templates: ${selectedCategoryForTemplates?.name || 'Category'}`}
        description="Define the default roles and module permissions auto-provisioned when a clinic of this category is approved."
        maxWidth="max-w-3xl"
      >
        <div className="space-y-5 pt-2">
          {/* Helper Banner */}
          <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 flex items-start gap-3 text-xs text-text-secondary">
            <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <p>
              When a clinic with category <strong>{selectedCategoryForTemplates?.name}</strong> is approved by Superadmin, all roles listed below will be automatically created and populated with these exact permissions for the tenant workspace.
            </p>
          </div>

          {/* Add New Template Mapping Form */}
          <div className="p-4 rounded-2xl bg-bg/80 border border-border/80 space-y-3">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Add Role & Permission Mapping
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <div className="sm:col-span-2">
                <Input
                  placeholder="Role Name (e.g. Dentist, Hygienist)"
                  value={newTemplateRow.roleName}
                  onChange={(e) => setNewTemplateRow({ ...newTemplateRow, roleName: e.target.value })}
                  size="sm"
                />
              </div>
              <div>
                <select
                  value={newTemplateRow.module}
                  onChange={(e) => setNewTemplateRow({ ...newTemplateRow, module: e.target.value })}
                  className="w-full text-xs h-9 rounded-xl border border-border bg-surface px-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {MODULE_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={newTemplateRow.action}
                  onChange={(e) => setNewTemplateRow({ ...newTemplateRow, action: e.target.value })}
                  className="w-full text-xs h-9 rounded-xl border border-border bg-surface px-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {ACTION_OPTIONS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs flex items-center gap-1.5"
                onClick={handleAddTemplateRow}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Mapping</span>
              </Button>
            </div>
          </div>

          {/* Role Groups Display */}
          <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
            <h4 className="text-xs font-bold text-text-primary flex items-center justify-between">
              <span>Configured Starter Roles ({Object.keys(groupedTemplates).length} roles, {templatesList.length} rules)</span>
            </h4>

            {Object.keys(groupedTemplates).length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-border text-xs text-text-secondary">
                No role templates defined yet. Add roles above to seed automatic starter roles for this category.
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(groupedTemplates).map(([role, items]) => (
                  <div
                    key={role}
                    className="p-3.5 rounded-2xl border border-border/80 bg-surface/90 shadow-sm space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-xs font-bold text-text-primary">{role}</span>
                        <span className="text-[10px] text-text-muted font-mono">
                          ({items.length} permissions)
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {items.map((perm, pIdx) => {
                        const globalIdx = templatesList.findIndex(
                          (t) =>
                            t.roleName === perm.roleName &&
                            t.module === perm.module &&
                            t.action === perm.action
                        )
                        return (
                          <span
                            key={pIdx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-bg text-[11px] font-mono text-text-secondary border border-border group"
                          >
                            <span>
                              {perm.module}.{perm.action}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveTemplateRow(globalIdx)}
                              className="text-text-muted hover:text-danger ml-1"
                              title="Remove permission"
                            >
                              &times;
                            </button>
                          </span>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <span className="text-[11px] text-text-muted">
              Changes will apply to future clinic registrations & approvals.
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCategoryForTemplates(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={saveTemplatesMutation.isPending}
                onClick={() =>
                  saveTemplatesMutation.mutate({
                    categoryId: selectedCategoryForTemplates.id,
                    templates: templatesList,
                  })
                }
              >
                {saveTemplatesMutation.isPending ? 'Saving...' : 'Save Role Templates'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={() => deleteCategoryMutation.mutate(categoryToDelete.id)}
        title="Delete Clinic Category"
        message={`Are you sure you want to delete the category "${categoryToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete Category"
        variant="danger"
        isLoading={deleteCategoryMutation.isPending}
      />
    </div>
  )
}

export default ClinicCategoriesPage
