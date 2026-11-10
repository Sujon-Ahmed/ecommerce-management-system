import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  MoreHorizontal,
  PackageSearch,
  Pencil,
  Plus,
  Store,
  Trash2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
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
import { deleteShop, listShops } from '@/features/admin/api'
import { ShopFormDialog } from '@/features/admin/shop-form-dialog'
import { ShopProductsSheet } from '@/features/admin/shop-products-sheet'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { errorMessage } from '@/lib/errors'
import { formatCount, formatDate } from '@/lib/format'
import type { Shop } from '@/types/models'

export function AdminShopsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Shop | null>(null)
  const [productsShop, setProductsShop] = useState<Shop | null>(null)
  const [productsOpen, setProductsOpen] = useState(false)
  const [deleting, setDeleting] = useState<Shop | null>(null)

  const debouncedSearch = useDebouncedValue(search)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, status])

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'shops', { search: debouncedSearch, status, page }],
    queryFn: () =>
      listShops({
        search: debouncedSearch || undefined,
        status: status === 'all' ? undefined : status,
        page,
        per_page: 12,
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: (shop: Shop) => deleteShop(shop.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'shops'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      toast.success('Shop deleted')
      setDeleting(null)
    },
    onError: (mutationError) => {
      toast.error(errorMessage(mutationError))
    },
  })

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(shop: Shop) {
    setEditing(shop)
    setFormOpen(true)
  }

  function openProducts(shop: Shop) {
    setProductsShop(shop)
    setProductsOpen(true)
  }

  const shops = data?.items ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shops"
        description="Create and manage the storefronts customers can browse."
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus />
            New shop
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <FilterBar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name or slug…"
            ariaLabel="Search shops"
          />
          <FilterSelect
            value={status}
            onChange={setStatus}
            ariaLabel="Filter shops by status"
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
        ) : shops.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shop</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Owners</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shops.map((shop) => (
                  <TableRow key={shop.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <EntityThumb
                          src={shop.logo_url}
                          alt={`${shop.name} logo`}
                          fallback={shop.name}
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{shop.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            /{shop.slug}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={shop.status} />
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatCount(shop.owners_count)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatCount(shop.shop_products_count)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(shop.created_at)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal />
                            <span className="sr-only">Actions for {shop.name}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => openProducts(shop)}>
                            <PackageSearch />
                            View products
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => openEdit(shop)}>
                            <Pencil />
                            Edit shop
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => setDeleting(shop)}
                          >
                            <Trash2 />
                            Delete shop
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
            icon={<Store className="size-5" aria-hidden="true" />}
            title="No shops found"
            description="Try a different search or status filter, or create the first shop."
            action={
              <Button size="sm" onClick={openCreate}>
                <Plus />
                New shop
              </Button>
            }
          />
        )}
      </Card>

      <ShopFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        shop={editing}
      />

      <ShopProductsSheet
        shop={productsShop}
        open={productsOpen}
        onOpenChange={setProductsOpen}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null)
          }
        }}
        title="Delete shop?"
        description={
          deleting
            ? `${deleting.name} and its shop listings will be removed. Owners keep their accounts. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete shop"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleting) {
            deleteMutation.mutate(deleting)
          }
        }}
      />
    </div>
  )
}
