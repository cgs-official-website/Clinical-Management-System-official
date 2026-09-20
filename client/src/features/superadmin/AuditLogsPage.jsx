import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, Filter, ShieldAlert, History } from 'lucide-react'
import { api } from '../../lib/api'
import { DataTable } from '../../components/ui/DataTable'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { notify } from '../../components/ui/Toast'

export const AuditLogsPage = () => {
  const [search, setSearch] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['superadmin', 'audit-logs'],
    queryFn: async () => {
      const res = await api.get('/api/superadmin/audit-logs')
      return res.data
    },
  })

  const logs = data?.logs || []
  const filteredLogs = logs.filter(
    (l) =>
      l.actorEmail?.toLowerCase().includes(search.toLowerCase()) ||
      l.action?.toLowerCase().includes(search.toLowerCase()) ||
      l.details?.toLowerCase().includes(search.toLowerCase()) ||
      l.clinicName?.toLowerCase().includes(search.toLowerCase())
  )

  const handleExportCsv = () => {
    setIsExporting(true)
    try {
      const headers = ['Timestamp', 'Actor', 'Role', 'Action', 'Module', 'Details', 'Clinic', 'IP']
      const rows = filteredLogs.map((l) => [
        `"${l.timestamp}"`,
        `"${l.actorEmail}"`,
        `"${l.actorRole}"`,
        `"${l.action}"`,
        `"${l.module}"`,
        `"${l.details.replace(/"/g, '""')}"`,
        `"${l.clinicName}"`,
        `"${l.ipAddress}"`,
      ])

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement('a')
      link.setAttribute('href', encodedUri)
      link.setAttribute('download', `clinic_audit_logs_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      notify.success('Audit log stream exported to CSV!')
    } catch (err) {
      notify.error('Failed to export audit logs.')
    } finally {
      setIsExporting(false)
    }
  }

  const columns = [
    {
      key: 'timestamp',
      label: 'Timestamp',
      sortable: true,
      render: (val) => <span className="font-mono text-[11px] text-text-secondary">{val}</span>,
    },
    {
      key: 'actorEmail',
      label: 'Actor',
      render: (val, row) => (
        <div>
          <div className="font-semibold text-xs text-text-primary">{val}</div>
          <div className="text-[10px] text-text-secondary font-mono">{row.ipAddress}</div>
        </div>
      ),
    },
    {
      key: 'actorRole',
      label: 'Role',
      render: (val) => (
        <Badge variant={val === 'SUPERADMIN' ? 'danger' : val === 'ADMIN' ? 'primary' : 'neutral'} size="sm">
          {val}
        </Badge>
      ),
    },
    {
      key: 'action',
      label: 'Action Event',
      render: (val) => (
        <span className="font-mono text-xs font-semibold text-primary">{val}</span>
      ),
    },
    {
      key: 'details',
      label: 'Audit Payload',
      render: (val) => <span className="text-xs text-text-secondary line-clamp-1">{val}</span>,
    },
    {
      key: 'clinicName',
      label: 'Tenant Scope',
      render: (val) => <span className="text-xs font-medium">{val}</span>,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl text-text-primary">
            Security & Audit Trail
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Immutable tamper-evident records of administrative actions, role modifications, and logins
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleExportCsv}
          isLoading={isExporting}
          leftIcon={<Download className="w-4 h-4" />}
        >
          Export CSV Audit
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={filteredLogs}
        isLoading={isLoading}
        searchPlaceholder="Filter logs by actor email, action event, or details..."
        searchValue={search}
        onSearchChange={setSearch}
      />
    </div>
  )
}

export default AuditLogsPage
