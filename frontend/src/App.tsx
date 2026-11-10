import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { AccountPage } from '@/features/account/account-page'
import { AdminDashboardPage } from '@/features/admin/dashboard-page'
import { AdminProductsPage } from '@/features/admin/products-page'
import { AdminShopOwnersPage } from '@/features/admin/shop-owners-page'
import { AdminShopsPage } from '@/features/admin/shops-page'
import { AuthProvider } from '@/features/auth/auth-context'
import { LoginPage } from '@/features/auth/login-page'
import { ShopOwnerCatalogPage } from '@/features/shop-owner/catalog-page'
import { ShopOwnerDashboardPage } from '@/features/shop-owner/dashboard-page'
import { ShopOwnerProductsPage } from '@/features/shop-owner/products-page'
import { ShopOwnerShell } from '@/features/shop-owner/shop-owner-shell'
import { ShopOwnerShopPage } from '@/features/shop-owner/shop-page'
import { StorefrontProductPage } from '@/features/storefront/product-page'
import { StorefrontShopPage } from '@/features/storefront/shop-page'
import { StorefrontShopsPage } from '@/features/storefront/shops-page'
import { AppShell } from '@/layouts/app-shell'
import { StorefrontLayout } from '@/layouts/storefront-layout'
import { queryClient } from '@/lib/query-client'
import { ForbiddenPage } from '@/routes/forbidden-page'
import { GuestOnly, RequireAuth, RequireRole } from '@/routes/guards'
import { NotFoundPage } from '@/routes/not-found-page'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route element={<StorefrontLayout />}>
              <Route index element={<StorefrontShopsPage />} />
              <Route path="shops/:shopSlug" element={<StorefrontShopPage />} />
              <Route
                path="shops/:shopSlug/products/:productSlug"
                element={<StorefrontProductPage />}
              />
            </Route>

            <Route element={<GuestOnly />}>
              <Route path="login" element={<LoginPage />} />
            </Route>

            <Route element={<RequireAuth />}>
              <Route element={<AppShell />}>
                <Route path="account" element={<AccountPage />} />
              </Route>

              <Route element={<RequireRole roles={['admin']} />}>
                <Route path="admin" element={<AppShell />}>
                  <Route index element={<AdminDashboardPage />} />
                  <Route path="shops" element={<AdminShopsPage />} />
                  <Route path="shop-owners" element={<AdminShopOwnersPage />} />
                  <Route path="products" element={<AdminProductsPage />} />
                </Route>
              </Route>

              <Route element={<RequireRole roles={['shop_owner']} />}>
                <Route path="shop-owner" element={<ShopOwnerShell />}>
                  <Route index element={<ShopOwnerDashboardPage />} />
                  <Route path="shop" element={<ShopOwnerShopPage />} />
                  <Route path="catalog" element={<ShopOwnerCatalogPage />} />
                  <Route path="products" element={<ShopOwnerProductsPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="403" element={<ForbiddenPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>

          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
