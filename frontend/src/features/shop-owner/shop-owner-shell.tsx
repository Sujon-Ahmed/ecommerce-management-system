import { LogOut, Store } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/states'
import { useAuth } from '@/features/auth/auth-context'
import { ShopContextProvider } from '@/features/shop-owner/shop-context'
import { AppShell } from '@/layouts/app-shell'

function NoShopAccess() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <Card className="w-full max-w-lg">
        <CardContent className="p-6 sm:p-8">
          <div className="mb-4 flex items-center gap-2.5">
            <img src="/favicon.svg" alt="" className="size-9 rounded-lg" />
            <span className="text-lg font-semibold">ShopSphere</span>
          </div>
          <EmptyState
            icon={<Store className="size-5" aria-hidden="true" />}
            title="No shop is assigned"
            description={`Your account (${user?.email ?? 'shop owner'}) is not linked to any shop yet. An administrator needs to assign at least one shop before you can manage products.`}
            action={
              <Button type="button" variant="outline" onClick={handleLogout}>
                <LogOut />
                Sign out
              </Button>
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}

export function ShopOwnerShell() {
  const { user } = useAuth()
  const shops = user?.shops ?? []

  if (shops.length === 0) {
    return <NoShopAccess />
  }

  return (
    <ShopContextProvider>
      <AppShell />
    </ShopContextProvider>
  )
}
