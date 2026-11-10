import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PaginationMeta } from '@/types/api'

interface PaginationProps {
  meta?: PaginationMeta
  onPageChange: (page: number) => void
  disabled?: boolean
}

export function Pagination({ meta, onPageChange, disabled = false }: PaginationProps) {
  if (!meta) {
    return null
  }

  const { current_page: currentPage, last_page: lastPage, from, to, total } = meta

  return (
    <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">
        {total === 0
          ? 'No results'
          : `Showing ${from ?? 0}–${to ?? 0} of ${total}`}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft />
          Previous
        </Button>
        <span className="px-1 text-xs font-medium text-muted-foreground">
          Page {currentPage} of {Math.max(lastPage, 1)}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || currentPage >= lastPage}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
          <ChevronRight />
        </Button>
      </div>
    </div>
  )
}
