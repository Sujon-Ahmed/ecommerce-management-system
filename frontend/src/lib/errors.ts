import axios from 'axios'
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'

export interface ErrorEnvelope {
  message?: string
  code?: string
  errors?: Record<string, string[]>
}

export class ApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly fieldErrors: Record<string, string[]>

  constructor(
    message: string,
    status = 0,
    code?: string,
    fieldErrors: Record<string, string[]> = {},
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error
  }

  if (axios.isAxiosError(error)) {
    const response = error.response
    const payload = response?.data as ErrorEnvelope | undefined

    if (payload && typeof payload === 'object' && typeof payload.message === 'string') {
      return new ApiError(
        payload.message,
        response?.status ?? 0,
        payload.code,
        payload.errors ?? {},
      )
    }

    const fallback = response
      ? `Request failed with status ${response.status}.`
      : 'Cannot reach the API. Check that the backend server is running.'

    return new ApiError(fallback, response?.status ?? 0)
  }

  if (error instanceof Error) {
    return new ApiError(error.message)
  }

  return new ApiError('An unexpected error occurred.')
}

/**
 * Copy Laravel validation errors onto the matching react-hook-form fields.
 */
export function applyFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
): ApiError {
  const apiError = toApiError(error)

  for (const [field, messages] of Object.entries(apiError.fieldErrors)) {
    const message = messages[0]

    if (!message) {
      continue
    }

    setError(field as Path<T>, { type: 'server', message })
  }

  return apiError
}

export function errorMessage(error: unknown): string {
  return toApiError(error).message
}
