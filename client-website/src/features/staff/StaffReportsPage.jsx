import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { api } from '../../lib/api'
import { SkeletonChart } from '../../components/ui/Skeleton'

const startOfDay = (d) => {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

// Range is [start, end) in the browser's local time
const getRange = (mode, anchor) => {
  const day = startOfDay(anchor)
  if (mode === 'Month') {
    return {
      start: new Date(day.getFullYear(), day.getMonth(), 1),
      end: new Date(day.getFullYear(), day.getMonth() + 1, 1),
    }
  }
  const start = new Date(day)
  start.setDate(day.getDate() - ((day.getDay() + 6) % 7)) // Monday
  const end = new Date(start)
  end.setDate(start.getDate() + 7)
  return { start, end }
}

const rangeTitle = (mode, { start, end }) => {
  if (mode === 'Month') return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const last = new Date(end)
  last.setDate(end.getDate() - 1)
  const a = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const b = last.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return `${a} - ${b}`
}

const Kpi = ({ label, value, hint }) => (
  <div className="p-4 rounded-2xl border border-border bg-surface shadow-soft min-w-0">
    <div className="text-[11px] font-bold text-text-secondary uppercase tracking-wider truncate">{label}</div>
    <div className="font-heading font-extrabold text-2xl text-text-primary mt-1">{value}</div>
    {hint && <div className="text-[11px] text-text-secondary mt-1 truncate">{hint}</div>}
  </div>
)

export const StaffReportsPage = () => {
  const [mode, setMode] = useState('Week')
  const [anchor, setAnchor] = useState(() => new Date())
  const range = useMemo(() => getRange(mode, anchor), [mode, anchor])

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['staff', 'reports', mode, range.start.getTime(), range.end.getTime()],
    queryFn: async () => {
      const res = await api.get('/api/staff/reports', {
        params: {
          from: range.start.toISOString(),
          to: range.end.toISOString(),
          tzOffset: new Date().getTimezoneOffset(),
        },
      })
      return res.data
    },
    placeholderData: (prev) => prev,
    staleTime: 30 * 1000,
  })

  const shift = (dir) =>
    setAnchor((prev) => {
      const next = new Date(prev)
      if (mode === 'Month') next.setMonth(next.getMonth() + dir, 1)
      else next.setDate(next.getDate() + dir * 7)
      return next
    })

  if (isLoading && !data) return <SkeletonChart />

  const period = data?.period || {}
  const metrics = data?.personalMetrics || {}
  const weeklyLoad = data?.weeklyLoad || []
  const noData = (period.appointments || 0) === 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl text-text-primary">
            Clinician Workload & Performance Metrics
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Live figures from appointments, prescriptions and invoices for the selected period
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="p-1 rounded-xl bg-surface border border-border flex items-center gap-1">
            {['Week', 'Month'].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${mode === m ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
                  }`}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label={`Previous ${mode.toLowerCase()}`}
              onClick={() => shift(-1)}
              className="p-1.5 rounded-lg border border-border text-text-secondary hover:bg-surface-secondary"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-semibold text-text-primary min-w-36 text-center">
              {rangeTitle(mode, range)}
            </span>
            <button
              type="button"
              aria-label={`Next ${mode.toLowerCase()}`}
              onClick={() => shift(1)}
              className="p-1.5 rounded-lg border border-border text-text-secondary hover:bg-surface-secondary"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setAnchor(new Date())}
              className="ml-1 px-2.5 py-1 rounded-lg border border-border text-[11px] font-semibold text-text-secondary hover:bg-surface-secondary"
            >
              Today
            </button>
          </div>
        </div>
      </div>

      {isError && (
        <div className="p-3 rounded-xl border border-danger/30 bg-danger/5 text-xs text-danger">
          Could not load report data. Check that the server is running.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <Kpi label="Appointments" value={period.appointments ?? 0} hint="Booked in period" />
        <Kpi label="Completed" value={period.completed ?? 0} hint="Consultations done" />
        <Kpi label="Cancelled / No-show" value={period.missed ?? 0} hint="Missed in period" />
        <Kpi label="Prescriptions" value={period.prescriptions ?? 0} hint="Written in period" />
        <Kpi label="Invoices" value={period.invoices ?? 0} hint="Raised in period" />
        <Kpi label="Active Patients" value={metrics.activePatients ?? 0} hint="All time" />
      </div>

      <div className={`p-6 rounded-2xl border border-border bg-surface shadow-soft ${isFetching ? 'opacity-80' : ''}`}>
        <h3 className="font-heading font-bold text-base text-text-primary mb-1">
          {mode === 'Month' ? 'Monthly' : 'Weekly'} Patient Encounter Throughput
        </h3>
        <p className="text-xs text-text-secondary mb-6">Booked vs completed consultations per day</p>

        {noData ? (
          <div className="h-72 flex items-center justify-center text-sm text-text-secondary border border-dashed border-border rounded-xl">
            No appointments in this {mode.toLowerCase()}. Use the arrows to browse other periods.
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyLoad} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.15)" vertical={false} />
                <XAxis dataKey="day" stroke="rgb(var(--color-text-secondary))" fontSize={11} tickLine={false} />
                <YAxis allowDecimals={false} stroke="rgb(var(--color-text-secondary))" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgb(var(--color-surface))',
                    borderColor: 'rgb(var(--color-border))',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="booked" name="Booked" fill="#94a3b8" radius={[6, 6, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#26A689" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}

export default StaffReportsPage
