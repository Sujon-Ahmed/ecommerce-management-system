import { useQuery } from '@tanstack/react-query'
import { PackageSearch, Store } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EntityThumb } from '@/components/entity-thumb'
import { FilterBar } from '@/components/filter-bar'
import { FilterSelect } from '@/components/filter-select'
import { Pagination } from '@/components/pagination'
import { SearchInput } from '@/components/search-input'
import { EmptyState, ErrorCard, TableSkeleton } from '@/components/states'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getStorefrontShop,
  listStorefrontProducts,
} from '@/features/storefront/api'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { errorMessage } from '@/lib/errors'
import { formatBdt, formatCount } from '@/lib/format'

export function StorefrontShopPage() {
  const { shopSlug = '' } = useParams()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [stock, setStock] = useState('all')
  const [sort, setSort] = useState('latest')

  const debouncedSearch = useDebouncedValue(search)
  const debouncedCategory = useDebouncedValue(category)
  const debouncedMin = useDebouncedValue(minPrice)
  const debouncedMax = useDebouncedValue(maxPrice)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, debouncedCategory, debouncedMin, debouncedMax, stock, sort, shopSlug])

  const shopQuery = useQuery({
    queryKey: ['storefront', 'shop', shopSlug],
    queryFn: () => getStorefrontShop(shopSlug),
    enabled: shopSlug.length > 0,
  })

  const productsQuery = useQuery({
    queryKey: [
      'storefront',
      'shop',
      shopSlug,
      'products',
      {
        search: debouncedSearch,
        category: debouncedCategory,
        minPrice: debouncedMin,
        maxPrice: debouncedMax,
        stock,
        sort,
        page,
      },
    ],
    queryFn: () =>
      listStorefrontProducts(shopSlug, {
        search: debouncedSearch || undefined,
        category: debouncedCategory || undefined,
        min_price: debouncedMin || undefined,
        max_price: debouncedMax || undefined,
        in_stock:
          stock === 'in' ? true : stock === 'out' ? false : undefined,
        sort,
        page,
        per_page: 12,
      }),
    enabled: shopSlug.length > 0,
  })

  if (shopQuery.isError) {
    return (
      <ErrorCard
        message={errorMessage(shopQuery.error)}
        onRetry={() => void shopQuery.refetch()}
      />
    )
  }

  const shop = shopQuery.data
  const products = productsQuery.data

  return (
    <div className="space-y-7">
      <nav className="text-xs text-muted-foreground" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-foreground">
          Shops
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{shop?.name ?? 'Shop'}</span>
      </nav>

      {shopQuery.isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
      ) : shop ? (
        <header className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-4">
            <EntityThumb
              src={shop.logo_url}
              alt={`${shop.name} logo`}
              fallback={shop.name}
              className="size-14 rounded-xl text-base"
            />
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">{shop.name}</h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                {shop.description ?? 'Browse the products this shop currently sells.'}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="w-fit">
            <Store className="size-3" aria-hidden="true" />
            {formatCount(shop.products_count)} visible products
          </Badge>
        </header>
      ) : null}

      <Card className="overflow-hidden">
        <FilterBar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search products or SKU…"
            ariaLabel="Search this shop’s products"
          />
          <Input
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Category"
            aria-label="Filter by category"
            className="w-full sm:w-40"
          />
          <Input
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
            inputMode="decimal"
            placeholder="Min ৳"
            aria-label="Minimum price"
            className="w-full sm:w-28"
          />
          <Input
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            inputMode="decimal"
            placeholder="Max ৳"
            aria-label="Maximum price"
            className="w-full sm:w-28"
          />
          <FilterSelect
            value={stock}
            onChange={setStock}
            ariaLabel="Filter by availability"
            options={[
              { value: 'all', label: 'All stock' },
              { value: 'in', label: 'In stock' },
              { value: 'out', label: 'Out of stock' },
            ]}
            className="sm:w-36"
          />
          <FilterSelect
            value={sort}
            onChange={setSort}
            ariaLabel="Sort products"
            options={[
              { value: 'latest', label: 'Newest first' },
              { value: 'price_asc', label: 'Price: low to high' },
              { value: 'price_desc', label: 'Price: high to low' },
              { value: 'name', label: 'Name: A to Z' },
            ]}
            className="sm:w-44"
          />
        </FilterBar>

        {productsQuery.isError ? (
          <ErrorCard
            message={errorMessage(productsQuery.error)}
            onRetry={() => void productsQuery.refetch()}
          />
        ) : productsQuery.isPending ? (
          <TableSkeleton rows={4} columns={3} />
        ) : products && products.items.length > 0 ? (
          <>
            <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.items.map((product) => (
                <Link
                  key={product.shop_product_id}
                  to={`/shops/${shopSlug}/products/${product.slug}`}
                  className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <article className="flex h-full flex-col overflow-hidden rounded-xl border bg-card transition-shadow group-hover:shadow-lg">
                    <EntityThumb
                      src={product.thumbnail_url}
                      alt={product.name}
                      fallback={product.name}
                      className="h-40 w-full rounded-none border-0 text-xl"
                    />
                    <div className="flex flex-1 flex-col gap-2 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="font-medium leading-snug">{product.name}</h2>
                        <Badge
                          variant={product.in_stock ? 'success' : 'secondary'}
                          className="shrink-0"
                        >
                          {product.in_stock ? 'In stock' : 'Out of stock'}
                        </Badge>
                      </div>
                      {product.category ? (
                        <p className="text-xs text-muted-foreground">{product.category}</p>
                      ) : null}
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {product.description ?? 'No description provided.'}
                      </p>
                      <p className="mt-auto pt-1 text-base font-semibold text-primary">
                        {formatBdt(product.price)}
                      </p>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
            <Pagination
              meta={products.meta}
              onPageChange={setPage}
              disabled={productsQuery.isFetching}
            />
          </>
        ) : (
          <EmptyState
            icon={<PackageSearch className="size-5" aria-hidden="true" />}
            title="No products match these filters"
            description="Try clearing the search, category, price, or stock filters to see more of this shop’s inventory."
          />
        )}
      </Card>
    </div>
  )
}
