import React from 'react'
import { FolderOpen } from 'lucide-react'
import { Button } from './Button'

export const EmptyState = ({
  icon: Icon = FolderOpen,
  title = 'No records found',
  description = 'There are no items matching your criteria or currently available in the system.',
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-6 sm:p-8 md:p-12 text-center rounded-xl border border-dashed border-border bg-surface/30 ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 ring-8 ring-primary/5">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-1">{title}</h3>
      <p className="text-xs text-text-secondary max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

export default EmptyState
