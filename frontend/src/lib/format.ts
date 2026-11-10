const currencyFormatter = new Intl.NumberFormat('en-BD', {
  style: 'currency',
  currency: 'BDT',
  maximumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatBdt(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  const amount = typeof value === 'string' ? Number.parseFloat(value) : value

  if (Number.isNaN(amount)) {
    return '—'
  }

  return currencyFormatter.format(amount)
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return '—'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return dateFormatter.format(date)
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return '—'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return dateTimeFormatter.format(date)
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) {
    return '?'
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function titleCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ')
}

export function formatCount(value: number | undefined | null): string {
  return new Intl.NumberFormat('en-US').format(value ?? 0)
}
