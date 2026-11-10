import {
  ChevronsUpDown,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingBag,
  Store,
  Users,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { EmptyState } from '@/components/states'
import { useAuth } from '@/features/auth/auth-context'
import { useOptionalShopContext } from '@/features/shop-owner/shop-context'
import { initials } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Shop } from '@/types/models'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
}

function navItems(isAdmin: boolean, isShopOwner: boolean): NavItem[] {
  if (isAdmin) {
    return [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/admin/shops', label: 'Shops', icon: Store },
      { to: '/admin/shop-owners', label: 'Shop owners', icon: Users },
      { to: '/admin/products', label: 'Products', icon: Package },
    ]
  }

  if (isShopOwner) {
    return [
      { to: '/shop-owner', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/shop-owner/shop', label: 'My shop', icon: Store },
      { to: '/shop-owner/catalog', label: 'Catalog', icon: ShoppingBag },
      { to: '/shop-owner/products', label: 'My products', icon: Package },
    ]
  }

  return []
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <img src="/favicon.svg" alt="" className="size-9 rounded-lg" />
      <div>
        <p className="text-sm font-semibold leading-none text-sidebar-foreground">
          ShopSphere
        </p>
        <p className="mt-1 text-[11px] text-sidebar-muted">Multi-shop commerce</p>
      </div>
    </Link>
  )
}

function ShopSwitcher({ shops }: { shops: Shop[] }) {
  const context = useOptionalShopContext()

  if (!context) {
    return null
  }

  if (shops.length === 1) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/40 px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-sidebar-foreground">
            {context.selectedShop.name}
          </p>
          <p className="text-[11px] text-sidebar-muted">Active shop</p>
        </div>
        <Badge variant="outline" className="border-sidebar-border text-sidebar-muted">
          Shop
        </Badge>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <p className="px-1 text-[11px] font-medium uppercase tracking-wide text-sidebar-muted">
        Active shop
      </p>
      <Select
        value={String(context.selectedShopId)}
        onValueChange={(value) => context.setSelectedShopId(Number(value))}
      >
        <SelectTrigger className="h-auto border-sidebar-border bg-sidebar-accent/40 py-2 text-sidebar-foreground">
          <SelectValue />
          <ChevronsUpDown className="size-4 opacity-60" />
        </SelectTrigger>
        <SelectContent>
          {shops.map((shop) => (
            <SelectItem key={shop.id} value={String(shop.id)}>
              <span className="flex items-center gap-2">
                <span className="truncate">{shop.name}</span>
                {shop.status !== 'active' ? (
                  <span className="text-xs text-muted-foreground">(inactive)</span>
                ) : null}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, isAdmin, isShopOwner, logout } = useAuth()
  const shopContext = useOptionalShopContext()
  const navigate = useNavigate()
  const items = navItems(isAdmin, isShopOwner)

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-full flex-col gap-5 p-4">
      <Brand />

      {shopContext ? <ShopSwitcher shops={shopContext.shops} /> : null}

      <nav className="flex-1 space-y-1" aria-label="Main navigation">
        {items.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                )
              }
            >
              <Icon className="size-4" aria-hidden="true" />
              {item.label}
            </NavLink>
          )
        })}

        <div className="my-2 h-px bg-sidebar-border" aria-hidden="true" />

        <NavLink
          to="/account"
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
            )
          }
        >
          <Settings className="size-4" aria-hidden="true" />
          Account settings
        </NavLink>

        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-muted transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
        >
          <ExternalLink className="size-4" aria-hidden="true" />
          View storefront
        </Link>
      </nav>

      <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/30 p-3">
        <p className="truncate text-sm font-medium text-sidebar-foreground">
          {user?.name}
        </p>
        <p className="truncate text-xs text-sidebar-muted">{user?.email}</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="mt-2 w-full justify-start text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <LogOut />
          Sign out
        </Button>
      </div>
    </div>
  )
}

function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!user) {
    return null
  }

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 gap-2 px-2">
          <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {initials(user.name)}
          </span>
          <span className="hidden text-sm font-medium sm:inline">{user.name}</span>
          <ChevronsUpDown className="size-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel className="space-y-0.5">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs font-normal text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate('/account')}>
          <Settings />
          Account settings
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate('/')}>
          <ExternalLink />
          View storefront
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function pageTitle(pathname: string, items: NavItem[]): string {
  const match = [...items]
    .sort((a, b) => b.to.length - a.to.length)
    .find((item) =>
      item.end ? pathname === item.to : pathname.startsWith(item.to),
    )

  if (match) {
    return match.label
  }

  if (pathname.startsWith('/account')) {
    return 'Account settings'
  }

  return 'ShopSphere'
}

function InactiveShopNotice({ children }: { children: ReactNode }) {
  const context = useOptionalShopContext()

  if (!context?.isInactive) {
    return <>{children}</>
  }

  const activeShop = context.shops.find((shop) => shop.status === 'active')

  return (
    <Card>
      <EmptyState
        icon={<Store className="size-5" aria-hidden="true" />}
        title="This shop is inactive"
        description={`${context.selectedShop.name} is currently inactive, so its storefront and product endpoints are unavailable. An administrator can reactivate it.`}
        action={
          activeShop ? (
            <Button
              type="button"
              onClick={() => context.setSelectedShopId(activeShop.id)}
            >
              Switch to {activeShop.name}
            </Button>
          ) : undefined
        }
      />
    </Card>
  )
}

export function AppShell() {
  const { isAdmin, isShopOwner } = useAuth()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const items = navItems(isAdmin, isShopOwner)
  const title = pageTitle(location.pathname, items)

  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="hidden border-r bg-sidebar lg:block">
        <div className="sticky top-0 h-svh">
          <SidebarContent />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur lg:px-8">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu />
                <span className="sr-only">Open navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <p className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</p>
          <UserMenu />
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-6xl space-y-6">
            <InactiveShopNotice>
              <Outlet />
            </InactiveShopNotice>
          </div>
        </main>
      </div>
    </div>
  )
}
