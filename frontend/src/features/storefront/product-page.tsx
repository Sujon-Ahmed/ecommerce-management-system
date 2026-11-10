import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, PackageCheck, ShieldCheck, Store } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { EntityThumb } from '@/components/entity-thumb'
import { ErrorCard } from '@/components/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getStorefrontProduct,
  getStorefrontShop,
} from '@/features/storefront/api'
import { errorMessage } from '@/lib/errors'
import { formatBdt, formatCount } from '@/lib/format'

export function StorefrontProductPage() {
  const { shopSlug = '', productSlug = '' } = useParams()

  const shopQuery = useQuery({
    queryKey: ['storefront', 'shop', shopSlug],
    queryFn: () => getStorefrontShop(shopSlug),
    enabled: shopSlug.length > 0,
  })

  const productQuery = useQuery({
    queryKey: ['storefront', 'shop', shopSlug, 'product', productSlug],
    queryFn: () => getStorefrontProduct(shopSlug, productSlug),
    enabled: shopSlug.length > 0 && productSlug.length > 0,
  })

  if (productQuery.isError) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link to={`/shops/${shopSlug}`}>
            <ArrowLeft />
            Back to shop
          </Link>
        </Button>
        <ErrorCard
          message={errorMessage(productQuery.error)}
          onRetry={() => void productQuery.refetch()}
        />
      </div>
    )
  }

  const shop = shopQuery.data
  const product = productQuery.data

  return (
    <div className="space-y-6">
      <nav className="text-xs text-muted-foreground" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-foreground">
          Shops
        </Link>
        <span className="mx-2">/</span>
        <Link to={`/shops/${shopSlug}`} className="hover:text-foreground">
          {shop?.name ?? 'Shop'}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{product?.name ?? 'Product'}</span>
      </nav>

      {productQuery.isPending || !product ? (
        <Card>
          <CardContent className="grid gap-6 p-5 sm:grid-cols-2 sm:p-6">
            <Skeleton className="aspect-square w-full rounded-xl" />
            <div className="space-y-3">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
            <Link to={`/shops/${shopSlug}`}>
              <ArrowLeft />
              Back to {shop?.name ?? 'shop'}
            </Link>
          </Button>

          <Card className="overflow-hidden">
            <CardContent className="grid gap-6 p-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:p-6">
              <EntityThumb
                src={product.thumbnail_url}
                alt={product.name}
                fallback={product.name}
                className="aspect-square h-auto w-full rounded-xl text-3xl"
              />

              <div className="flex flex-col gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {product.category ? (
                      <Badge variant="secondary">{product.category}</Badge>
                    ) : null}
                    <Badge variant={product.in_stock ? 'success' : 'destructive'}>
                      {product.in_stock
                        ? `${formatCount(product.stock)} in stock`
                        : 'Out of stock'}
                    </Badge>
                  </div>
                  <h1 className="text-2xl font-semibold tracking-tight text-balance">
                    {product.name}
                  </h1>
                  <p className="text-sm text-muted-foreground">SKU {product.sku}</p>
                </div>

                <p className="text-3xl font-semibold text-primary">
                  {formatBdt(product.price)}
                </p>

                <p className="text-sm leading-relaxed text-muted-foreground">
                  {product.description ?? 'This shop has not added a description yet.'}
                </p>

                <dl className="grid gap-3 rounded-lg border bg-muted/30 p-4 text-sm sm:grid-cols-2">
                  <div className="space-y-0.5">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Sold by
                    </dt>
                    <dd className="flex items-center gap-1.5 font-medium">
                      <Store className="size-3.5 text-muted-foreground" aria-hidden="true" />
                      {shop?.name ?? 'This shop'}
                    </dd>
                  </div>
                  <div className="space-y-0.5">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Availability
                    </dt>
                    <dd className="flex items-center gap-1.5 font-medium">
                      <PackageCheck className="size-3.5 text-muted-foreground" aria-hidden="true" />
                      {product.in_stock ? 'Ready to ship' : 'Currently unavailable'}
                    </dd>
                  </div>
                </dl>

                <div className="mt-auto flex items-start gap-2 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  <p>
                    This listing is scoped to this shop. Prices, stock, and
                    descriptions can differ from the shared catalog.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
