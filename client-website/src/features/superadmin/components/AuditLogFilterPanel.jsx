import React, { useState, useEffect } from 'react'
import { Search, X, RotateCcw, Calendar, Filter } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Select } from '../../../components/ui/Select'

export const AuditLogFilterPanel = ({
  search,
  onSearchChange,
  role,
  onRoleChange,
  module,
  onModuleChange,
  action,
  onActionChange,
  clinicId,
  onClinicChange,
  period,
  onPeriodChange,
  from,
  to,
  onDateRangeChange,
  onResetFilters,
  filterOptions = {},
  isLoadingFilters = false,
}) => {
  const [searchInput, setSearchInput] = useState(search)

  // Debounce search input by 300ms
  useEffect(() => {
    setSearchInput(search)
  }, [search])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        onSearchChange(searchInput)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, search, onSearchChange])

  const getLocalDateString = (d = new Date()) => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const periodOptions = [
    { id: 'ALL', label: 'All Time' },
    { id: 'TODAY', label: 'Today' },
    { id: '7D', label: 'Last 7 Days' },
    { id: '30D', label: 'Last 30 Days' },
    { id: 'CUSTOM', label: 'Custom Range' },
  ]

  const handlePeriodSelect = (pid) => {
    const today = getLocalDateString(new Date())
    let newFrom = ''
    let newTo = ''

    if (pid === 'ALL') {
      newFrom = ''
      newTo = ''
    } else if (pid === 'TODAY') {
      newFrom = today
      newTo = today
    } else if (pid === '7D') {
      const past = new Date()
      past.setDate(past.getDate() - 7)
      newFrom = getLocalDateString(past)
      newTo = today
    } else if (pid === '30D') {
      const past = new Date()
      past.setDate(past.getDate() - 30)
      newFrom = getLocalDateString(past)
      newTo = today
    } else if (pid === 'CUSTOM') {
      newFrom = from || getLocalDateString(new Date(Date.now() - 7 * 86400000))
      newTo = to || today
    }

    onPeriodChange(pid, newFrom, newTo)
  }

  const hasActiveFilters =
    Boolean(search) ||
    role !== 'ALL' ||
    module !== 'ALL' ||
    action !== 'ALL' ||
    clinicId !== 'ALL' ||
    period !== 'ALL' ||
    Boolean(from) ||
    Boolean(to)

  return (
    <div className="p-5 rounded-2xl border border-border bg-surface shadow-soft space-y-4">
      {/* Top Filter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Search Input */}
        <div className="lg:col-span-1 relative">
          <label className="block text-xs font-semibold text-text-primary mb-1.5">
            Search
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Actor, action, clinic..."
              className="w-full rounded-xl border border-border bg-surface/80 pl-9 pr-8 py-2 text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('')
                  onSearchChange('')
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-border/40 transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Role Filter */}
        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1.5">
            Role
          </label>
          <Select
            value={role}
            onChange={(e) => onRoleChange(e.target.value)}
            disabled={isLoadingFilters}
          >
            <option value="ALL">All Roles</option>
            {(filterOptions.roles || []).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </div>

        {/* Module Filter */}
        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1.5">
            Module
          </label>
          <Select
            value={module}
            onChange={(e) => onModuleChange(e.target.value)}
            disabled={isLoadingFilters}
          >
            <option value="ALL">All Modules</option>
            {(filterOptions.modules || []).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </div>

        {/* Action Filter */}
        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1.5">
            Action Event
          </label>
          <Select
            value={action}
            onChange={(e) => onActionChange(e.target.value)}
            disabled={isLoadingFilters}
          >
            <option value="ALL">All Actions</option>
            {(filterOptions.actions || []).map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Select>
        </div>

        {/* Clinic Scope Filter */}
        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1.5">
            Clinic Scope
          </label>
          <Select
            value={clinicId}
            onChange={(e) => onClinicChange(e.target.value)}
            disabled={isLoadingFilters}
          >
            <option value="ALL">All Clinics</option>
            {(filterOptions.clinics || []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Period Chips & Custom Date Range Row */}
      <div className="pt-3.5 border-t border-border flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-semibold text-text-secondary flex items-center gap-1.5 mr-0.5 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            Time Period:
          </span>

          {/* Segmented Pill Group */}
          <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-surface-muted/60 dark:bg-surface-muted/40 rounded-xl border border-border/70 shadow-sm">
            {periodOptions.map((p) => {
              const isActive = period === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePeriodSelect(p.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-sm ring-1 ring-primary/30 font-semibold'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface/80'
                  }`}
                >
                  {p.label}
                </button>
              )
            })}
          </div>

          {/* Custom Date Inputs if Custom Range selected */}
          {period === 'CUSTOM' && (
            <div className="flex items-center gap-1.5 p-1 px-2.5 bg-surface-muted/60 dark:bg-surface-muted/40 rounded-xl border border-border/70 animate-fadeIn">
              <span className="text-[11px] font-medium text-text-secondary">From:</span>
              <input
                type="date"
                value={from}
                onChange={(e) => onDateRangeChange(e.target.value, to)}
                className="text-xs px-2 py-1 rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                title="From Date"
              />
              <span className="text-[11px] font-medium text-text-secondary">To:</span>
              <input
                type="date"
                value={to}
                onChange={(e) => onDateRangeChange(from, e.target.value)}
                className="text-xs px-2 py-1 rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                title="To Date"
              />
            </div>
          )}
        </div>

        {/* Reset Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            leftIcon={<RotateCcw className="w-3.5 h-3.5 text-text-secondary" />}
            className="text-xs text-text-secondary hover:text-danger self-start xl:self-auto shrink-0"
          >
            Reset All Filters
          </Button>
        )}
      </div>
    </div>
  )
}

export default AuditLogFilterPanel
