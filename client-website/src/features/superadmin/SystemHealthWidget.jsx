import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { HeartPulse, Cpu, Database, Server, RefreshCw, CheckCircle2 } from 'lucide-react'
import { api } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { SkeletonCard } from '../../components/ui/Skeleton'

export const SystemHealthWidget = () => {
  const { data: health, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['superadmin', 'health'],
    queryFn: async () => {
      const res = await api.get('/api/superadmin/health')
      return res.data?.data || res.data
    },
    refetchInterval: 15000, // Poll every 15s for live telemetry
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  const isDbHealthy = health?.database?.status === 'healthy' || health?.databaseStatus === 'CONNECTED'
  const isRedisHealthy = health?.redis?.status === 'healthy' || health?.redisStatus === 'CONNECTED'
  const isOverallHealthy = health?.status === 'operational' || health?.status === 'healthy'
  const isOverallDegraded = health?.status === 'degraded'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl text-text-primary flex items-center gap-2.5">
            <HeartPulse className="w-6 h-6 text-primary" />
            Infrastructure Telemetry & Observability
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Live health checks across backend API gateway, Redis cache & memory store, and PostgreSQL replica sets
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => refetch()}
          isLoading={isFetching}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Ping Cluster
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* API Gateway */}
        <div className="p-6 rounded-2xl border border-border bg-surface shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              REST API Gateway
            </span>
            <Server className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="font-heading font-extrabold text-3xl text-text-primary">
              {health?.apiLatencyMs != null ? `${health.apiLatencyMs} ms` : '—'}
            </div>
            <div className="text-xs text-text-secondary mt-1">Round-trip endpoint latency</div>
          </div>
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <Badge
              variant={isOverallHealthy ? 'success' : isOverallDegraded ? 'warning' : 'danger'}
              size="sm"
              dot
            >
              {(health?.status || 'UNKNOWN').toUpperCase()}
            </Badge>
            <span className="text-[11px] text-text-secondary">
              Uptime: {health?.uptimeSeconds != null ? `${(health.uptimeSeconds / 3600).toFixed(1)} hrs` : '—'}
            </span>
          </div>
        </div>

        {/* Database */}
        <div className="p-6 rounded-2xl border border-border bg-surface shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              PostgreSQL Multi-Tenant DB
            </span>
            <Database className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <div className="font-heading font-bold text-base text-text-primary">
              {health?.database?.status ? health.database.status.toUpperCase() : (health?.databaseStatus || '—')}
            </div>
            <div className="text-xs text-text-secondary mt-1">
              Query Latency: {health?.database?.latencyMs != null ? `${health.database.latencyMs} ms` : '—'}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <Badge
              variant={isDbHealthy ? 'success' : 'danger'}
              size="sm"
              dot
            >
              {isDbHealthy ? 'OPERATIONAL' : 'DOWN'}
            </Badge>
            <span className="text-[11px] text-text-secondary">
              Latency: {health?.database?.latencyMs != null ? `${health.database.latencyMs} ms` : '—'}
            </span>
          </div>
        </div>

        {/* Redis Cache */}
        <div className="p-6 rounded-2xl border border-border bg-surface shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Redis Cache
            </span>
            <Cpu className="w-5 h-5 text-info" />
          </div>
          <div>
            <div className="font-heading font-bold text-base text-text-primary">
              {health?.redis?.status ? health.redis.status.toUpperCase() : (health?.redisStatus || '—')}
            </div>
            <div className="text-xs text-text-secondary mt-1">
              Cache Latency: {health?.redis?.latencyMs != null ? `${health.redis.latencyMs} ms` : '—'}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <Badge
              variant={isRedisHealthy ? 'success' : 'warning'}
              size="sm"
              dot
            >
              {isRedisHealthy ? 'OPERATIONAL' : 'DEGRADED'}
            </Badge>
            <span className="text-[11px] text-text-secondary">
              Mem: {health?.memory?.heapUsedMB ?? health?.memoryUsageMb ?? '—'} MB | CPU: {health?.cpuUsagePercent != null ? `${health.cpuUsagePercent}%` : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SystemHealthWidget
