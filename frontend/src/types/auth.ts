export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResult {
  token: string
  token_type: 'Bearer'
  user: import('./models').User
}

export interface ProfilePayload {
  name?: string
  phone?: string | null
}

export interface PasswordPayload {
  current_password: string
  password: string
  password_confirmation: string
}
