import { useQuery } from '@tanstack/react-query'
import { PackageSearch } from 'lucide-react'
import { useEffect, useState } from 'react'
import { EntityThumb } from '@/components/entity-thumb'
import { FilterBar } from '@/components/filter-bar'
import { FilterSelect } from '@/components/filter-select'
import { Pagination } from '@/components/pagination'
import { SearchInput } from '@/components/search-input'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/states'
import { StatusBadge } from '@/components/status-badge'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { listShopProducts } from '@/features/admin/api'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { errorMessage } from '@/lib/errors'
import { formatBdt, formatCount } from '@/lib/format'
import type { Shop } from '@/types/models'

interface ShopProductsSheetProps {
  shop: Shop | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShopProductsSheet({ shop, open, onOpenChange }: ShopProductsSheetProps) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const debouncedSearch = useDebouncedValue(search)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, status, shop?.id])

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: [
      'admin',
      'shop-products',
      shop?.id,
      { search: debouncedSearch, status, page },
    ],
    queryFn: () =>
      listShopProducts(shop!.id, {
        search: debouncedSearch || undefined,
        status: status === 'all' ? undefined : status,
        page,
        per_page: 12,
      }),
    enabled: open && shop !== null,
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-xl bg-card text-card-foreground sm:max-w-2xl">
        <div className="space-y-1 border-b p-5 pr-12">
          <SheetTitle className="text-lg font-semibold">
            {shop?.name ?? 'Shop'} products
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            Listings assigned to this shop, including shop-specific pricing and stock.
          </SheetDescription>
        </div>

        <FilterBar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search product or SKU…"
          />
          <FilterSelect
            value={status}
            onChange={setStatus}
            ariaLabel="Filter listings by status"
            options={[
              { value: 'all', label: 'All statuses' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
        </FilterBar>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {isError ? (
            <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
          ) : isPending ? (
            <TableSkeleton rows={5} columns={4} />
          ) : data && data.items.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((listing) => (
                  <TableRow key={listing.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <EntityThumb
                          src={listing.effective_thumbnail_url}
                          alt={listing.product?.name ?? 'Product'}
                          fallback={listing.product?.name ?? '?'}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {listing.product?.name ?? 'Unknown product'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {listing.product?.sku}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-medium">
                      {formatBdt(listing.price)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={listing.in_stock ? 'success' : 'secondary'}>
                        {listing.in_stock
                          ? `${formatCount(listing.stock)} in stock`
                          : 'Out of stock'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={listing.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={<PackageSearch className="size-5" aria-hidden="true" />}
              title="No listings found"
              description="This shop has no products matching the current filters."
            />
          )}
        </div>

        {data?.meta ? (
          <div className="border-t">
            <Pagination
              meta={data.meta}
              onPageChange={setPage}
              disabled={isFetching}
            />
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
