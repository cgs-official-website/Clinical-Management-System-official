import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import {
  ShieldCheck,
  RefreshCw,
  FileSpreadsheet,
  AlertTriangle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
  Eye,
} from 'lucide-react'
import { api } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { notify } from '../../components/ui/Toast'
import { AuditLogStatCards } from './components/AuditLogStatCards'
import { AuditLogFilterPanel } from './components/AuditLogFilterPanel'
import { AuditRecordInspector } from './AuditRecordInspector'

const formatRelativeTime = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  if (isNaN(date.getTime())) return ''
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return date.toLocaleDateString()
}

const formatExactDateTime = (isoString) => {
  if (!isoString) return '—'
  const date = new Date(isoString)
  if (isNaN(date.getTime())) return String(isoString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

const getActionBadgeClass = (actionType) => {
  switch (actionType) {
    case 'CREATE':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
    case 'UPDATE':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
    case 'DELETE':
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
    case 'LOGIN':
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
    default:
      return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
  }
}

const getRoleBadgeVariant = (role) => {
  const r = (role || '').toUpperCase()
  if (r.includes('SUPERADMIN')) return 'danger'
  if (r.includes('ADMIN')) return 'primary'
  if (r.includes('DOCTOR') || r.includes('PHYSICIAN')) return 'info'
  return 'neutral'
}

const getInitials = (name) => {
  if (!name) return 'OP'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export const AuditLogsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [inspectingRecord, setInspectingRecord] = useState(null)
  const [isExporting, setIsExporting] = useState(false)

  // Read filter state directly from URL search params
  const search = searchParams.get('search') || ''
  const role = searchParams.get('role') || 'ALL'
  const module = searchParams.get('module') || 'ALL'
  const action = searchParams.get('action') || 'ALL'
  const clinicId = searchParams.get('clinicId') || 'ALL'
  const from = searchParams.get('from') || ''
  const to = searchParams.get('to') || ''
  const period = searchParams.get('period') || (from || to ? 'CUSTOM' : 'ALL')
  const sort = searchParams.get('sort') || 'desc'
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '20', 10)

  // Query filter options from server (cached 5 min)
  const { data: filterOptionsRes, isLoading: isLoadingFilters } = useQuery({
    queryKey: ['superadmin', 'audit-logs-filters'],
    queryFn: async () => {
      const res = await api.get('/api/superadmin/audit-logs/filters')
      return res.data?.data || res.data || {}
    },
    staleTime: 5 * 60 * 1000,
  })

  const filterOptions = filterOptionsRes || {}

  // Main Audit Logs Query (server-side filtering, pagination, stats)
  const {
    data: logsResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      'superadmin',
      'audit-logs',
      { search, role, module, action, clinicId, period, from, to, sort, page, limit },
    ],
    queryFn: async () => {
      const q = new URLSearchParams()
      q.set('page', String(page))
      q.set('limit', String(limit))
      if (search) q.set('search', search)
      if (role && role !== 'ALL') q.set('role', role)
      if (module && module !== 'ALL') q.set('module', module)
      if (action && action !== 'ALL') q.set('action', action)
      if (clinicId && clinicId !== 'ALL') q.set('clinicId', clinicId)
      if (from) q.set('from', from)
      if (to) q.set('to', to)
      if (sort) q.set('sort', sort)

      const res = await api.get(`/api/superadmin/audit-logs?${q.toString()}`)
      return res.data?.data || res.data
    },
    keepPreviousData: true,
  })

  // Normalize response envelope
  const logs = Array.isArray(logsResponse)
    ? logsResponse
    : logsResponse?.data || logsResponse?.logs || []
  const pagination = logsResponse?.pagination || {
    page,
    limit,
    total: logs.length,
    totalPages: 1,
  }
  const stats = logsResponse?.stats || null

  // URL State helper using functional updater to avoid race conditions/stale closures
  const updateParams = (updates) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        Object.entries(updates).forEach(([key, val]) => {
          if (val === '' || val === null || val === undefined || val === 'ALL') {
            next.delete(key)
          } else {
            next.set(key, String(val))
          }
        })
        return next
      },
      { replace: true }
    )
  }

  const handleSearchChange = (val) => {
    updateParams({ search: val, page: 1 })
  }

  const handleRoleChange = (val) => {
    updateParams({ role: val, page: 1 })
  }

  const handleModuleChange = (val) => {
    updateParams({ module: val, page: 1 })
  }

  const handleActionChange = (val) => {
    updateParams({ action: val, page: 1 })
  }

  const handleClinicChange = (val) => {
    updateParams({ clinicId: val, page: 1 })
  }

  const handlePeriodChange = (val, newFrom = '', newTo = '') => {
    updateParams({
      period: val,
      from: newFrom,
      to: newTo,
      page: 1,
    })
  }

  const handleDateRangeChange = (newFrom, newTo) => {
    updateParams({
      period: 'CUSTOM',
      from: newFrom,
      to: newTo,
      page: 1,
    })
  }

  const handleSortToggle = () => {
    updateParams({ sort: sort === 'asc' ? 'desc' : 'asc' })
  }

  const handlePageChange = (newPage) => {
    updateParams({ page: newPage })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleLimitChange = (newLimit) => {
    updateParams({ limit: newLimit, page: 1 })
  }

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true })
  }

  // Excel (.xlsx) Export
  const handleExportExcel = async () => {
    setIsExporting(true)
    try {
      const q = new URLSearchParams()
      if (search) q.set('search', search)
      if (role && role !== 'ALL') q.set('role', role)
      if (module && module !== 'ALL') q.set('module', module)
      if (action && action !== 'ALL') q.set('action', action)
      if (clinicId && clinicId !== 'ALL') q.set('clinicId', clinicId)
      if (from) q.set('from', from)
      if (to) q.set('to', to)
      if (sort) q.set('sort', sort)

      const res = await api.get(`/api/superadmin/audit-logs/export?${q.toString()}`, {
        responseType: 'blob',
      })

      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      const dateStr = new Date().toISOString().split('T')[0]
      link.setAttribute('download', `system_audit_logs_${dateStr}.xlsx`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

      notify.success('Audit log export generated and downloaded (.xlsx)!')
    } catch (err) {
      notify.error('Failed to export audit logs. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const startRecord = (pagination.page - 1) * pagination.limit + 1
  const endRecord = Math.min(pagination.page * pagination.limit, pagination.total)

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header Card */}
      <div className="p-6 rounded-2xl border border-border bg-surface shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary ring-4 ring-primary/5 shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-2xl text-text-primary tracking-tight">
              System Audit Logs
            </h1>
            <p className="text-xs text-text-secondary mt-1 max-w-2xl leading-relaxed">
              Trail of create, update, delete, login, permission and settings actions across all clinics.
              Every operation is recorded with actor role and state snapshot.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            isLoading={isFetching}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleExportExcel}
            isLoading={isExporting}
            leftIcon={<FileSpreadsheet className="w-4 h-4" />}
          >
            Export Excel
          </Button>
        </div>
      </div>

      {/* 2. Four Stat Cards */}
      <AuditLogStatCards stats={stats} isLoading={isLoading} />

      {/* 3. Filter Panel */}
      <AuditLogFilterPanel
        search={search}
        onSearchChange={handleSearchChange}
        role={role}
        onRoleChange={handleRoleChange}
        module={module}
        onModuleChange={handleModuleChange}
        action={action}
        onActionChange={handleActionChange}
        clinicId={clinicId}
        onClinicChange={handleClinicChange}
        period={period}
        onPeriodChange={handlePeriodChange}
        from={from}
        to={to}
        onDateRangeChange={handleDateRangeChange}
        onResetFilters={handleResetFilters}
        filterOptions={filterOptions}
        isLoadingFilters={isLoadingFilters}
      />

      {/* 4. Table Card */}
      <div className="rounded-2xl border border-border bg-surface shadow-soft overflow-hidden">
        {/* Table Toolbar / Title */}
        <div className="px-6 py-4 border-b border-border bg-surface/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
              Audit Stream Records
            </span>
            {pagination.total > 0 && (
              <span className="text-xs text-text-secondary font-medium">
                ({pagination.total.toLocaleString()} total)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <span>Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="text-xs rounded-lg border border-border bg-surface px-2 py-1 text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Query State Displays */}
        {isLoading ? (
          <div className="p-4">
            <SkeletonTable rows={8} cols={7} />
          </div>
        ) : isError ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-danger/10 text-danger flex items-center justify-center ring-8 ring-danger/5">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-text-primary">Failed to load audit logs</h3>
            <p className="text-xs text-text-secondary max-w-md">
              {error?.response?.data?.message || error?.message || 'Network error communicating with audit trail service.'}
            </p>
            <Button variant="primary" size="sm" onClick={() => refetch()} className="mt-2">
              Retry Request
            </Button>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No audit records match your filters"
              description="Try adjusting your search keywords, role selection, date range, or clinic scope."
              actionLabel="Reset All Filters"
              onAction={handleResetFilters}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface/50 text-[11px] font-bold uppercase tracking-wider text-text-secondary select-none">
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-text-primary transition-colors group"
                    onClick={handleSortToggle}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Timestamp</span>
                      {sort === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-primary" />
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-4">Performed By</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Module</th>
                  <th className="py-3 px-4">Target Record / Description</th>
                  <th className="py-3 px-4">Clinic Scope</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {logs.map((log) => {
                  const actionBadgeClass = getActionBadgeClass(log.actionType)
                  const initials = getInitials(log.actorName)

                  return (
                    <tr
                      key={log.id}
                      onClick={() => setInspectingRecord(log)}
                      className="hover:bg-primary/5 transition-colors cursor-pointer group"
                      title="Click to view audit record details"
                    >
                      {/* 1. Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono text-xs text-text-primary font-medium group-hover:text-primary transition-colors">
                          {formatExactDateTime(log.timestamp)}
                        </div>
                        <div className="text-[10px] text-text-secondary mt-0.5">
                          {formatRelativeTime(log.timestamp)}
                        </div>
                      </td>

                      {/* 2. Performed By */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/20 shadow-soft">
                            {initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-text-primary">
                                {log.actorName}
                              </span>
                              <Badge variant={getRoleBadgeVariant(log.actorRole)} size="sm">
                                {log.actorRole}
                              </Badge>
                            </div>
                            <div className="text-[11px] text-text-secondary font-mono mt-0.5">
                              {log.actorEmail}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 3. Action */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${actionBadgeClass}`}
                          >
                            {log.actionType || 'EVENT'}
                          </span>
                          <div className="font-mono text-[11px] font-semibold text-text-primary mt-1">
                            {log.action}
                          </div>
                        </div>
                      </td>

                      {/* 4. Module */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-surface text-text-primary border border-border">
                          {log.module}
                        </span>
                      </td>

                      {/* 5. Description */}
                      <td className="py-3.5 px-4 max-w-md">
                        <div
                          className="text-text-primary text-xs leading-relaxed line-clamp-2"
                          title={log.description}
                        >
                          {log.description}
                        </div>
                      </td>

                      {/* 6. Clinic Scope */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-xs font-semibold text-text-primary">
                          {log.clinicName}
                        </span>
                      </td>

                      {/* 7. Actions (Inspect Record) */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setInspectingRecord(log)
                          }}
                          className="p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors inline-flex items-center justify-center"
                          title="View details"
                          aria-label="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Pagination Bar */}
        {!isLoading && !isError && logs.length > 0 && (
          <div className="px-6 py-4 border-t border-border bg-surface/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-text-secondary font-medium">
              Showing <span className="text-text-primary font-semibold">{startRecord}</span> to{' '}
              <span className="text-text-primary font-semibold">{endRecord}</span> of{' '}
              <span className="text-text-primary font-semibold">
                {pagination.total.toLocaleString()}
              </span>{' '}
              audit entries
            </div>

            <div className="flex items-center gap-2 self-center sm:self-auto">
              <Button
                variant="secondary"
                size="xs"
                disabled={pagination.page <= 1}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pNum = i + 1
                  if (pagination.totalPages > 5 && pagination.page > 3) {
                    pNum = pagination.page - 2 + i
                    if (pNum > pagination.totalPages) {
                      pNum = pagination.totalPages - 4 + i
                    }
                  }
                  const isCurrent = pNum === pagination.page
                  return (
                    <button
                      key={pNum}
                      type="button"
                      onClick={() => handlePageChange(pNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                        isCurrent
                          ? 'bg-primary text-white shadow-sm'
                          : 'bg-surface hover:bg-border/60 text-text-secondary hover:text-text-primary border border-border'
                      }`}
                    >
                      {pNum}
                    </button>
                  )
                })}
              </div>

              <Button
                variant="secondary"
                size="xs"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Audit Record Inspector Modal */}
      <AuditRecordInspector
        record={inspectingRecord}
        isOpen={Boolean(inspectingRecord)}
        onClose={() => setInspectingRecord(null)}
      />
    </div>
  )
}

export default AuditLogsPage
