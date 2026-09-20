import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Users, ShieldCheck, CheckCircle2, Save, Sparkles, Search, RefreshCw, AlertCircle } from 'lucide-react'
import { api } from '../../../lib/api'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { Avatar } from '../../../components/ui/Avatar'
import { notify } from '../../../components/ui/Toast'
import { Skeleton } from '../../../components/ui/Skeleton'
import { useAuthStore } from '../../../store/useAuthStore'

export const AssignStaffPage = () => {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [selectedStaffId, setSelectedStaffId] = useState(null)
  const [selectedRoleIds, setSelectedRoleIds] = useState([])
  const [staffSearch, setStaffSearch] = useState('')
  const [visibleStaffLimit, setVisibleStaffLimit] = useState(25)

  // 1. Fetch Staff with assigned roles
  const {
    data: staffData,
    isLoading: isStaffLoading,
    isError: isStaffError,
    error: staffError,
    refetch: refetchStaff,
  } = useQuery({
    queryKey: ['admin', 'staff', user?.tenantId || user?.id],
    queryFn: async () => {
      const res = await api.get('/api/admin/staff')
      return res.data
    },
    retry: 2,
    refetchOnMount: 'always',
    staleTime: 0,
  })

  // 2. Fetch Roles list
  const {
    data: roleData,
    isLoading: isRolesLoading,
    isError: isRolesError,
    error: roleError,
    refetch: refetchRoles,
  } = useQuery({
    queryKey: ['admin', 'roles', user?.tenantId || user?.tenant?.id || user?.id],
    queryFn: async () => {
      const tId = user?.tenantId || user?.tenant?.id || user?.id
      const res = await api.get(`/api/admin/roles${tId ? `?tenantId=${tId}` : ''}`)
      return res.data
    },
    retry: 2,
  })

  const staffList = staffData?.staff || (Array.isArray(staffData?.data) ? staffData.data : (Array.isArray(staffData) ? staffData : []))
  const roles = roleData?.roles || (Array.isArray(roleData?.data) ? roleData.data : (Array.isArray(roleData) ? roleData : []))

  // When clicking on a staff member, load their current roles
  const handleSelectStaff = (member) => {
    setSelectedStaffId(member.id)
    setSelectedRoleIds(member.roles || [])
  }

  // Toggle role in multi-select
  const toggleRoleSelection = (roleId) => {
    setSelectedRoleIds((prev) => {
      if (prev.includes(roleId)) {
        return prev.filter((r) => r !== roleId)
      } else {
        return [...prev, roleId]
      }
    })
  }

  // Compute live merged "effective permissions" preview from selected roles
  const effectivePermissionsPreview = useMemo(() => {
    const selectedRoles = roles.filter((r) => selectedRoleIds.includes(r.id))
    const merged = new Set(selectedRoles.flatMap((r) => r.permissions || []))
    return Array.from(merged).sort()
  }, [roles, selectedRoleIds])

  // Save staff assignment mutation
  const assignMutation = useMutation({
    mutationFn: async ({ staffId, roles }) => {
      const res = await api.put(`/api/admin/staff/${staffId}`, { roles })
      return res.data
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] })
      notify.success(`Role privileges committed for ${updated.name || 'staff member'}!`)
    },
    onError: () => notify.error('Failed to update staff roles.'),
  })

  const selectedStaffMember = staffList.find((s) => s.id === selectedStaffId)

  const filteredStaff = useMemo(() => {
    return staffList.filter(
      (s) =>
        (s.name || '').toLowerCase().includes(staffSearch.toLowerCase()) ||
        (s.email || '').toLowerCase().includes(staffSearch.toLowerCase()) ||
        (s.department || '').toLowerCase().includes(staffSearch.toLowerCase())
    )
  }, [staffList, staffSearch])

  // Lazy window slice for initial render & progressive loading
  const displayedStaff = useMemo(() => {
    return filteredStaff.slice(0, visibleStaffLimit)
  }, [filteredStaff, visibleStaffLimit])

  if (isStaffLoading || isRolesLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    )
  }

  if (isStaffError || isRolesError) {
    return (
      <div className="p-8 my-8 max-w-xl mx-auto rounded-3xl border border-danger/30 bg-danger/5 text-center shadow-card space-y-4">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-danger/10 text-danger flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-heading font-bold text-base text-text-primary">
            Failed to Load Staff Entitlements
          </h3>
          <p className="text-xs text-text-secondary mt-1">
            {staffError?.response?.data?.message || roleError?.response?.data?.message || 'The server rejected or failed to process the authorization request.'}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              refetchStaff()
              refetchRoles()
            }}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Retry Connection
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sub-tabs header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl text-text-primary">
            Assign Staff & Live Effective Privileges Preview
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Multi-role assignment with real-time merged permission set calculation before saving
          </p>
        </div>

        {selectedStaffMember && (
          <Button
            variant="primary"
            size="sm"
            onClick={() =>
              assignMutation.mutate({
                staffId: selectedStaffId,
                roles: selectedRoleIds,
              })
            }
            isLoading={assignMutation.isPending}
            leftIcon={<Save className="w-4 h-4" />}
            className="w-full sm:w-auto shrink-0 shadow-sm"
          >
            Commit Role Assignments
          </Button>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
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
          Permission Matrix Editor
        </Link>
        <Link
          to="/app/admin/roles/assign"
          className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold shadow-sm shrink-0"
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
          className="px-3 py-1.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface text-xs font-semibold transition-colors shrink-0"
        >
          Keyword Templates
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Searchable Staff Selector */}
        <div className="lg:col-span-4 p-5 rounded-2xl border border-border bg-surface shadow-soft flex flex-col gap-4">
          <div>
            <h3 className="font-heading font-bold text-sm text-text-primary mb-1">
              Select Staff Member
            </h3>
            <p className="text-xs text-text-secondary mb-3">
              Choose a clinician to reconfigure their access credentials
            </p>
            <div className="relative">
              <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search staff..."
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-surface border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {displayedStaff.length === 0 ? (
              <div className="p-6 text-center text-xs text-text-secondary">
                No clinicians match your search query.
              </div>
            ) : (
              displayedStaff.map((member) => {
                const isSelected = member.id === selectedStaffId
                return (
                  <div
                    key={member.id}
                    onClick={() => handleSelectStaff(member)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : 'border-border hover:bg-surface/80 bg-surface/40'
                    }`}
                  >
                    <Avatar src={member.avatar} name={member.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-text-primary truncate">
                        {member.name}
                      </div>
                      <div className="text-[11px] text-text-secondary truncate">
                        {member.specialty || member.department || 'Clinical Staff'}
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                  </div>
                )
              })
            )}

            {filteredStaff.length > visibleStaffLimit && (
              <button
                type="button"
                onClick={() => setVisibleStaffLimit((prev) => prev + 25)}
                className="w-full py-2 mt-2 text-xs font-semibold text-primary bg-primary/5 hover:bg-primary/10 rounded-xl transition-colors text-center border border-primary/20"
              >
                Load More Clinicians ({filteredStaff.length - visibleStaffLimit} remaining)
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Roles Multi-select & Effective Permissions Preview */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {!selectedStaffMember ? (
            <div className="p-12 rounded-2xl border border-dashed border-border bg-surface/30 text-center flex flex-col items-center justify-center">
              <Users className="w-10 h-10 text-text-secondary/50 mb-3" />
              <h4 className="font-heading font-bold text-base text-text-primary mb-1">
                No Staff Member Selected
              </h4>
              <p className="text-xs text-text-secondary max-w-sm">
                Select a clinician from the list on the left to assign roles and preview their merged effective permissions.
              </p>
            </div>
          ) : (
            <>
              {/* Selected Clinician Header Banner */}
              <div className="p-5 rounded-2xl border border-border bg-surface shadow-soft flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar src={selectedStaffMember.avatar} name={selectedStaffMember.name} size="md" />
                  <div>
                    <h3 className="font-heading font-bold text-sm text-text-primary">
                      {selectedStaffMember.name}
                    </h3>
                    <p className="text-xs text-text-secondary">
                      {selectedStaffMember.department} • {selectedStaffMember.email}
                    </p>
                  </div>
                </div>
                <Badge variant="primary" size="sm">
                  {selectedRoleIds.length} Roles Assigned
                </Badge>
              </div>

              {/* Roles Checkbox Selection */}
              <div className="p-5 rounded-2xl border border-border bg-surface shadow-soft">
                <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-text-primary mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  Assign Multiple Clinical Roles
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {roles.map((role) => {
                    const isChecked = selectedRoleIds.includes(role.id)
                    return (
                      <div
                        key={role.id}
                        onClick={() => toggleRoleSelection(role.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                          isChecked
                            ? 'border-primary/60 bg-primary/5'
                            : 'border-border hover:bg-surface/90'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Handled by container click
                          className="mt-0.5 rounded border-border text-primary focus:ring-primary/30"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-text-primary">
                            {role.name}
                          </div>
                          <div className="text-[11px] text-text-secondary line-clamp-1 mt-0.5">
                            {role.description}
                          </div>
                          <div className="text-[10px] text-primary font-medium mt-1">
                            {role.permissions?.length || 0} permissions included
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Effective Permissions Merged Preview */}
              <div className="p-5 rounded-2xl border border-border bg-surface shadow-soft">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-text-primary flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Effective Privileges Preview (Merged Permission Set)
                  </h4>
                  <Badge variant="success" size="sm">
                    {effectivePermissionsPreview.length} Entitlements
                  </Badge>
                </div>

                <p className="text-xs text-text-secondary mb-4 leading-relaxed">
                  The unified permission set calculated by taking the union of all selected roles. These exact privileges will be enforced on this clinician’s next API request.
                </p>

                {effectivePermissionsPreview.length === 0 ? (
                  <div className="p-6 text-center text-xs text-text-secondary border border-dashed border-border rounded-xl">
                    No roles selected. Clinician will have zero access privileges.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-1">
                    {effectivePermissionsPreview.map((perm) => (
                      <span
                        key={perm}
                        className="px-2.5 py-1 rounded-lg bg-surface border border-border text-[11px] font-mono text-text-primary flex items-center gap-1.5 shadow-sm"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {perm}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AssignStaffPage
