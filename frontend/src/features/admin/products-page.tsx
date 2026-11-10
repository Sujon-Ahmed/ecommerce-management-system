import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Eye,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
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
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { deleteProduct, listProducts } from '@/features/admin/api'
import { ProductDetailsDialog } from '@/features/admin/product-details-dialog'
import { ProductFormDialog } from '@/features/admin/product-form-dialog'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { errorMessage } from '@/lib/errors'
import { formatCount, formatDate } from '@/lib/format'
import type { Product } from '@/types/models'

export function AdminProductsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [detailsId, setDetailsId] = useState<number | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [deleting, setDeleting] = useState<Product | null>(null)

  const debouncedSearch = useDebouncedValue(search)
  const debouncedCategory = useDebouncedValue(category)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, debouncedCategory, activeFilter])

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: [
      'admin',
      'products',
      {
        search: debouncedSearch,
        category: debouncedCategory,
        activeFilter,
        page,
      },
    ],
    queryFn: () =>
      listProducts({
        search: debouncedSearch || undefined,
        category: debouncedCategory || undefined,
        is_active:
          activeFilter === 'all' ? undefined : activeFilter === 'active',
        page,
        per_page: 12,
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: (product: Product) => deleteProduct(product.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      void queryClient.invalidateQueries({ queryKey: ['storefront'] })
      toast.success('Product deleted')
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

  function openEdit(product: Product) {
    setEditing(product)
    setFormOpen(true)
  }

  function openDetails(product: Product) {
    setDetailsId(product.id)
    setDetailsOpen(true)
  }

  const products = data?.items ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catalog products"
        description="The shared product catalog every shop can draw from."
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus />
            New product
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <FilterBar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search name, SKU, category…"
            ariaLabel="Search products"
          />
          <Input
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Category"
            aria-label="Filter by category"
            className="w-full sm:w-40"
          />
          <FilterSelect
            value={activeFilter}
            onChange={setActiveFilter}
            ariaLabel="Filter products by status"
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
        ) : products.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Shops</TableHead>
                  <TableHead>Listings</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <EntityThumb
                          src={product.thumbnail_url}
                          alt={product.name}
                          fallback={product.name}
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{product.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {product.sku}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.category ?? '—'}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatCount(product.shops_count)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatCount(product.shop_products_count)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={product.is_active ? 'active' : 'inactive'}
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(product.created_at)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal />
                            <span className="sr-only">Actions for {product.name}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => openDetails(product)}>
                            <Eye />
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => openEdit(product)}>
                            <Pencil />
                            Edit product
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => setDeleting(product)}
                          >
                            <Trash2 />
                            Delete product
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
            title="No products found"
            description="Try a different search or filter, or add a product to the catalog."
            action={
              <Button size="sm" onClick={openCreate}>
                <Plus />
                New product
              </Button>
            }
          />
        )}
      </Card>

      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editing}
      />

      <ProductDetailsDialog
        productId={detailsId}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null)
          }
        }}
        title="Delete product?"
        description={
          deleting
            ? `${deleting.name} will be removed from the catalog and unassigned from every shop. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete product"
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
