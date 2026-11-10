import { useQuery } from '@tanstack/react-query'
import { BadgeCheck, PackageSearch, Plus, ShoppingBag } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EntityThumb } from '@/components/entity-thumb'
import { FilterBar } from '@/components/filter-bar'
import { FilterSelect } from '@/components/filter-select'
import { PageHeader } from '@/components/page-header'
import { Pagination } from '@/components/pagination'
import { SearchInput } from '@/components/search-input'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { listCatalog } from '@/features/shop-owner/api'
import { AssignProductDialog } from '@/features/shop-owner/assign-product-dialog'
import { useShopContext } from '@/features/shop-owner/shop-context'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { errorMessage } from '@/lib/errors'
import type { CatalogProduct } from '@/types/models'

export function ShopOwnerCatalogPage() {
  const { selectedShop, requestConfig } = useShopContext()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [assigned, setAssigned] = useState('all')
  const [assigning, setAssigning] = useState<CatalogProduct | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const debouncedSearch = useDebouncedValue(search)
  const debouncedCategory = useDebouncedValue(category)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, debouncedCategory, assigned, selectedShop.id])

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: [
      'shop-owner',
      'catalog',
      selectedShop.id,
      { search: debouncedSearch, category: debouncedCategory, assigned, page },
    ],
    queryFn: () =>
      listCatalog(requestConfig, {
        search: debouncedSearch || undefined,
        category: debouncedCategory || undefined,
        assigned:
          assigned === 'all' ? undefined : assigned === 'assigned',
        page,
        per_page: 12,
      }),
  })

  function openAssign(product: CatalogProduct) {
    setAssigning(product)
    setDialogOpen(true)
  }

  const products = data?.items ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shared catalog"
        description="Active catalog products you can assign to your shop with your own pricing."
        actions={
          <Button asChild size="sm" variant="outline">
            <Link to="/shop-owner/products">
              <ShoppingBag />
              My listings
            </Link>
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <FilterBar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search name, SKU, category…"
            ariaLabel="Search the catalog"
          />
          <Input
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Category"
            aria-label="Filter catalog by category"
            className="w-full sm:w-40"
          />
          <FilterSelect
            value={assigned}
            onChange={setAssigned}
            ariaLabel="Filter catalog by assignment"
            options={[
              { value: 'all', label: 'All products' },
              { value: 'available', label: 'Not in my shop' },
              { value: 'assigned', label: 'Already assigned' },
            ]}
            className="sm:w-44"
          />
        </FilterBar>

        {isError ? (
          <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
        ) : isPending ? (
          <TableSkeleton rows={6} columns={4} />
        ) : products.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Catalog status</TableHead>
                  <TableHead className="w-40">
                    <span className="sr-only">Assignment</span>
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
                          <p className="line-clamp-1 text-xs text-muted-foreground">
                            {product.description ?? 'No description.'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.category ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.is_active ? 'success' : 'secondary'}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {product.assigned ? (
                        <Badge variant="default" className="gap-1">
                          <BadgeCheck className="size-3.5" aria-hidden="true" />
                          In your shop
                        </Badge>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => openAssign(product)}
                        >
                          <Plus />
                          Assign
                        </Button>
                      )}
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
            icon={<PackageSearch className="size-5" aria-hidden="true" />}
            title="No catalog products found"
            description="Try a different search or filter. If you have already assigned everything, check your listings."
            action={
              <Button asChild size="sm" variant="outline">
                <Link to="/shop-owner/products">Go to my listings</Link>
              </Button>
            }
          />
        )}
      </Card>

      <AssignProductDialog
        product={assigning}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
