import type * as React from 'react'
import { cn } from '@/lib/utils'

export function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      className={cn(
        'flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60 file:border-0 file:bg-transparent file:text-sm file:font-medium aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/20',
        className,
      )}
      {...props}
    />
  )
}
