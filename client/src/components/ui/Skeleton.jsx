import React from 'react'

export const Skeleton = ({ className = '', ...props }) => {
  return (
    <div
      className={`animate-pulse rounded-xl bg-border/60 ${className}`}
      {...props}
    />
  )
}

export const SkeletonCard = ({ className = '' }) => {
  return (
    <div className={`p-5 rounded-xl border border-border bg-surface/50 flex flex-col gap-4 ${className}`}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-8 w-36" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}

export const SkeletonTable = ({ rows = 5, cols = 4, className = '' }) => {
  return (
    <div className={`w-full rounded-xl border border-border bg-surface/30 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center gap-4 bg-surface/60">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="p-4 flex items-center gap-4">
            {Array.from({ length: cols }).map((_, cIdx) => (
              <Skeleton
                key={cIdx}
                className={`h-4 flex-1 ${cIdx === 0 ? 'w-1/3' : 'w-full'}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export const SkeletonChart = ({ className = '' }) => {
  return (
    <div className={`p-6 rounded-xl border border-border bg-surface/40 flex flex-col gap-4 ${className}`}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      <div className="h-64 flex items-end gap-3 pt-6">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t-lg"
            style={{ height: `${20 + ((i * 37) % 75)}%` }}
          />
        ))}
      </div>
    </div>
  )
}

export default Skeleton
