import { cn } from '@/lib/utils'

interface EntityThumbProps {
  src?: string | null
  alt: string
  fallback: string
  className?: string
}

export function EntityThumb({ src, alt, fallback, className }: EntityThumbProps) {
  return (
    <div
      className={cn(
        'flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted text-xs font-semibold uppercase text-muted-foreground',
        className,
      )}
    >
      {src ? (
        <img src={src} alt={alt} className="size-full object-cover" loading="lazy" />
      ) : (
        <span aria-hidden="true">{fallback.slice(0, 2)}</span>
      )}
    </div>
  )
}
