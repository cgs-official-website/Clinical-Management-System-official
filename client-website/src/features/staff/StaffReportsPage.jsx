import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, TrendingUp, CheckCircle2, Clock } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { api } from '../../lib/api'
import { SkeletonChart } from '../../components/ui/Skeleton'
import { Badge } from '../../components/ui/Badge'

export const StaffReportsPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['staff', 'reports'],
    queryFn: async () => {
      const res = await api.get('/api/staff/reports')
      return res.data
    },
  })

  if (isLoading) {
    return <SkeletonChart />
  }

  const { personalMetrics, weeklyLoad = [] } = data || {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-extrabold text-2xl text-text-primary">
          Clinician Workload & Performance Metrics
        </h1>
        <p className="text-xs text-text-secondary mt-0.5">
          Role-scoped operational metrics tracking patient consultations and clinical encounter throughput
        </p>
      </div>

      <div className="p-6 rounded-2xl border border-border bg-surface shadow-soft">
        <h3 className="font-heading font-bold text-base text-text-primary mb-1">
          Weekly Patient Encounter Throughput
        </h3>
        <p className="text-xs text-text-secondary mb-6">
          Daily completed consultations by care provider
        </p>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyLoad} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.15)" vertical={false} />
              <XAxis dataKey="day" stroke="rgb(var(--color-text-secondary))" fontSize={11} tickLine={false} />
              <YAxis stroke="rgb(var(--color-text-secondary))" fontSize={11} tickLine={false} />
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
    </div>
  )
}

export default StaffReportsPage
