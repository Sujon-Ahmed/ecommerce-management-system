import { AlertTriangle, SearchX } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface EmptyStateProps {
  title: string
  description: string
  action?: ReactNode
  icon?: ReactNode
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon ?? <SearchX className="size-5" aria-hidden="true" />}
      </div>
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  )
}

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-5" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="font-medium">Something went wrong</p>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          {message ?? 'The data could not be loaded. Please try again.'}
        </p>
      </div>
      {onRetry ? (
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  )
}

export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4">
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <Skeleton
              key={columnIndex}
              className={columnIndex === 0 ? 'h-10 w-1/3' : 'h-4 flex-1'}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function ErrorCard({ message, onRetry }: ErrorStateProps) {
  return (
    <Card>
      <ErrorState message={message} onRetry={onRetry} />
    </Card>
  )
}

export function FullPageLoader() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background">
      <div className="flex size-11 animate-pulse items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
        S
      </div>
      <p className="text-sm text-muted-foreground">Loading ShopSphere…</p>
    </div>
  )
}
