export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export interface ApiEnvelope<T> {
  success: boolean
  message: string
  data: T
  meta?: PaginationMeta
  code?: string
  errors?: Record<string, string[]>
}

export type QueryValue = string | number | boolean | null | undefined

export type QueryParams = Record<string, QueryValue>
