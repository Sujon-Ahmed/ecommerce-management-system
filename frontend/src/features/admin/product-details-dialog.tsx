import { useQuery } from '@tanstack/react-query'
import { Store } from 'lucide-react'
import { EntityThumb } from '@/components/entity-thumb'
import { ErrorState } from '@/components/states'
import { StatusBadge } from '@/components/status-badge'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getProduct } from '@/features/admin/api'
import { errorMessage } from '@/lib/errors'
import { formatBdt, formatCount, formatDate } from '@/lib/format'

interface ProductDetailsDialogProps {
  productId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductDetailsDialog({
  productId,
  open,
  onOpenChange,
}: ProductDetailsDialogProps) {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'product', productId],
    queryFn: () => getProduct(productId!),
    enabled: open && productId !== null,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Product details</DialogTitle>
          <DialogDescription>
            Catalog information and every shop currently listing this product.
          </DialogDescription>
        </DialogHeader>

        {isError ? (
          <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
        ) : isPending || !data ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <EntityThumb
                src={data.thumbnail_url}
                alt={data.name}
                fallback={data.name}
                className="size-16 rounded-xl text-base"
              />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold">{data.name}</h3>
                  <StatusBadge status={data.is_active ? 'active' : 'inactive'} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {data.sku}
                  {data.category ? ` · ${data.category}` : ''}
                </p>
                <p className="text-sm text-muted-foreground">
                  {data.description ?? 'No description provided.'}
                </p>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-4 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-xs text-muted-foreground">Shops</dt>
                <dd className="font-medium">{formatCount(data.shops_count)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Listings</dt>
                <dd className="font-medium">
                  {formatCount(data.shop_products_count)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Created</dt>
                <dd className="font-medium">{formatDate(data.created_at)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Created by</dt>
                <dd className="truncate font-medium">{data.created_by?.name ?? '—'}</dd>
              </div>
            </dl>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Shop listings</h4>
              {data.shop_products && data.shop_products.length > 0 ? (
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Shop</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.shop_products.map((listing) => (
                        <TableRow key={listing.id}>
                          <TableCell>
                            <span className="flex items-center gap-2">
                              <Store className="size-3.5 text-muted-foreground" aria-hidden="true" />
                              {listing.shop?.name ?? `Shop #${listing.shop_id}`}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatBdt(listing.price)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={listing.in_stock ? 'success' : 'secondary'}>
                              {formatCount(listing.stock)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={listing.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                  This product is not assigned to any shop yet.
                </p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
