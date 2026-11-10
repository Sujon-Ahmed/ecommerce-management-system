import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: number | string
  hint?: string
  icon: LucideIcon
  tone?: 'primary' | 'success' | 'warning' | 'muted'
  loading?: boolean
}

const toneClasses: Record<NonNullable<StatCardProps['tone']>, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/12 text-success',
  warning: 'bg-warning/20 text-accent-foreground',
  muted: 'bg-muted text-muted-foreground',
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'primary',
  loading = false,
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-5 sm:p-5">
        <div
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-lg',
            toneClasses[tone],
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 space-y-0.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          {loading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <p className="text-2xl font-semibold tabular-nums">{value}</p>
          )}
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  )
}
