import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { FullPageLoader } from '@/components/states'
import { useAuth } from '@/features/auth/auth-context'
import { homePathFor } from '@/features/auth/home-path'
import type { Role } from '@/types/models'

interface FromState {
  from?: string
}

export function RequireAuth() {
  const { status, user } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <FullPageLoader />
  }

  if (!user) {
    const from = `${location.pathname}${location.search}`

    return <Navigate to="/login" replace state={{ from } satisfies FromState} />
  }

  return <Outlet />
}

export function RequireRole({ roles }: { roles: Role[] }) {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const allowed = roles.some((role) => user.roles.includes(role))

  if (!allowed) {
    return <Navigate to="/403" replace />
  }

  return <Outlet />
}

export function GuestOnly() {
  const { status, user } = useAuth()

  if (status === 'loading') {
    return <FullPageLoader />
  }

  if (user) {
    return <Navigate to={homePathFor(user)} replace />
  }

  return <Outlet />
}
