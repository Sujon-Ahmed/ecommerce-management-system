import { useQuery } from '@tanstack/react-query'
import { ArrowRight, ExternalLink, Info, Store } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EntityThumb } from '@/components/entity-thumb'
import { PageHeader } from '@/components/page-header'
import { ErrorCard } from '@/components/states'
import { StatusBadge } from '@/components/status-badge'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getShopOwnerShop } from '@/features/shop-owner/api'
import { useShopContext } from '@/features/shop-owner/shop-context'
import { errorMessage } from '@/lib/errors'
import { formatCount, formatDate } from '@/lib/format'

export function ShopOwnerShopPage() {
  const { selectedShop, requestConfig } = useShopContext()
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['shop-owner', 'shop', selectedShop.id],
    queryFn: () => getShopOwnerShop(requestConfig),
  })

  const shop = data ?? selectedShop

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shop settings"
        description="Your public storefront profile. Administrators manage these values."
        actions={
          shop.status === 'active' ? (
            <Button asChild size="sm" variant="outline">
              <Link to={`/shops/${shop.slug}`} target="_blank" rel="noreferrer">
                <ExternalLink />
                View storefront
              </Link>
            </Button>
          ) : undefined
        }
      />

      {isError ? (
        <ErrorCard message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : (
        <>
          <Alert tone="info">
            <p className="font-medium">Read-only</p>
            <p>
              Shop name, slug, description, logo, and status are controlled by the
              platform administrator. Contact them to change these details.
            </p>
          </Alert>

          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <Card>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <EntityThumb
                    src={shop.logo_url}
                    alt={`${shop.name} logo`}
                    fallback={shop.name}
                    className="size-16 rounded-xl text-lg"
                  />
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-xl">{shop.name}</CardTitle>
                      <StatusBadge status={shop.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">/{shop.slug}</p>
                    <p className="text-sm text-muted-foreground">
                      {shop.description ?? 'No description has been provided.'}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <dl className="grid gap-4 rounded-lg border bg-muted/30 p-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Listings
                    </dt>
                    <dd className="font-medium">
                      {formatCount(shop.shop_products_count)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Storefront status
                    </dt>
                    <dd className="font-medium">
                      {shop.status === 'active'
                        ? 'Visible to customers'
                        : 'Hidden from customers'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Created
                    </dt>
                    <dd className="font-medium">{formatDate(shop.created_at)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Last updated
                    </dt>
                    <dd className="font-medium">{formatDate(shop.updated_at)}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>What you can change</CardTitle>
                <CardDescription>
                  Everything below is scoped to this shop only.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-0 text-sm">
                {[
                  'Price shown on the storefront',
                  'Stock level and listing status',
                  'Shop-specific description',
                  'Shop-specific thumbnail',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    <span>{item}</span>
                  </div>
                ))}
                <Button asChild variant="outline" size="sm" className="mt-2 w-full">
                  <Link to="/shop-owner/products">
                    <Store />
                    Manage listings
                    <ArrowRight />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {isPending ? (
            <p className="text-xs text-muted-foreground">Refreshing shop details…</p>
          ) : null}
        </>
      )}
    </div>
  )
}
