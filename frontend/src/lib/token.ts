const TOKEN_KEY = 'shopsphere.token'

export function getToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string): void {
  try {
    window.localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // Storage can be unavailable (private mode); the in-memory session still works.
  }
}

export function clearToken(): void {
  try {
    window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Ignore unavailable storage.
  }
}
