import { ArrowRight, LayoutDashboard, Store } from 'lucide-react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/auth-context'
import { homePathFor } from '@/features/auth/home-path'
import { cn } from '@/lib/utils'

export function StorefrontLayout() {
  const { user } = useAuth()
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/favicon.svg" alt="" className="size-9 rounded-lg" />
            <div className="leading-tight">
              <p className="text-sm font-semibold">ShopSphere</p>
              <p className="text-[11px] text-muted-foreground">Multi-shop commerce</p>
            </div>
          </Link>

          <nav className="flex items-center gap-2" aria-label="Storefront">
            <Button
              asChild
              variant={isHome ? 'secondary' : 'ghost'}
              size="sm"
              className="hidden sm:inline-flex"
            >
              <Link to="/">
                <Store />
                Browse shops
              </Link>
            </Button>

            {user ? (
              <Button asChild size="sm">
                <Link to={homePathFor(user)}>
                  <LayoutDashboard />
                  Dashboard
                </Link>
              </Button>
            ) : (
              <Button asChild size="sm">
                <Link to="/login">
                  Sign in
                  <ArrowRight />
                </Link>
              </Button>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 lg:px-8 lg:py-10">
        <Outlet />
      </main>

      <footer className="border-t bg-card">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>ShopSphere — built for the CSN Bangladesh technical assessment.</p>
          <div className="flex items-center gap-4">
            <Link to="/" className={cn('hover:text-foreground', isHome && 'text-foreground')}>
              Shops
            </Link>
            <Link to="/login" className="hover:text-foreground">
              Staff sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
