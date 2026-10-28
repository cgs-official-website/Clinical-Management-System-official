import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  X,
  Clock,
  User,
  Shield,
  Database,
  Layers,
  Calendar,
  Building2,
  Copy,
  Check,
  Code2,
  List,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  FileText
} from 'lucide-react'
import { api } from '../../lib/api'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'

export const MODULE_NAME_MAP = {
  Tenant: 'Clinic Tenants',
  TenantSettings: 'Clinic Settings',
  ClinicalConfig: 'Clinical Config',
  User: 'Users & Staff',
  StaffProfile: 'Staff Management',
  Role: 'Roles & Permissions',
  Permission: 'Permissions',
  Patient: 'Patients',
  Appointment: 'Appointments',
  Prescription: 'Prescriptions',
  Billing: 'Billing & Invoicing',
  Invoice: 'Invoices',
  Payment: 'Payments',
  InventoryItem: 'Inventory',
  ClinicCategory: 'Clinic Categories',
  Notification: 'Notifications',
  Auth: 'Authentication',
}

export const getActionBadgeClass = (actionType) => {
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

export const getActionTypeLabel = (actionType) => {
  switch (actionType) {
    case 'CREATE':
      return 'Record Creation'
    case 'UPDATE':
      return 'Record Modification'
    case 'DELETE':
      return 'Record Deletion'
    case 'LOGIN':
      return 'Login Activity'
    default:
      return 'Other Activity'
  }
}

export const getRoleBadgeVariant = (role) => {
  const r = (role || '').toUpperCase()
  if (r.includes('SUPERADMIN')) return 'danger'
  if (r.includes('ADMIN')) return 'primary'
  if (r.includes('DOCTOR') || r.includes('PHYSICIAN')) return 'info'
  return 'neutral'
}

export const formatRelativeTime = (isoString) => {
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

export const formatInspectorDate = (isoString) => {
  if (!isoString) return '-'
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return String(isoString)
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

export const formatInspectorTime = (isoString) => {
  if (!isoString) return '-'
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  }).format(d)
}


export const AuditRecordInspector = ({ record, isOpen, onClose }) => {
  const [viewRawJson, setViewRawJson] = useState(false)
  const [copied, setCopied] = useState(false)

  // Close on Escape key and lock body scroll
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen, onClose])

  // Fetch full detail in background (for complete beforeState / afterState)
  const {
    data: detailResponse,
    isLoading: isLoadingDetail,
    isError: isDetailError,
    refetch: refetchDetail,
  } = useQuery({
    queryKey: ['superadmin', 'audit-log-detail', record?.id],
    queryFn: async () => {
      if (!record?.id) return null
      const res = await api.get(`/api/superadmin/audit-logs/${record.id}`)
      return res.data?.data || res.data
    },
    enabled: Boolean(isOpen && record?.id),
    staleTime: 60 * 1000,
  })

  if (!isOpen || !record) return null

  // Merge row record with background detail response
  const merged = {
    ...record,
    ...(detailResponse || {}),
  }

  const beforeState = merged.beforeState || null
  const afterState = merged.afterState || merged.payload || null
  const hasBefore = beforeState && typeof beforeState === 'object' && Object.keys(beforeState).length > 0
  const hasAfter = afterState && typeof afterState === 'object' && Object.keys(afterState).length > 0
  const hasBothStates = hasBefore && hasAfter
  const hasAnyState = hasBefore || hasAfter

  const moduleName =
    MODULE_NAME_MAP[merged.entityType] ||
    merged.module ||
    merged.entityType ||
    'General'

  const actionBadgeClass = getActionBadgeClass(merged.actionType)
  const actionTypeLabel = getActionTypeLabel(merged.actionType)

  const handleCopy = (content) => {
    try {
      const text = typeof content === 'string' ? content : JSON.stringify(content, null, 2)
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Ignore clipboard error
    }
  }

  // Compute diff keys if both exist
  const diffKeys = hasBothStates
    ? Array.from(new Set([...Object.keys(beforeState), ...Object.keys(afterState)]))
    : []

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-surface border border-border rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="audit-inspector-title"
      >
        {/* 1. Header */}
        <div className="p-5 sm:p-6 border-b border-border flex items-center justify-between gap-4 bg-surface/90 backdrop-blur-md shrink-0">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2
                id="audit-inspector-title"
                className="font-heading font-extrabold text-xl sm:text-2xl text-text-primary tracking-tight"
              >
                Audit Record Inspector
              </h2>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${actionBadgeClass}`}
              >
                {merged.actionType || 'EVENT'}
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Clinic Audit Trail • Zuna Clinical Management System
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-border/40 transition-colors shrink-0"
            title="Close inspector (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Description Card */}
          <div className="p-4 rounded-2xl bg-surface-muted/60 dark:bg-surface-muted/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
                <FileText className="w-4 h-4" />
              </div>
              <p className="text-sm font-medium text-text-primary leading-relaxed">
                {merged.description || 'Action performed on clinical record.'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text-secondary font-mono shrink-0 self-end sm:self-center">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatRelativeTime(merged.timestamp || merged.createdAt)}</span>
            </div>
          </div>

          {/* 6 Info Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {/* Card 1: Performed By */}
            <div className="p-4 rounded-2xl border border-border bg-surface shadow-soft flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                  Performed By
                </span>
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <User className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-heading font-bold text-sm text-text-primary">
                    {merged.actorName || 'System'}
                  </span>
                  <Badge variant={getRoleBadgeVariant(merged.actorRole)} size="sm">
                    {merged.actorRole || 'SYSTEM'}
                  </Badge>
                </div>
                <div className="text-xs text-text-secondary font-mono mt-1 truncate" title={merged.actorEmail}>
                  {merged.actorEmail || '—'}
                </div>
              </div>
            </div>

            {/* Card 2: Action */}
            <div className="p-4 rounded-2xl border border-border bg-surface shadow-soft flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                  Action
                </span>
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                  <Shield className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <div className="font-mono text-xs font-bold text-text-primary break-all">
                  {merged.action}
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  {actionTypeLabel}
                </div>
              </div>
            </div>

            {/* Card 3: Target Record */}
            <div className="p-4 rounded-2xl border border-border bg-surface shadow-soft flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                  Target Record
                </span>
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                  <Database className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <div className="font-heading font-bold text-sm text-text-primary">
                  {merged.entityType || '—'}
                </div>
                <div className="text-xs font-mono text-text-secondary mt-1 truncate" title={merged.entityId}>
                  {merged.entityId ? `ID: ${merged.entityId}` : '—'}
                </div>
              </div>
            </div>

            {/* Card 4: Module */}
            <div className="p-4 rounded-2xl border border-border bg-surface shadow-soft flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                  Module
                </span>
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Layers className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <div className="font-heading font-bold text-sm text-text-primary">
                  {moduleName}
                </div>
                <div className="text-xs text-text-secondary mt-1 font-mono">
                  {merged.entityType ? `Scope: ${merged.entityType}` : 'System Scope'}
                </div>
              </div>
            </div>

            {/* Card 5: Clinic Scope */}
            <div className="p-4 rounded-2xl border border-border bg-surface shadow-soft flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                  Clinic
                </span>
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <div className="font-heading font-bold text-sm text-text-primary truncate" title={merged.clinicName}>
                  {merged.clinicName || 'Platform'}
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  {merged.tenantId ? 'Clinic Workspace' : 'Platform Scope'}
                </div>
              </div>
            </div>

            {/* Card 6: Date & Time */}
            <div className="p-4 rounded-2xl border border-border bg-surface shadow-soft flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                  Date & Time
                </span>
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <div className="font-heading font-bold text-sm text-text-primary">
                  {formatInspectorDate(merged.timestamp || merged.createdAt)}
                </div>
                <div className="text-xs font-mono text-text-secondary mt-1">
                  {formatInspectorTime(merged.timestamp || merged.createdAt)}
                </div>
              </div>
            </div>
          </div>

          {/* Change Details Section */}
          {isLoadingDetail ? (
            <div className="p-5 rounded-2xl border border-border bg-surface shadow-soft space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-7 w-20" />
              </div>
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ) : isDetailError ? (
            <div className="p-4 rounded-2xl border border-danger/30 bg-danger/5 flex items-center justify-between gap-3 text-xs text-danger">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Could not load complete snapshot history for this record.</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetchDetail()}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Retry
              </Button>
            </div>
          ) : hasAnyState ? (
            <div className="p-5 rounded-2xl border border-border bg-surface shadow-soft space-y-4">
              {/* Change Details Header */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="font-heading font-bold text-sm text-text-primary flex items-center gap-2">
                    <span>Change Details</span>
                    <span className="text-xs font-normal text-text-secondary">
                      {hasBothStates ? '(Before & After Comparison)' : '(State Snapshot)'}
                    </span>
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  {!hasBothStates && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setViewRawJson((prev) => !prev)}
                      leftIcon={viewRawJson ? <List className="w-3.5 h-3.5" /> : <Code2 className="w-3.5 h-3.5" />}
                    >
                      {viewRawJson ? 'Key-Value View' : 'Raw JSON'}
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(hasBothStates ? { before: beforeState, after: afterState } : (afterState || beforeState))}
                    leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              </div>

              {/* Both Before & After Diff Table */}
              {hasBothStates ? (
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-surface-muted/70 text-[11px] font-bold uppercase tracking-wider text-text-secondary border-b border-border">
                        <th className="py-2.5 px-3.5 w-1/4">Field / Property</th>
                        <th className="py-2.5 px-3.5 w-3/8 text-rose-600 dark:text-rose-400">Before State</th>
                        <th className="py-2.5 px-3.5 w-3/8 text-emerald-600 dark:text-emerald-400">After State</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-mono">
                      {diffKeys.map((k) => {
                        const valBefore = beforeState[k]
                        const valAfter = afterState[k]
                        const isChanged = JSON.stringify(valBefore) !== JSON.stringify(valAfter)

                        return (
                          <tr
                            key={k}
                            className={`transition-colors ${
                              isChanged ? 'bg-amber-500/5 dark:bg-amber-500/10' : 'hover:bg-border/20'
                            }`}
                          >
                            <td className="py-2.5 px-3.5 font-semibold text-text-primary align-top break-all">
                              <div className="flex items-center gap-1.5">
                                <span>{k}</span>
                                {isChanged && (
                                  <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">
                                    diff
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3.5 text-text-secondary align-top break-all">
                              {valBefore !== undefined ? (
                                typeof valBefore === 'object' && valBefore !== null ? (
                                  <pre className="text-[11px] whitespace-pre-wrap">{JSON.stringify(valBefore, null, 2)}</pre>
                                ) : (
                                  String(valBefore)
                                )
                              ) : (
                                <span className="text-text-secondary/50 italic">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3.5 text-text-primary font-medium align-top break-all">
                              {valAfter !== undefined ? (
                                typeof valAfter === 'object' && valAfter !== null ? (
                                  <pre className="text-[11px] whitespace-pre-wrap">{JSON.stringify(valAfter, null, 2)}</pre>
                                ) : (
                                  String(valAfter)
                                )
                              ) : (
                                <span className="text-text-secondary/50 italic">—</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : viewRawJson ? (
                /* Raw JSON Viewer */
                <pre className="p-4 rounded-xl border border-border bg-surface-muted/60 dark:bg-surface-muted/40 font-mono text-xs text-text-primary overflow-x-auto leading-relaxed max-h-72">
                  {JSON.stringify(afterState || beforeState, null, 2)}
                </pre>
              ) : (
                /* Key-Value List Viewer */
                <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
                  {Object.entries(afterState || beforeState || {}).map(([key, val]) => (
                    <div
                      key={key}
                      className="p-3 sm:px-4 flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-4 hover:bg-border/20 transition-colors text-xs"
                    >
                      <span className="font-mono font-semibold text-text-secondary sm:w-1/3 shrink-0 break-all">
                        {key}
                      </span>
                      <div className="font-mono text-text-primary sm:w-2/3 break-all">
                        {val === null || val === undefined ? (
                          <span className="text-text-secondary/50 italic">—</span>
                        ) : typeof val === 'object' ? (
                          <pre className="text-[11px] whitespace-pre-wrap bg-surface-muted/40 p-2 rounded-lg border border-border/50">
                            {JSON.stringify(val, null, 2)}
                          </pre>
                        ) : (
                          String(val)
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* 3. Footer */}
        <div className="p-4 sm:px-6 border-t border-border flex items-center justify-between gap-3 bg-surface/90 backdrop-blur-md shrink-0">
          <div className="text-[11px] text-text-secondary font-mono truncate">
            Record ID: <span className="select-all">{merged.id}</span>
          </div>

          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}

export default AuditRecordInspector
