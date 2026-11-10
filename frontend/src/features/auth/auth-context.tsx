/* oxlint-disable react/only-export-components */
import { useQueryClient } from '@tanstack/react-query'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { loginRequest, logoutRequest, meRequest } from '@/features/auth/api'
import { UNAUTHORIZED_EVENT } from '@/lib/api'
import { clearToken, getToken, setToken } from '@/lib/token'
import type { LoginPayload } from '@/types/auth'
import type { User } from '@/types/models'

export type AuthStatus = 'loading' | 'authenticated' | 'guest'

interface AuthContextValue {
  user: User | null
  status: AuthStatus
  isAdmin: boolean
  isShopOwner: boolean
  login: (payload: LoginPayload) => Promise<User>
  logout: () => Promise<void>
  setUser: (user: User) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUserState] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  useEffect(() => {
    let active = true

    async function bootstrap() {
      if (!getToken()) {
        setStatus('guest')
        return
      }

      try {
        const current = await meRequest()

        if (active) {
          setUserState(current)
          setStatus('authenticated')
        }
      } catch {
        clearToken()

        if (active) {
          setUserState(null)
          setStatus('guest')
        }
      }
    }

    void bootstrap()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    function handleUnauthorized() {
      setUserState(null)
      setStatus('guest')
      queryClient.clear()
    }

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)

    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [queryClient])

  const login = useCallback(async (payload: LoginPayload) => {
    const result = await loginRequest(payload)
    setToken(result.token)
    setUserState(result.user)
    setStatus('authenticated')

    return result.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } catch {
      // The token may already be invalid; local cleanup still applies.
    }

    clearToken()
    setUserState(null)
    setStatus('guest')
    queryClient.clear()
  }, [queryClient])

  const setUser = useCallback((next: User) => {
    setUserState(next)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isAdmin: user?.roles.includes('admin') ?? false,
      isShopOwner: user?.roles.includes('shop_owner') ?? false,
      login,
      logout,
      setUser,
    }),
    [user, status, login, logout, setUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }

  return context
}
