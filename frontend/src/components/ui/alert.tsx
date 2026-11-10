import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import type * as React from 'react'
import { cn } from '@/lib/utils'

const tones = {
  info: {
    container: 'border-primary/20 bg-primary/5 text-foreground',
    icon: Info,
    iconClass: 'text-primary',
  },
  success: {
    container: 'border-success/25 bg-success/8 text-foreground',
    icon: CheckCircle2,
    iconClass: 'text-success',
  },
  destructive: {
    container: 'border-destructive/30 bg-destructive/8 text-foreground',
    icon: AlertTriangle,
    iconClass: 'text-destructive',
  },
} as const

interface AlertProps extends React.ComponentProps<'div'> {
  tone?: keyof typeof tones
}

export function Alert({
  tone = 'info',
  className,
  children,
  ...props
}: AlertProps) {
  const config = tones[tone]
  const Icon = config.icon

  return (
    <div
      role={tone === 'destructive' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm',
        config.container,
        className,
      )}
      {...props}
    >
      <Icon className={cn('mt-0.5 size-4 shrink-0', config.iconClass)} aria-hidden="true" />
      <div className="min-w-0 space-y-0.5">{children}</div>
    </div>
  )
}
