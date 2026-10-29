import React from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { Button } from './Button'

/**
 * Generates an array of page numbers and ellipsis tokens
 * e.g. [1, '...', 4, 5, 6, '...', 20]
 */
export const getPageRange = (currentPage, totalPages) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, '...', totalPages]
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      '...',
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ]
  }

  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages]
}

export const Pagination = ({
  page = 1,
  totalPages = 1,
  total = 0,
  limit = 10,
  onPageChange,
  entryLabel = 'audit entries',
  className = '',
}) => {
  const safePage = Math.max(1, Math.min(page, Math.max(1, totalPages)))
  const startRecord = total > 0 ? (safePage - 1) * limit + 1 : 0
  const endRecord = total > 0 ? Math.min(safePage * limit, total) : 0

  const pages = getPageRange(safePage, totalPages)

  const handlePageClick = (p) => {
    if (typeof p === 'number' && p >= 1 && p <= totalPages && p !== safePage) {
      onPageChange(p)
    }
  }

  return (
    <nav
      role="navigation"
      aria-label="Pagination Navigation"
      className={`px-4 sm:px-6 py-4 border-t border-border bg-surface/60 flex flex-col md:flex-row md:items-center justify-between gap-4 ${className}`}
    >
      {/* 1. Showing range info */}
      <div className="text-xs text-text-secondary font-medium text-center md:text-left">
        {total > 0 ? (
          <>
            Showing{' '}
            <span className="text-text-primary font-semibold">{startRecord}</span> to{' '}
            <span className="text-text-primary font-semibold">{endRecord}</span> of{' '}
            <span className="text-text-primary font-semibold">
              {total.toLocaleString()}
            </span>{' '}
            {entryLabel}
          </>
        ) : (
          `0 ${entryLabel}`
        )}
      </div>

      {/* 2. Controls & Numbered buttons */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
        {/* Page X of Y Badge */}
        <span className="text-xs text-text-secondary font-medium mr-1.5 hidden lg:inline">
          Page <strong className="text-text-primary">{safePage}</strong> of{' '}
          <strong className="text-text-primary">{Math.max(1, totalPages)}</strong>
        </span>

        {/* First Page Button */}
        <Button
          variant="secondary"
          size="xs"
          disabled={safePage <= 1}
          onClick={() => handlePageClick(1)}
          aria-label="Go to first page"
          title="First page"
          className="!px-2 h-7"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline ml-1 text-[11px]">First</span>
        </Button>

        {/* Previous Page Button */}
        <Button
          variant="secondary"
          size="xs"
          disabled={safePage <= 1}
          onClick={() => handlePageClick(safePage - 1)}
          aria-label="Go to previous page"
          title="Previous page"
          className="!px-2 h-7"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline ml-1 text-[11px]">Prev</span>
        </Button>

        {/* Numbered Page Buttons with Ellipsis */}
        <div className="flex items-center gap-1" role="group" aria-label="Page selection">
          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-7 h-7 flex items-center justify-center text-xs text-text-secondary select-none font-bold"
                >
                  …
                </span>
              )
            }

            const isCurrent = p === safePage

            return (
              <button
                key={p}
                type="button"
                onClick={() => handlePageClick(p)}
                aria-label={`Page ${p}`}
                aria-current={isCurrent ? 'page' : undefined}
                className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                  isCurrent
                    ? 'bg-primary text-white shadow-sm ring-1 ring-primary'
                    : 'bg-surface hover:bg-border/60 text-text-secondary hover:text-text-primary border border-border'
                }`}
              >
                {p}
              </button>
            )
          })}
        </div>

        {/* Next Page Button */}
        <Button
          variant="secondary"
          size="xs"
          disabled={safePage >= totalPages}
          onClick={() => handlePageClick(safePage + 1)}
          aria-label="Go to next page"
          title="Next page"
          className="!px-2 h-7"
        >
          <span className="hidden sm:inline mr-1 text-[11px]">Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>

        {/* Last Page Button */}
        <Button
          variant="secondary"
          size="xs"
          disabled={safePage >= totalPages}
          onClick={() => handlePageClick(totalPages)}
          aria-label="Go to last page"
          title="Last page"
          className="!px-2 h-7"
        >
          <span className="hidden sm:inline mr-1 text-[11px]">Last</span>
          <ChevronsRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </nav>
  )
}

export default Pagination

