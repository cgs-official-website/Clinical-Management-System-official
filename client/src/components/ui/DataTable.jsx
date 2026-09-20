import React, { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
} from 'lucide-react'
import { SkeletonTable } from './Skeleton'
import { EmptyState } from './EmptyState'

export const DataTable = ({
  columns = [],
  data = [],
  isLoading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no records matching your query.',
  page = 1,
  pageSize = 10,
  totalCount,
  onPageChange,
  searchPlaceholder = 'Search records...',
  searchValue,
  onSearchChange,
  onRowClick,
}) => {
  const [internalSortField, setInternalSortField] = useState(null)
  const [internalSortDirection, setInternalSortDirection] = useState('asc')

  const total = totalCount !== undefined ? totalCount : data.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const handleSort = (key) => {
    if (internalSortField === key) {
      setInternalSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setInternalSortField(key)
      setInternalSortDirection('asc')
    }
  }

  // Render sorting arrow
  const renderSortIcon = (col) => {
    if (!col.sortable) return null
    if (internalSortField !== col.key) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-text-secondary/50 ml-1 inline" />
    }
    return internalSortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-primary ml-1 inline" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-primary ml-1 inline" />
    )
  }

  if (isLoading) {
    return <SkeletonTable rows={pageSize > 6 ? 6 : pageSize} cols={columns.length} />
  }

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Top filter bar if search enabled */}
      {onSearchChange !== undefined && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-surface border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="text-xs text-text-secondary self-start sm:self-center whitespace-nowrap">
            Showing <span className="font-semibold text-text-primary">{data.length}</span> of{' '}
            <span className="font-semibold text-text-primary">{total}</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {data.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <>
          {/* Desktop Table: Hidden below md */}
          <div className="hidden md:block w-full overflow-x-auto rounded-xl border border-border bg-surface/40 shadow-soft">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface/80 text-text-secondary font-semibold uppercase tracking-wider">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => col.sortable && handleSort(col.key)}
                      className={`py-3.5 px-4 ${col.sortable ? 'cursor-pointer select-none hover:text-text-primary' : ''} ${
                        col.className || ''
                      }`}
                    >
                      <div className="flex items-center">
                        <span>{col.label}</span>
                        {renderSortIcon(col)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((row, rIdx) => (
                  <tr
                    key={row.id || rIdx}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={`transition-colors hover:bg-surface/90 ${
                      onRowClick ? 'cursor-pointer' : ''
                    }`}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={`py-3.5 px-4 text-text-primary ${col.className || ''}`}>
                        {col.render ? col.render(row[col.key], row, rIdx) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Card List: Visible below md */}
          <div className="md:hidden flex flex-col gap-3">
            {data.map((row, rIdx) => (
              <div
                key={row.id || rIdx}
                onClick={() => onRowClick && onRowClick(row)}
                className={`p-4 rounded-xl border border-border bg-surface shadow-soft flex flex-col gap-2.5 ${
                  onRowClick ? 'cursor-pointer active:scale-[0.99]' : ''
                }`}
              >
                {columns.map((col) => (
                  <div key={col.key} className="flex items-start justify-between gap-2 text-xs">
                    <span className="text-text-secondary font-medium shrink-0">
                      {col.label}:
                    </span>
                    <span className="text-text-primary font-medium text-right">
                      {col.render ? col.render(row[col.key], row, rIdx) : row[col.key]}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && onPageChange && (
            <div className="flex items-center justify-between px-2 py-3">
              <span className="text-xs text-text-secondary">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={page <= 1}
                  onClick={() => onPageChange(page - 1)}
                  className="p-2 rounded-lg border border-border bg-surface text-text-primary disabled:opacity-40 disabled:cursor-not-allowed hover:bg-border/30 transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => onPageChange(page + 1)}
                  className="p-2 rounded-lg border border-border bg-surface text-text-primary disabled:opacity-40 disabled:cursor-not-allowed hover:bg-border/30 transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default DataTable
