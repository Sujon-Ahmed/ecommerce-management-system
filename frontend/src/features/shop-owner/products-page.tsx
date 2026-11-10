import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ExternalLink,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  ShoppingBag,
  Unlink,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { EntityThumb } from '@/components/entity-thumb'
import { FilterBar } from '@/components/filter-bar'
import { FilterSelect } from '@/components/filter-select'
import { PageHeader } from '@/components/page-header'
import { Pagination } from '@/components/pagination'
import { SearchInput } from '@/components/search-input'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/states'
import { StatusBadge } from '@/components/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { deleteShopProduct, listShopProducts } from '@/features/shop-owner/api'
import { ShopProductFormDialog } from '@/features/shop-owner/shop-product-form-dialog'
import { useShopContext } from '@/features/shop-owner/shop-context'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { errorMessage } from '@/lib/errors'
import { formatBdt, formatCount, formatDate } from '@/lib/format'
import type { ShopProduct } from '@/types/models'

export function ShopOwnerProductsPage() {
  const queryClient = useQueryClient()
  const { selectedShop, requestConfig } = useShopContext()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ShopProduct | null>(null)
  const [unassigning, setUnassigning] = useState<ShopProduct | null>(null)

  const debouncedSearch = useDebouncedValue(search)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, status, selectedShop.id])

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: [
      'shop-owner',
      'products',
      selectedShop.id,
      { search: debouncedSearch, status, page },
    ],
    queryFn: () =>
      listShopProducts(requestConfig, {
        search: debouncedSearch || undefined,
        status: status === 'all' ? undefined : status,
        page,
        per_page: 12,
      }),
  })

  const unassignMutation = useMutation({
    mutationFn: (listing: ShopProduct) =>
      deleteShopProduct(requestConfig, listing.product_id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['shop-owner'] })
      toast.success('Product unassigned from your shop')
      setUnassigning(null)
    },
    onError: (mutationError) => {
      toast.error(errorMessage(mutationError))
    },
  })

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(listing: ShopProduct) {
    setEditing(listing)
    setFormOpen(true)
  }

  const listings = data?.items ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="My products"
        description={`Listings visible on ${selectedShop.name}, with your own price and stock.`}
        actions={
          <>
            <Button asChild size="sm" variant="outline">
              <Link to="/shop-owner/catalog">
                <ShoppingBag />
                Assign from catalog
              </Link>
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus />
              New product
            </Button>
          </>
        }
      />

      <Card className="overflow-hidden">
        <FilterBar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search product or SKU…"
            ariaLabel="Search your listings"
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

        {isError ? (
          <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
        ) : isPending ? (
          <TableSkeleton rows={6} columns={6} />
        ) : listings.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listings.map((listing) => (
                  <TableRow key={listing.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <EntityThumb
                          src={listing.effective_thumbnail_url}
                          alt={listing.product?.name ?? 'Product'}
                          fallback={listing.product?.name ?? '?'}
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {listing.product?.name ?? 'Unknown product'}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {listing.product?.sku}
                            {listing.product?.category
                              ? ` · ${listing.product.category}`
                              : ''}
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
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(listing.updated_at)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal />
                            <span className="sr-only">
                              Actions for {listing.product?.name ?? 'listing'}
                            </span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {selectedShop.status === 'active' && listing.product?.slug ? (
                            <DropdownMenuItem asChild>
                              <Link
                                to={`/shops/${selectedShop.slug}/products/${listing.product.slug}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <ExternalLink />
                                View on storefront
                              </Link>
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuItem onSelect={() => openEdit(listing)}>
                            <Pencil />
                            Edit listing
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => setUnassigning(listing)}
                          >
                            <Unlink />
                            Unassign from shop
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination
              meta={data?.meta}
              onPageChange={setPage}
              disabled={isFetching}
            />
          </>
        ) : (
          <EmptyState
            icon={<Package className="size-5" aria-hidden="true" />}
            title="No listings yet"
            description="Assign an active catalog product or create a new one to start selling in this shop."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link to="/shop-owner/catalog">Browse catalog</Link>
                </Button>
                <Button size="sm" onClick={openCreate}>
                  <Plus />
                  New product
                </Button>
              </div>
            }
          />
        )}
      </Card>

      <ShopProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        listing={editing}
      />

      <ConfirmDialog
        open={unassigning !== null}
        onOpenChange={(open) => {
          if (!open) {
            setUnassigning(null)
          }
        }}
        title="Unassign product?"
        description={
          unassigning
            ? `${unassigning.product?.name ?? 'This product'} will be removed from ${selectedShop.name}. The catalog product itself is not deleted and can be assigned again later.`
            : ''
        }
        confirmLabel="Unassign"
        loading={unassignMutation.isPending}
        onConfirm={() => {
          if (unassigning) {
            unassignMutation.mutate(unassigning)
          }
        }}
      />
    </div>
  )
}
