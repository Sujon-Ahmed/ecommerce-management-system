import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  Boxes,
  CircleCheck,
  CircleSlash,
  Package,
  ShoppingBag,
  Store,
  TriangleAlert,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { EntityThumb } from '@/components/entity-thumb'
import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/stat-card'
import { ErrorCard } from '@/components/states'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useShopContext } from '@/features/shop-owner/shop-context'
import { getShopOwnerDashboard } from '@/features/shop-owner/api'
import { errorMessage } from '@/lib/errors'
import { formatCount } from '@/lib/format'

export function ShopOwnerDashboardPage() {
  const { selectedShop, requestConfig } = useShopContext()
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['shop-owner', 'dashboard', selectedShop.id],
    queryFn: () => getShopOwnerDashboard(requestConfig),
  })

  const stats = data?.stats
  const shop = data?.shop

  return (
    <div className="space-y-6">
      <PageHeader
        title={selectedShop.name}
        description="Overview of your storefront listings and catalog access."
        actions={
          <>
            <Button asChild size="sm" variant="outline">
              <Link to="/shop-owner/catalog">
                <ShoppingBag />
                Browse catalog
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/shop-owner/products">
                <Package />
                Manage products
              </Link>
            </Button>
          </>
        }
      />

      {isError ? (
        <ErrorCard message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Listings"
              value={formatCount(stats?.listings.total)}
              hint="Products assigned to this shop"
              icon={Package}
              loading={isPending}
            />
            <StatCard
              label="Active"
              value={formatCount(stats?.listings.active)}
              hint={`${formatCount(stats?.listings.inactive)} inactive`}
              icon={CircleCheck}
              tone="success"
              loading={isPending}
            />
            <StatCard
              label="In stock"
              value={formatCount(stats?.listings.in_stock)}
              hint={`${formatCount(stats?.listings.out_of_stock)} out of stock`}
              icon={Boxes}
              tone="primary"
              loading={isPending}
            />
            <StatCard
              label="Available catalog"
              value={formatCount(stats?.catalog.available)}
              hint="Active products not yet in this shop"
              icon={ShoppingBag}
              tone="warning"
              loading={isPending}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Your shop</CardTitle>
                <CardDescription>
                  Storefront settings are managed by an administrator.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="flex items-start gap-4">
                  <EntityThumb
                    src={shop?.logo_url ?? selectedShop.logo_url}
                    alt={selectedShop.name}
                    fallback={selectedShop.name}
                    className="size-14 rounded-xl text-base"
                  />
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{shop?.name ?? selectedShop.name}</p>
                      <StatusBadge status={shop?.status ?? selectedShop.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      /{shop?.slug ?? selectedShop.slug}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {shop?.description ??
                        selectedShop.description ??
                        'No shop description yet.'}
                    </p>
                  </div>
                </div>

                <dl className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-4 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Listed products</dt>
                    <dd className="font-medium">
                      {formatCount(shop?.shop_products_count ?? stats?.listings.total)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Storefront</dt>
                    <dd>
                      {(shop?.status ?? selectedShop.status) === 'active' ? (
                        <Link
                          to={`/shops/${shop?.slug ?? selectedShop.slug}`}
                          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                        >
                          View live
                          <ArrowRight className="size-3.5" />
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">Hidden</span>
                      )}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Quick actions</CardTitle>
                  <CardDescription>Keep your storefront current.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  <Link
                    to="/shop-owner/catalog"
                    className="flex items-center gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50"
                  >
                    <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <ShoppingBag className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">Assign from catalog</span>
                      <span className="block text-xs text-muted-foreground">
                        Add a shared product with your own price and stock.
                      </span>
                    </span>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </Link>
                  <Link
                    to="/shop-owner/products"
                    className="flex items-center gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50"
                  >
                    <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Package className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">Update a listing</span>
                      <span className="block text-xs text-muted-foreground">
                        Change price, stock, description, or thumbnail.
                      </span>
                    </span>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-start gap-3 p-4">
                  {stats && stats.listings.out_of_stock > 0 ? (
                    <TriangleAlert className="mt-0.5 size-5 shrink-0 text-accent-foreground" aria-hidden="true" />
                  ) : (
                    <CircleCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
                  )}
                  <div className="space-y-0.5 text-sm">
                    <p className="font-medium">
                      {stats && stats.listings.out_of_stock > 0
                        ? `${formatCount(stats.listings.out_of_stock)} listing${stats.listings.out_of_stock === 1 ? '' : 's'} out of stock`
                        : 'Everything is in stock'}
                    </p>
                    <p className="text-muted-foreground">
                      Out-of-stock products stay visible but cannot be shown as
                      available to customers.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {stats && stats.listings.total === 0 ? (
                <Card>
                  <CardContent className="flex items-center gap-3 p-4 text-sm">
                    <CircleSlash className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <p className="text-muted-foreground">
                      This shop has no listings yet. Assign a catalog product or create
                      a new one to get started.
                    </p>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </div>

          <Card>
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Store className="size-5" aria-hidden="true" />
                </span>
                <div className="space-y-0.5">
                  <p className="font-medium">Only your shop sees these changes</p>
                  <p className="text-sm text-muted-foreground">
                    Catalog products are shared, but prices, stock, descriptions, and
                    thumbnails you set here apply only to {shop?.name ?? selectedShop.name}.
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/shop-owner/shop">
                  View shop settings
                  <ArrowRight />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
