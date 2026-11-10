import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

interface SwitchFieldProps {
  id: string
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

export function SwitchField({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
  className,
}: SwitchFieldProps) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 rounded-lg border bg-muted/30 px-3 py-2.5',
        className,
      )}
    >
      <div className="space-y-0.5">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  )
}
