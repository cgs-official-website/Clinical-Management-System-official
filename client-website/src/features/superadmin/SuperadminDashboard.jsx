import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Building2,
  Users,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Activity,
  HeartPulse,
  RefreshCw,
  Clock,
  ArrowRight,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import { api } from '../../lib/api'
import { SkeletonCard, SkeletonChart } from '../../components/ui/Skeleton'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { usePermissions } from '../../hooks/usePermissions'

export const SuperadminDashboard = () => {
  const queryClient = useQueryClient()
  const { isSuperadmin } = usePermissions()
  const [dateRange, setDateRange] = useState('6M')

  const { data: kpis, isLoading, isError, refetch } = useQuery({
    queryKey: ['superadmin', 'kpis', dateRange],
    queryFn: async () => {
      const res = await api.get('/api/superadmin/kpis', { params: { dateRange } })
      return res.data
    },
    enabled: !!isSuperadmin,
    retry: (failureCount, error) => {
      if (error?.response?.status === 403) return false
      return failureCount < 2
    },
  })

  const { data: pendingData } = useQuery({
    queryKey: ['superadmin', 'pending-registrations'],
    queryFn: async () => {
      const res = await api.get('/api/superadmin/pending-registrations')
      return res.data
    },
    enabled: !!isSuperadmin,
    refetchInterval: isSuperadmin ? 5001 : false,
    retry: (failureCount, error) => {
      if (error?.response?.status === 403) return false
      return failureCount < 2
    },
  })

  // Real-time synchronization
  useEffect(() => {
    let channel = null
    try {
      channel = new BroadcastChannel('clinic_registration_channel')
      channel.onmessage = (event) => {
        if (event.data?.type === 'REGISTRATION_CREATED') {
          queryClient.invalidateQueries({ queryKey: ['superadmin', 'pending-registrations'] })
          queryClient.invalidateQueries({ queryKey: ['superadmin', 'kpis'] })
        }
      }
    } catch (e) { }

    const handleStorage = (e) => {
      if (e.key === 'clinic_last_created_registration' && e.newValue) {
        queryClient.invalidateQueries({ queryKey: ['superadmin', 'pending-registrations'] })
        queryClient.invalidateQueries({ queryKey: ['superadmin', 'kpis'] })
      }
    }
    window.addEventListener('storage', handleStorage)

    return () => {
      if (channel) channel.close()
      window.removeEventListener('storage', handleStorage)
    }
  }, [queryClient])

  const pendingList =
    pendingData?.registrations ||
    pendingData?.data?.registrations ||
    (Array.isArray(pendingData?.data) ? pendingData.data : []) ||
    (Array.isArray(pendingData) ? pendingData : [])
  const pendingCount = pendingList.length

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonChart />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-8 rounded-2xl border border-danger/20 bg-danger/5 text-center">
        <h3 className="text-base font-bold text-text-primary mb-1">Failed to load telemetry KPIs</h3>
        <p className="text-xs text-text-secondary mb-4">The superadmin cluster endpoint could not be reached.</p>
        <Button variant="secondary" size="sm" onClick={() => refetch()} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Title & Date Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl text-text-primary">
            Superadmin System Observability
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Global healthcare multi-tenant cluster metrics and financial performance
          </p>
        </div>

        <div className="flex items-center gap-2">
          {['30D', '90D', '6M', '1Y'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${dateRange === range
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
                }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Pending Registration Queue Alert Banner */}
      {pendingCount > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-soft animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-heading font-bold text-sm text-text-primary">
                  {pendingCount} Clinic Registration{pendingCount > 1 ? 's' : ''} Awaiting Superadmin Approval
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                  Action Required
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                New healthcare facilities have submitted onboarding forms and require workspace provisioning approval.
              </p>
            </div>
          </div>

          <Link to="/app/superadmin/clinics">
            <Button
              variant="primary"
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Review Queue ({pendingCount})
            </Button>
          </Link>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Clinics */}
        <div className="p-5 rounded-2xl border border-border bg-surface shadow-soft flex flex-col justify-between min-w-0 transition-all duration-200 hover:border-primary/30">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider truncate">
              Clinic Tenants
            </span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="font-heading font-extrabold text-2xl sm:text-3xl text-text-primary truncate">
            {kpis.totalClinics}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs truncate">
            <Badge variant="success" size="sm" dot>
              {kpis.activeTenants} Active
            </Badge>
            <span className="text-text-secondary text-[11px] truncate">100% provisioning</span>
          </div>
        </div>

        {/* Total Admins & Staff */}
        <div className="p-5 rounded-2xl border border-border bg-surface shadow-soft flex flex-col justify-between min-w-0 transition-all duration-200 hover:border-primary/30">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider truncate">
              Clinical Accounts
            </span>
            <div className="w-8 h-8 rounded-xl bg-info/10 text-info flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="font-heading font-extrabold text-2xl sm:text-3xl text-text-primary truncate">
            {kpis.totalStaff}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs truncate">
            <span className="text-text-secondary font-medium truncate">
              {kpis.totalAdmins} Clinic Admins
            </span>
          </div>
        </div>

        {/* Monthly Recurring Revenue */}
        <div className="p-5 rounded-2xl border border-border bg-surface shadow-soft flex flex-col justify-between min-w-0 transition-all duration-200 hover:border-primary/30">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider truncate">
              Monthly ARR / MRR
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="font-heading font-extrabold text-2xl sm:text-3xl text-text-primary truncate">
            ₹{kpis.monthlyRecurringRevenue?.toLocaleString('en-IN')}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-success font-semibold truncate">
            <TrendingUp className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">+{kpis.mrrGrowthPercentage}% this quarter</span>
          </div>
        </div>

        {/* Cluster Telemetry */}
        <div className="p-5 rounded-2xl border border-border bg-surface shadow-soft flex flex-col justify-between min-w-0 transition-all duration-200 hover:border-primary/30">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider truncate">
              Active Sessions
            </span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="font-heading font-extrabold text-2xl sm:text-3xl text-text-primary truncate">
            {kpis.activeSessions}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs truncate">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse shrink-0" />
            <span className="text-text-secondary text-[11px] truncate">{kpis.systemHealth}</span>
          </div>
        </div>
      </div>

      {/* Recharts Revenue and Expansion Curve */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue Area Chart */}
        <div className="xl:col-span-2 p-6 rounded-2xl border border-border bg-surface shadow-soft min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-heading font-bold text-base text-text-primary">
                Network MRR Expansion (₹)
              </h3>
              <p className="text-xs text-text-secondary">
                Aggregated SaaS billing throughput across all active hospital tenants
              </p>
            </div>
            <Badge variant="primary" size="sm">
              Live Feed
            </Badge>
          </div>

          <div className="h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={kpis.revenueTrends} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#26A689" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#26A689" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.15)" vertical={false} />
                <XAxis dataKey="month" stroke="rgb(var(--color-text-secondary))" fontSize={11} tickLine={false} />
                <YAxis stroke="rgb(var(--color-text-secondary))" fontSize={11} tickLine={false} width={45} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgb(var(--color-surface))',
                    borderColor: 'rgb(var(--color-border))',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#26A689"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revenueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tenant Onboarding Growth Bar Chart */}
        <div className="p-6 rounded-2xl border border-border bg-surface shadow-soft flex flex-col justify-between min-w-0">
          <div>
            <h3 className="font-heading font-bold text-base text-text-primary mb-1">
              Active Tenants
            </h3>
            <p className="text-xs text-text-secondary mb-6">
              New clinics successfully partitioned
            </p>
          </div>

          <div className="h-60 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kpis.revenueTrends} margin={{ top: 5, right: 15, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.15)" vertical={false} />
                <XAxis dataKey="month" stroke="rgb(var(--color-text-secondary))" fontSize={11} tickLine={false} />
                <YAxis stroke="rgb(var(--color-text-secondary))" fontSize={11} tickLine={false} width={30} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgb(var(--color-surface))',
                    borderColor: 'rgb(var(--color-border))',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="clinics" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SuperadminDashboard
