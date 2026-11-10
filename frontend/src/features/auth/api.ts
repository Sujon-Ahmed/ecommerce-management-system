import { apiGet, apiPost, apiPut } from '@/lib/api'
import type {
  LoginPayload,
  LoginResult,
  PasswordPayload,
  ProfilePayload,
} from '@/types/auth'
import type { User } from '@/types/models'

export async function loginRequest(payload: LoginPayload): Promise<LoginResult> {
  const response = await apiPost<LoginResult>('/auth/login', payload)
  return response.data
}

export async function meRequest(): Promise<User> {
  const response = await apiGet<User>('/auth/me')
  return response.data
}

export async function logoutRequest(): Promise<void> {
  await apiPost<null>('/auth/logout')
}

export async function updateProfileRequest(payload: ProfilePayload): Promise<User> {
  const response = await apiPut<User>('/auth/profile', payload)
  return response.data
}

export async function updatePasswordRequest(payload: PasswordPayload): Promise<void> {
  await apiPut<null>('/auth/password', payload)
}
