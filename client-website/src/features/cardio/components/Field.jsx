import React from 'react'

export const Checkbox = ({ label, checked, onChange }) => (
    <label className="flex items-center gap-2 text-xs font-medium text-text-primary cursor-pointer select-none">
        <input
            type="checkbox"
            checked={!!checked}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 rounded border-border accent-[var(--color-primary,#10b981)]"
        />
        {label}
    </label>
)

export const Stat = ({ label, value, unit }) => (
    <div className="p-3 rounded-xl border border-border bg-surface-secondary/40">
        <span className="text-[11px] text-text-muted uppercase font-semibold">{label}</span>
        <p className="text-base font-bold text-text-primary mt-0.5">
            {value === null || value === undefined || value === '' ? '-' : value}
            {value !== null && value !== undefined && value !== '' && unit ? ` ${unit}` : ''}
        </p>
    </div>
)
