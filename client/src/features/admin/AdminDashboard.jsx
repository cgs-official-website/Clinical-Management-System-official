import React, { useState, useEffect, lazy, Suspense } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Users,
  Calendar,
  DollarSign,
  Activity,
  Clock,
  TrendingUp,
  Sparkles,
  Settings,
  ShieldCheck,
  ArrowRight,
  Boxes,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { api } from '../../lib/api'
import { SkeletonCard, SkeletonChart } from '../../components/ui/Skeleton'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { useAuthStore } from '../../store/useAuthStore'
import { useRolePermissions } from '../../hooks/useRolePermissions'

// Lazy load the onboarding/environment modal to keep bundle lightweight
const EnvironmentSetupModal = lazy(() =>
  import('./EnvironmentSetupModal').then((m) => ({ default: m.EnvironmentSetupModal }))
)

export const AdminDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { permittedModules } = useRolePermissions()
  const [isSetupOpen, setIsSetupOpen] = useState(() => {
    return searchParams.get('onboarding') === 'true' || user?.needsEnvironmentSetup === true
  })

  // Open modal if user has onboarding param
  useEffect(() => {
    if (searchParams.get('onboarding') === 'true' || user?.needsEnvironmentSetup) {
      setIsSetupOpen(true)
    }
  }, [searchParams, user?.needsEnvironmentSetup])

  const { data: rawKpis, isLoading } = useQuery({
    queryKey: ['admin', 'kpis'],
    queryFn: async () => {
      const res = await api.get('/api/admin/kpis')
      return res.data
    },
  })

  const kpis = rawKpis?.data?.kpis || rawKpis?.kpis || rawKpis?.data || rawKpis || {}

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

  const statCards = [
    {
      label: 'Patients Registered',
      value: kpis?.totalPatients ?? kpis?.patientsToday ?? 0,
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary/10',
      trend: kpis?.newPatientsToday > 0 ? `+${kpis.newPatientsToday} added recently` : `${kpis?.totalPatients || 0} active hospital records`,
    },
    {
      label: 'Appointments on Schedule',
      value: kpis?.appointmentsScheduled ?? kpis?.totalAppointments ?? 0,
      icon: Calendar,
      color: 'text-info',
      bg: 'bg-info/10',
      trend: `${kpis?.completedAppointmentsToday || 0} completed • ${kpis?.pendingAppointments || 0} pending queue`,
    },
    {
      label: 'Staff on Active Shift',
      value: kpis?.staffOnDuty ?? kpis?.activeStaffOnDuty ?? 0,
      icon: Activity,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      trend: `${kpis?.activeStaffOnDuty || 0} registered clinicians on duty`,
    },
    {
      label: "Clinical Collections",
      value: `₹${(kpis?.dailyRevenue ?? kpis?.totalRevenueINR ?? 0).toLocaleString('en-IN')}`,
      icon: DollarSign,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      trend: kpis?.pendingCollectionsINR > 0 ? `₹${kpis.pendingCollectionsINR.toLocaleString('en-IN')} pending billing` : 'All invoices settled',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header with Setup Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading font-extrabold text-2xl text-text-primary">
              Clinical Operations Dashboard
            </h1>
            <Badge variant="success" size="sm" dot>
              Active Workspace
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            {kpis?.hospitalName || user?.clinicName || 'Clinic'} • Real-time patient intake volume, staff allocations, and scheduling queues
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsSetupOpen(true)}
          leftIcon={<Settings className="w-4 h-4 text-primary" />}
        >
          Environment Setup
        </Button>
      </div>

      {/* Onboarding Welcome Banner if newly provisioned */}
      {(user?.needsEnvironmentSetup || searchParams.get('onboarding') === 'true') && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-primary/15 via-primary/5 to-transparent border border-primary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-soft animate-in fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-heading font-bold text-sm text-text-primary">
                  Welcome to Your clinic Environment!
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white">
                  Step 1 Action Required
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                Your clinic registration is approved. Customize currency (₹ INR), timezones, and active clinical modules.
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            className="font-bold shadow-glow text-xs"
            onClick={() => setIsSetupOpen(true)}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Configure Environment
          </Button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {statCards.map((card, idx) => {
          const Icon = card.icon
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl border border-border bg-surface shadow-soft flex flex-col justify-between min-w-0 transition-all duration-200 hover:border-primary/30"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider truncate">
                  {card.label}
                </span>
                <div className={`w-8 h-8 rounded-xl ${card.bg} ${card.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="font-heading font-extrabold text-2xl sm:text-3xl text-text-primary truncate">
                {card.value}
              </div>
              <div className="mt-2 text-xs text-text-secondary flex items-center gap-1.5 truncate">
                <TrendingUp className="w-3.5 h-3.5 text-success shrink-0" />
                <span className="truncate">{card.trend}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Weekly Trend Bar Chart */}
        <div className="xl:col-span-2 p-6 rounded-2xl border border-border bg-surface shadow-soft min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-heading font-bold text-base text-text-primary">
                Weekly Patient Check-In Velocity
              </h3>
              <p className="text-xs text-text-secondary">
                Daily clinical patient encounters processed across all departments
              </p>
            </div>
            <Badge variant="primary" size="sm">
              Live Feed
            </Badge>
          </div>

          <div className="h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kpis?.weeklyPatientTrends} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.15)" vertical={false} />
                <XAxis dataKey="day" stroke="rgb(var(--color-text-secondary))" fontSize={11} tickLine={false} />
                <YAxis stroke="rgb(var(--color-text-secondary))" fontSize={11} tickLine={false} width={35} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgb(var(--color-surface))',
                    borderColor: 'rgb(var(--color-border))',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#26A689" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Appointment Status Breakdown Donut */}
        <div className="p-6 rounded-2xl border border-border bg-surface shadow-soft flex flex-col justify-between min-w-0">
          <div>
            <h3 className="font-heading font-bold text-base text-text-primary mb-1">
              Appointment Queue
            </h3>
            <p className="text-xs text-text-secondary mb-4">
              Real-time daily status distribution
            </p>
          </div>

          <div className="h-56 w-full min-w-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={kpis?.appointmentStatusBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius="50%"
                  outerRadius="75%"
                  paddingAngle={4}
                  dataKey="value"
                >
                  {kpis?.appointmentStatusBreakdown?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgb(var(--color-surface))',
                    borderColor: 'rgb(var(--color-border))',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-4 border-t border-border flex flex-col gap-2">
            {kpis?.appointmentStatusBreakdown?.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-text-secondary truncate">{item.name}</span>
                </div>
                <span className="font-bold text-text-primary shrink-0 ml-2">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Category Modules Section (Only shows modules enabled for this clinic category) */}
      {permittedModules && permittedModules.length > 0 && (
        <div className="p-6 rounded-2xl border border-border bg-surface shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="font-heading font-bold text-base text-text-primary">
                Active Category Modules ({permittedModules.length})
              </h3>
              <p className="text-xs text-text-secondary">
                Departmental clinical workflows and operational modules enabled for your clinic
              </p>
            </div>
            <Badge variant="primary" size="sm">
              Category Powered
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {permittedModules.map((mod) => (
              <button
                key={mod.id || mod.route}
                onClick={() => navigate(mod.route)}
                className="p-3.5 rounded-xl border border-border bg-surface-hover/20 hover:bg-primary/5 hover:border-primary/40 transition-all text-left flex items-center justify-between group"
              >
                <div className="truncate">
                  <h4 className="font-heading font-bold text-xs text-text-primary group-hover:text-primary transition-colors truncate">
                    {mod.name}
                  </h4>
                  <span className="text-[10px] text-text-secondary">Quick Launch →</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Environment Setup Wizard Modal (Lazily Loaded) */}
      {isSetupOpen && (
        <Suspense fallback={null}>
          <EnvironmentSetupModal
            isOpen={isSetupOpen}
            onClose={() => {
              setIsSetupOpen(false)
              setSearchParams({})
            }}
            clinicName={user?.clinicName}
          />
        </Suspense>
      )}
    </div>
  )
}

export default AdminDashboard
