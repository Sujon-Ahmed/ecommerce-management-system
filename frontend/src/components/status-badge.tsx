import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: 'active' | 'inactive' | string
  activeLabel?: string
  inactiveLabel?: string
  className?: string
}

export function StatusBadge({
  status,
  activeLabel = 'Active',
  inactiveLabel = 'Inactive',
  className,
}: StatusBadgeProps) {
  const isActive = status === 'active'

  return (
    <Badge
      variant={isActive ? 'success' : 'secondary'}
      className={cn('capitalize', className)}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          isActive ? 'bg-success' : 'bg-muted-foreground/60',
        )}
        aria-hidden="true"
      />
      {isActive ? activeLabel : inactiveLabel}
    </Badge>
  )
}
