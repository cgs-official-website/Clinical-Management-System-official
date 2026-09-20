import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronUp, ShieldCheck, KeyRound, UserCheck } from 'lucide-react'
import { api } from '../../../lib/api'
import { DataTable } from '../../../components/ui/DataTable'
import { Badge } from '../../../components/ui/Badge'
import { Avatar } from '../../../components/ui/Avatar'
import { Button } from '../../../components/ui/Button'

import { useAuthStore } from '../../../store/useAuthStore'

export const StaffRolesListPage = () => {
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [expandedStaffId, setExpandedStaffId] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'staff', user?.tenantId || user?.id],
    queryFn: async () => {
      const res = await api.get('/api/admin/staff')
      return res.data
    },
    refetchOnMount: 'always',
    staleTime: 0,
  })

  const staff = data?.staff || (Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []))
  const filteredStaff = staff.filter(
    (s) =>
      (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.department || '').toLowerCase().includes(search.toLowerCase())
  )

  const toggleExpand = (id) => {
    setExpandedStaffId(expandedStaffId === id ? null : id)
  }

  const columns = [
    {
      key: 'name',
      label: 'Staff Member',
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <Avatar src={row.avatar} name={val} size="sm" status={row.status === 'active' ? 'online' : 'offline'} />
          <div>
            <div className="font-bold text-xs text-text-primary">{val}</div>
            <div className="text-[11px] text-text-secondary">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'department',
      label: 'Department & Specialty',
      render: (val, row) => (
        <div>
          <div className="font-semibold text-xs text-text-primary">{val}</div>
          <div className="text-[11px] text-text-secondary">{row.specialty}</div>
        </div>
      ),
    },
    {
      key: 'roleObjects',
      label: 'Assigned Role(s)',
      render: (roles = []) => (
        <div className="flex flex-wrap gap-1.5">
          {roles.length === 0 ? (
            <span className="text-xs text-text-secondary italic">No roles</span>
          ) : (
            roles.map((r) => (
              <Badge key={r.id} variant="primary" size="sm">
                {r.name}
              </Badge>
            ))
          )}
        </div>
      ),
    },
    {
      key: 'effectivePermissions',
      label: 'Effective Privileges',
      render: (perms = [], row) => {
        const isExpanded = expandedStaffId === row.id
        return (
          <div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                toggleExpand(row.id)
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              <span>{perms.length} Permissions</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {isExpanded && (
              <div className="mt-2.5 p-3 rounded-xl bg-surface border border-border flex flex-wrap gap-1 max-w-md shadow-sm">
                {perms.map((p) => (
                  <span
                    key={p}
                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-primary/10 text-primary border border-primary/20"
                  >
                    {p}
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <Link to="/app/admin/roles/assign">
          <Button variant="secondary" size="xs">
            Edit Roles
          </Button>
        </Link>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Sub-tabs header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl text-text-primary">
            Staff Entitlement & Privileges Roster
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Read-only transparency list showing each staff member's assigned roles and effective permission set
          </p>
        </div>

        <Link to="/app/admin/roles/assign" className="w-full sm:w-auto">
          <Button variant="primary" size="sm" leftIcon={<UserCheck className="w-4 h-4" />} className="w-full sm:w-auto shrink-0 shadow-sm">
            Reassign Privileges
          </Button>
        </Link>
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
          className="px-3 py-1.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface text-xs font-semibold transition-colors shrink-0"
        >
          Assign Staff & Preview
        </Link>
        <Link
          to="/app/admin/roles/staff-list"
          className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold shadow-sm shrink-0"
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

      <DataTable
        columns={columns}
        data={filteredStaff}
        isLoading={isLoading}
        searchPlaceholder="Filter staff roster by name, email or department..."
        searchValue={search}
        onSearchChange={setSearch}
      />
    </div>
  )
}

export default StaffRolesListPage
