import axios, { type AxiosRequestConfig } from 'axios'
import { clearToken, getToken } from '@/lib/token'
import type { ApiEnvelope, QueryParams } from '@/types/api'

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'

export const UNAUTHORIZED_EVENT = 'shopsphere:unauthorized'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20_000,
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = getToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url ?? ''

      if (!url.includes('auth/login')) {
        clearToken()
        window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
      }
    }

    return Promise.reject(error)
  },
)

export async function apiGet<T>(
  url: string,
  params?: QueryParams,
  config?: AxiosRequestConfig,
): Promise<ApiEnvelope<T>> {
  const response = await api.get<ApiEnvelope<T>>(url, { ...config, params })
  return response.data
}

export async function apiPost<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<ApiEnvelope<T>> {
  const response = await api.post<ApiEnvelope<T>>(url, body, config)
  return response.data
}

export async function apiPut<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<ApiEnvelope<T>> {
  const response = await api.put<ApiEnvelope<T>>(url, body, config)
  return response.data
}

export async function apiDelete<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<ApiEnvelope<T>> {
  const response = await api.delete<ApiEnvelope<T>>(url, config)
  return response.data
}
