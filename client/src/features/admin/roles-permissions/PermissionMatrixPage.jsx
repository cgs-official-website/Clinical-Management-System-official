import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams, Link } from 'react-router-dom'
import {
  KeyRound,
  Shield,
  Save,
  CheckSquare,
  Square,
  RefreshCw,
  Sparkles,
  Users,
  Calendar,
  Pill,
  CreditCard,
  Boxes,
  BarChart3,
  Sliders,
  ShieldCheck,
  Check,
  AlertCircle,
  X,
  Info,
  SlidersHorizontal
} from 'lucide-react'
import { api } from '../../../lib/api'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { Skeleton } from '../../../components/ui/Skeleton'
import { notify } from '../../../components/ui/Toast'
import { useRoleSuggestionStore } from '../../../store/useRoleSuggestionStore'
import { useAuthStore } from '../../../store/useAuthStore'

// Helper map to render module icons
const ICON_MAP = {
  Users,
  Calendar,
  Pill,
  CreditCard,
  Boxes,
  Sparkles,
  BarChart3,
  KeyRound,
  ShieldCheck,
  Sliders
}

/**
 * Robust helper to map system module definitions to standard template keys:
 * 'patients', 'appointments', 'prescriptions', 'billing', 'inventory', 'reports', 'staff', 'clinical_config', 'roles'
 */
const getModuleKey = (mod) => {
  if (mod.key) return mod.key.toLowerCase()
  const route = (mod.route || '').toLowerCase()
  if (route.includes('patient')) return 'patients'
  if (route.includes('appointment')) return 'appointments'
  if (route.includes('prescription')) return 'prescriptions'
  if (route.includes('billing')) return 'billing'
  if (route.includes('inventory')) return 'inventory'
  if (route.includes('report')) return 'reports'
  if (route.includes('staff')) return 'staff'
  if (route.includes('clinical-config') || route.includes('clinical_config')) return 'clinical_config'
  if (route.includes('role')) return 'roles'
  if (route.includes('flow')) return 'patients'
  const name = (mod.name || '').toLowerCase()
  if (name.includes('patient')) return 'patients'
  if (name.includes('appointment')) return 'appointments'
  if (name.includes('prescription')) return 'prescriptions'
  if (name.includes('billing')) return 'billing'
  if (name.includes('inventory') || name.includes('pharmacy')) return 'inventory'
  if (name.includes('report') || name.includes('analytics')) return 'reports'
  if (name.includes('staff')) return 'staff'
  if (name.includes('config')) return 'clinical_config'
  if (name.includes('role')) return 'roles'
  return mod.id
}

export const PermissionMatrixPage = () => {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const roleIdParam = searchParams.get('roleId')
  const { user } = useAuthStore()
  const tenantId = user?.tenantId || user?.tenant?.id || user?.id

  const [selectedRoleId, setSelectedRoleId] = useState(roleIdParam || '')
  // Local role name state for suggestion query
  const [roleInputName, setRoleInputName] = useState('')

  // Matrix state: { [moduleId]: { can_view: boolean, can_create: boolean, can_edit: boolean, can_delete: boolean } }
  const [matrixState, setMatrixState] = useState({})

  // Zustand suggestion store
  const {
    matchedKeywords,
    suggestionStatus,
    suggestionMessage,
    isBannerVisible,
    applySuggestions,
    dismissBanner,
    resetSuggestions
  } = useRoleSuggestionStore()

  // 1. Fetch available roles (strictly tenant-scoped admin roles to prevent cross-tenant duplication)
  const { data: roleData, isLoading: isRolesLoading } = useQuery({
    queryKey: ['rbac', 'roles', tenantId],
    queryFn: async () => {
      try {
        const adminRes = await api.get(`/api/admin/roles${tenantId ? `?tenantId=${tenantId}` : ''}`)
        const adminRoles = adminRes.data?.roles || adminRes.data?.data || (Array.isArray(adminRes.data) ? adminRes.data : [])
        if (Array.isArray(adminRoles) && adminRoles.length > 0) return adminRoles
      } catch {}
      const res = await api.get(`/api/roles${tenantId ? `?tenantId=${tenantId}` : ''}`)
      return res.data?.roles || res.data?.data || []
    }
  })

  // 2. Fetch available modules
  const { data: moduleData, isLoading: isModulesLoading } = useQuery({
    queryKey: ['rbac', 'modules'],
    queryFn: async () => {
      const res = await api.get('/api/modules')
      return res.data?.modules || res.data?.data || []
    }
  })

  // Deduplicate roles by name so copied/duplicate roles never appear in the dropdown
  const roles = React.useMemo(() => {
    const rawList = Array.isArray(roleData) ? roleData : []
    const seen = new Set()
    const unique = []
    for (const r of rawList) {
      const nameKey = (r.name || '').toLowerCase().trim()
      if (nameKey && !seen.has(nameKey)) {
        seen.add(nameKey)
        unique.push(r)
      }
    }
    return unique
  }, [roleData])

  const modules = Array.isArray(moduleData) ? moduleData : []

  // Initialize selected role if empty
  useEffect(() => {
    if (!selectedRoleId && roles.length > 0) {
      setSelectedRoleId(roleIdParam || roles[0].id)
    }
  }, [roles, selectedRoleId, roleIdParam])

  const selectedRole = roles.find((r) => r.id === selectedRoleId)

  // Sync role input with selected role name whenever selected role changes
  useEffect(() => {
    if (selectedRole?.name) {
      setRoleInputName(selectedRole.name)
    }
  }, [selectedRole?.id, selectedRole?.name])

  // 3. Fetch permissions for the selected role
  const { data: permData, isLoading: isPermsLoading, refetch: refetchPerms } = useQuery({
    queryKey: ['rbac', 'role-permissions', selectedRoleId],
    queryFn: async () => {
      if (!selectedRoleId) return []
      const res = await api.get(`/api/permissions/${encodeURIComponent(selectedRoleId)}`)
      return res.data?.permissions || res.data?.data || []
    },
    enabled: !!selectedRoleId,
    staleTime: 0
  })

  // Synchronize permissions into local matrix editing state
  useEffect(() => {
    if (modules.length > 0) {
      const newMatrix = {}
      modules.forEach((mod) => {
        newMatrix[mod.id] = { can_view: false, can_create: false, can_edit: false, can_delete: false }
      })

      if (Array.isArray(permData)) {
        permData.forEach((p) => {
          if (newMatrix[p.module_id]) {
            newMatrix[p.module_id] = {
              can_view: Boolean(p.can_view),
              can_create: Boolean(p.can_create ?? p.can_edit), // default create to edit if unset
              can_edit: Boolean(p.can_edit),
              can_delete: Boolean(p.can_delete)
            }
          }
        })
      }
      setMatrixState(newMatrix)
    }
  }, [permData, modules])

  // TanStack Query Mutation: Auto-Suggest Permissions
  const suggestMutation = useMutation({
    mutationFn: async (roleNameToAnalyze) => {
      const res = await api.get(`/api/admin/roles/suggest-permissions?roleName=${encodeURIComponent(roleNameToAnalyze)}`)
      return res.data?.data || res.data
    },
    onSuccess: (data) => {
      applySuggestions(data)
      const suggestedPerms = data.permissions || []

      if (suggestedPerms.length > 0) {
        // Auto-check returned modules/actions in existing checkbox grid state
        setMatrixState((prev) => {
          const next = { ...prev }
          modules.forEach((mod) => {
            const modKey = getModuleKey(mod)
            const current = next[mod.id] || { can_view: false, can_create: false, can_edit: false, can_delete: false }
            const updated = { ...current }

            suggestedPerms.forEach((sp) => {
              const spMod = (sp.module || '').toLowerCase().trim()
              const spAct = (sp.action || '').toLowerCase().trim()

              // Handle exact module key match or wildcards
              const matchesModule = spMod === modKey || spMod === '*' || spMod === 'all' || (spMod === 'invoices' && modKey === 'billing')

              if (matchesModule) {
                if (spAct === 'view' || spAct === '*') updated.can_view = true
                if (spAct === 'create' || spAct === '*') updated.can_create = true
                if (spAct === 'edit' || spAct === '*') updated.can_edit = true
                if (spAct === 'delete' || spAct === '*') updated.can_delete = true
              }
            })

            // Automatically ensure view is granted if create, edit or delete are enabled
            if (updated.can_create || updated.can_edit || updated.can_delete) {
              updated.can_view = true
            }

            next[mod.id] = updated
          })
          return next
        })

        if (data.matchedKeywords && data.matchedKeywords.length > 0) {
          notify.success(`Auto-suggested permissions for keywords: ${data.matchedKeywords.join(', ')}`)
        }
      } else {
        notify.info('No matching template found. Please select permissions manually.')
      }
    },
    onError: (err) => {
      notify.error(err.response?.data?.message || 'Failed to auto-suggest permissions.')
    }
  })

  // Bulk save mutation: saves to POST /api/admin/roles/:id/permissions
  const saveMutation = useMutation({
    mutationFn: async ({ roleId, permissionsPayload, permissionCodes }) => {
      // POST to /api/admin/roles/:id/permissions
      try {
        await api.post(`/api/admin/roles/${roleId}/permissions`, { permissions: permissionCodes })
      } catch (err) {
        // Also fallback to PUT if needed
        try {
          await api.put(`/api/admin/roles/${roleId}/permissions`, { permissions: permissionCodes })
        } catch {}
      }
      // Keep in-memory / dynamic modules store in sync
      const res = await api.post('/api/permissions', { roleId, permissions: permissionsPayload })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbac', 'role-permissions'] })
      queryClient.invalidateQueries({ queryKey: ['rbac', 'roles'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] })

      // Broadcast live update across tabs
      try {
        const channel = new BroadcastChannel('clinic_permissions_channel')
        channel.postMessage({ type: 'ROLE_PERMISSIONS_UPDATED', roleId: selectedRoleId })
        channel.close()
      } catch {}
      localStorage.setItem('rbac_permission_update_ts', String(Date.now()))

      notify.success(`Permissions for role "${selectedRole?.name || 'Selected Role'}" saved successfully!`)
    },
    onError: (err) => {
      notify.error(err.response?.data?.message || 'Failed to save role permissions.')
    }
  })

  // Checkbox toggle handler
  const handleToggle = (moduleId, actionKey) => {
    setMatrixState((prev) => {
      const current = prev[moduleId] || { can_view: false, can_create: false, can_edit: false, can_delete: false }
      const updated = { ...current, [actionKey]: !current[actionKey] }

      // If granting create, edit or delete, automatically ensure view is enabled
      if ((actionKey === 'can_create' || actionKey === 'can_edit' || actionKey === 'can_delete') && updated[actionKey]) {
        updated.can_view = true
      }
      // If revoking view, automatically revoke create, edit and delete
      if (actionKey === 'can_view' && !updated.can_view) {
        updated.can_create = false
        updated.can_edit = false
        updated.can_delete = false
      }

      return { ...prev, [moduleId]: updated }
    })
  }

  // Quick Bulk helpers
  const handleGrantAll = () => {
    const updated = {}
    modules.forEach((m) => {
      updated[m.id] = { can_view: true, can_create: true, can_edit: true, can_delete: true }
    })
    setMatrixState(updated)
  }

  const handleGrantAllView = () => {
    const updated = {}
    modules.forEach((m) => {
      const current = matrixState[m.id] || {}
      updated[m.id] = { ...current, can_view: true }
    })
    setMatrixState(updated)
  }

  const handleClearAll = () => {
    const updated = {}
    modules.forEach((m) => {
      updated[m.id] = { can_view: false, can_create: false, can_edit: false, can_delete: false }
    })
    setMatrixState(updated)
  }

  const handleSuggestClick = () => {
    const nameToSuggest = roleInputName.trim() || selectedRole?.name || ''
    if (!nameToSuggest) {
      notify.error('Please enter a role name to suggest permissions.')
      return
    }
    suggestMutation.mutate(nameToSuggest)
  }

  const handleSave = () => {
    const permissionCodes = []
    const permissionsPayload = Object.entries(matrixState).map(([moduleId, flags]) => {
      const mod = modules.find((m) => m.id === moduleId)
      const modKey = mod ? getModuleKey(mod) : moduleId
      if (flags.can_view) permissionCodes.push(`${modKey}.view`)
      if (flags.can_create) permissionCodes.push(`${modKey}.create`)
      if (flags.can_edit) permissionCodes.push(`${modKey}.edit`)
      if (flags.can_delete) permissionCodes.push(`${modKey}.delete`)

      return {
        moduleId,
        can_view: flags.can_view,
        can_create: flags.can_create,
        can_edit: flags.can_edit,
        can_delete: flags.can_delete
      }
    })

    saveMutation.mutate({
      roleId: selectedRoleId,
      permissionsPayload,
      permissionCodes
    })
  }

  const isGlobalLoading = isRolesLoading || isModulesLoading

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-text-primary">
              Role & Module Permission Matrix
            </h1>
            <Badge variant="primary" size="sm" dot>
              RBAC Auto-Suggest
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Configure dynamic module visibility and actions (View, Create, Edit, Delete) for each clinical role.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetchPerms()}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            isLoading={saveMutation.isPending}
            leftIcon={<Save className="w-4 h-4" />}
            className="shadow-sm"
          >
            Save Permissions
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-surface/50 border border-border rounded-2xl w-fit overflow-x-auto max-w-full">
        <Link
          to="/app/admin/roles"
          className="px-3 py-1.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface text-xs font-semibold transition-colors shrink-0"
        >
          Roles Directory
        </Link>
        <Link
          to="/app/admin/roles/matrix"
          className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold transition-all shadow-xs shrink-0"
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
          className="px-3 py-1.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface text-xs font-semibold transition-colors shrink-0 flex items-center gap-1.5"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
          <span>Keyword Templates</span>
        </Link>
      </div>

      {/* Auto-Suggestion & Role Selector Panel */}
      <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-border space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Role Selector */}
          <div className="md:col-span-5">
            <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">
              Select Role to Configure
            </label>
            <select
              value={selectedRoleId}
              onChange={(e) => {
                setSelectedRoleId(e.target.value)
                setSearchParams({ roleId: e.target.value })
                resetSuggestions()
              }}
              disabled={isRolesLoading}
              className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} {r.description ? `(${r.description})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Auto-Suggest Role Name Input & Button */}
          <div className="md:col-span-7">
            <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider flex items-center justify-between">
              <span>Rule-Based Permission Suggestion Engine</span>
              <span className="text-[10px] text-text-muted font-normal lowercase">offline matching</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={roleInputName}
                  onChange={(e) => setRoleInputName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSuggestClick()}
                  placeholder="e.g. Senior Nurse, Attending Physician, Billing Officer..."
                  className="w-full px-3.5 py-2 text-sm bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium pr-8"
                />
                {roleInputName && (
                  <button
                    type="button"
                    onClick={() => setRoleInputName('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={handleSuggestClick}
                isLoading={suggestMutation.isPending}
                leftIcon={<Sparkles className="w-4 h-4 text-amber-300" />}
                className="shrink-0 font-bold shadow-soft"
              >
                Suggest Permissions
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Bulk Action Buttons */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-border/60">
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="ghost" size="xs" onClick={handleGrantAllView} leftIcon={<CheckSquare className="w-3.5 h-3.5 text-primary" />}>
              Allow All View
            </Button>
            <Button variant="ghost" size="xs" onClick={handleGrantAll} leftIcon={<Sparkles className="w-3.5 h-3.5 text-emerald-500" />}>
              Grant All (View/Create/Edit/Del)
            </Button>
            <Button variant="ghost" size="xs" onClick={handleClearAll} leftIcon={<Square className="w-3.5 h-3.5 text-danger" />}>
              Revoke All
            </Button>
          </div>

          <span className="text-[11px] text-text-muted">
            Suggestions only pre-check; manual edits are always preserved.
          </span>
        </div>
      </div>

      {/* Suggestion Info Banner */}
      {isBannerVisible && (
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 shadow-soft ${
            suggestionStatus === 'suggested'
              ? 'bg-primary/10 border-primary/30 text-text-primary'
              : 'bg-amber-500/10 border-amber-500/30 text-text-primary'
          }`}
        >
          <div className="flex items-start gap-3">
            {suggestionStatus === 'suggested' ? (
              <div className="w-7 h-7 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle className="w-4 h-4" />
              </div>
            )}

            <div>
              <div className="font-bold text-xs sm:text-sm text-text-primary flex items-center gap-2 flex-wrap">
                <span>{suggestionMessage}</span>
                {matchedKeywords.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-text-secondary font-normal">Matched personas:</span>
                    {matchedKeywords.map((kw) => (
                      <span
                        key={kw}
                        className="px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold bg-primary/20 text-primary border border-primary/30 shadow-xs"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-[11px] text-text-secondary mt-0.5">
                {suggestionStatus === 'suggested'
                  ? 'Relevant modules and action checkboxes were auto-selected below. You may fine-tune any privilege before saving.'
                  : 'You can configure custom keyword rules anytime in the Keyword Templates settings tab.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={dismissBanner}
            className="text-text-muted hover:text-text-primary p-1 rounded-lg transition-colors shrink-0"
            title="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Permissions Matrix Table */}
      <div className="glass-panel rounded-2xl border border-border overflow-hidden shadow-soft">
        <div className="p-4 border-b border-border flex items-center justify-between bg-surface/50">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-primary" />
            <h2 className="font-heading font-bold text-sm text-text-primary">
              Module Access Matrix for: <span className="text-primary font-extrabold">{selectedRole?.name || 'Selected Role'}</span>
            </h2>
          </div>
          <span className="text-xs text-text-muted">
            {modules.length} Clinical Modules Configured
          </span>
        </div>

        {isGlobalLoading || isPermsLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface/70 text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                  <th className="py-3 px-4 sm:px-6">Module Name & Route</th>
                  <th className="py-3 px-3 text-center w-24 sm:w-28">View</th>
                  <th className="py-3 px-3 text-center w-24 sm:w-28">Create</th>
                  <th className="py-3 px-3 text-center w-24 sm:w-28">Edit</th>
                  <th className="py-3 px-3 text-center w-24 sm:w-28">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {modules.map((mod) => {
                  const flags = matrixState[mod.id] || { can_view: false, can_create: false, can_edit: false, can_delete: false }
                  const IconComp = ICON_MAP[mod.icon] || Boxes
                  const modKey = getModuleKey(mod)

                  return (
                    <tr
                      key={mod.id}
                      className={`hover:bg-primary/5 transition-colors ${
                        flags.can_view ? 'bg-surface/30' : 'bg-surface/10 opacity-70'
                      }`}
                    >
                      {/* Module Info */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                              flags.can_view
                                ? 'bg-primary/10 border-primary/20 text-primary'
                                : 'bg-surface border-border text-text-muted'
                            }`}
                          >
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-text-primary text-sm flex items-center gap-2">
                              <span>{mod.name}</span>
                              {flags.can_view && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                  Active
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-mono text-text-secondary">
                              {modKey} &bull; {mod.route}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* View Checkbox */}
                      <td className="py-3.5 px-3 text-center">
                        <label className="inline-flex items-center justify-center p-2 rounded-xl hover:bg-surface cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={flags.can_view}
                            onChange={() => handleToggle(mod.id, 'can_view')}
                            className="w-4 h-4 rounded text-primary border-border focus:ring-primary/20 cursor-pointer"
                          />
                        </label>
                      </td>

                      {/* Create Checkbox */}
                      <td className="py-3.5 px-3 text-center">
                        <label className="inline-flex items-center justify-center p-2 rounded-xl hover:bg-surface cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={flags.can_create}
                            onChange={() => handleToggle(mod.id, 'can_create')}
                            className="w-4 h-4 rounded text-blue-600 border-border focus:ring-blue-500/20 cursor-pointer"
                          />
                        </label>
                      </td>

                      {/* Edit Checkbox */}
                      <td className="py-3.5 px-3 text-center">
                        <label className="inline-flex items-center justify-center p-2 rounded-xl hover:bg-surface cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={flags.can_edit}
                            onChange={() => handleToggle(mod.id, 'can_edit')}
                            className="w-4 h-4 rounded text-emerald-600 border-border focus:ring-emerald-500/20 cursor-pointer"
                          />
                        </label>
                      </td>

                      {/* Delete Checkbox */}
                      <td className="py-3.5 px-3 text-center">
                        <label className="inline-flex items-center justify-center p-2 rounded-xl hover:bg-surface cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={flags.can_delete}
                            onChange={() => handleToggle(mod.id, 'can_delete')}
                            className="w-4 h-4 rounded text-danger border-border focus:ring-danger/20 cursor-pointer"
                          />
                        </label>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom Save Bar */}
        <div className="p-4 border-t border-border bg-surface/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-secondary">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-primary shrink-0" />
            <span>
              Persisting updates via <code className="font-mono text-primary font-semibold">POST /api/admin/roles/:id/permissions</code> invalidates Redis sessions dynamically.
            </span>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            isLoading={saveMutation.isPending}
            leftIcon={<Save className="w-4 h-4" />}
            className="w-full sm:w-auto shadow-sm"
          >
            Save Permissions
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PermissionMatrixPage
