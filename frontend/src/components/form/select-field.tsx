import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from 'react-hook-form'
import { Field } from '@/components/form/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface SelectOption {
  value: string
  label: string
}

interface SelectFieldProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  options: SelectOption[]
  label?: string
  id?: string
  placeholder?: string
  error?: string
  hint?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export function SelectField<T extends FieldValues>({
  control,
  name,
  options,
  label,
  id,
  placeholder = 'Select an option',
  error,
  hint,
  required = false,
  disabled = false,
  className,
}: SelectFieldProps<T>) {
  const inputId = id ?? String(name)

  const select = (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Select
          value={field.value === undefined || field.value === null || field.value === '' ? undefined : String(field.value)}
          onValueChange={field.onChange}
          disabled={disabled}
        >
          <SelectTrigger
            id={inputId}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className={className}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  )

  if (!label) {
    return select
  }

  return (
    <Field
      label={label}
      htmlFor={inputId}
      error={error}
      hint={hint}
      required={required}
    >
      {select}
    </Field>
  )
}
