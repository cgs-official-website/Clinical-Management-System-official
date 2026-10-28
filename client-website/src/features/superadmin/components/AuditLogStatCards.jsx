import React from 'react'
import { Database, Activity, ShieldAlert, Users } from 'lucide-react'
import { Skeleton } from '../../../components/ui/Skeleton'

export const AuditLogStatCards = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl border border-border bg-surface shadow-soft flex flex-col justify-between h-[126px]"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-8 w-8 rounded-xl" />
            </div>
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-3 w-36" />
          </div>
        ))}
      </div>
    )
  }

  const isFiltered =
    stats?.totalRecords != null &&
    stats?.filteredRecords != null &&
    stats.filteredRecords !== stats.totalRecords

  const cards = [
    {
      title: 'Total Records',
      value: stats?.filteredRecords != null ? stats.filteredRecords.toLocaleString() : '—',
      subtitle: isFiltered
        ? `Filtered from ${stats?.totalRecords?.toLocaleString()} total database entries`
        : 'All historical log entries in database',
      icon: Database,
      iconBg: 'bg-primary/10 text-primary',
      borderColor: 'border-border',
    },
    {
      title: "Today's Operations",
      value: stats?.todaysActivity != null ? stats.todaysActivity.toLocaleString() : '—',
      subtitle: `${stats?.todaysActivityLabel || 'Since 00:00 UTC'} across all clinics`,
      icon: Activity,
      iconBg: 'bg-emerald-500/10 text-emerald-500',
      borderColor: 'border-border',
    },
    {
      title: 'Security & Critical Actions',
      value: stats?.securityAlerts != null ? stats.securityAlerts.toLocaleString() : '—',
      subtitle: stats?.securityAlertsDefinition || 'Deletions, suspensions, and role/permission changes',
      icon: ShieldAlert,
      iconBg: 'bg-rose-500/10 text-rose-500',
      borderColor: 'border-rose-500/20',
    },
    {
      title: 'Active Operators',
      value: stats?.activeActors != null ? stats.activeActors.toLocaleString() : '—',
      subtitle: stats?.activeActorsLabel || 'Distinct operators performing actions',
      icon: Users,
      iconBg: 'bg-indigo-500/10 text-indigo-500',
      borderColor: 'border-border',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, idx) => {
        const Icon = c.icon
        return (
          <div
            key={idx}
            className={`p-5 rounded-2xl border ${c.borderColor} bg-surface shadow-soft flex flex-col justify-between hover:border-primary/40 transition-colors`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                {c.title}
              </span>
              <div className={`p-2 rounded-xl ${c.iconBg} ring-4 ring-black/5 dark:ring-white/5`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <span className="font-heading font-extrabold text-2xl sm:text-3xl text-text-primary tracking-tight">
                {c.value}
              </span>
            </div>
            <p className="text-[11px] text-text-secondary line-clamp-1" title={c.subtitle}>
              {c.subtitle}
            </p>
          </div>
        )
      })}
    </div>
  )
}

export default AuditLogStatCards
