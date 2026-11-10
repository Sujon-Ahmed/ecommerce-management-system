import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MoreHorizontal, Pencil, Plus, Trash2, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
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
import {
  deleteShopOwner,
  listShopOptions,
  listShopOwners,
} from '@/features/admin/api'
import { ShopOwnerFormDialog } from '@/features/admin/shop-owner-form-dialog'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { errorMessage } from '@/lib/errors'
import { formatCount, formatDate, initials } from '@/lib/format'
import type { User } from '@/types/models'

export function AdminShopOwnersPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [shopFilter, setShopFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [deleting, setDeleting] = useState<User | null>(null)

  const debouncedSearch = useDebouncedValue(search)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, activeFilter, shopFilter])

  const shopsQuery = useQuery({
    queryKey: ['admin', 'shop-options'],
    queryFn: listShopOptions,
    staleTime: 60_000,
  })

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: [
      'admin',
      'shop-owners',
      { search: debouncedSearch, activeFilter, shopFilter, page },
    ],
    queryFn: () =>
      listShopOwners({
        search: debouncedSearch || undefined,
        is_active:
          activeFilter === 'all' ? undefined : activeFilter === 'active',
        shop_id: shopFilter === 'all' ? undefined : Number(shopFilter),
        page,
        per_page: 12,
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: (owner: User) => deleteShopOwner(owner.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'shop-owners'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      toast.success('Shop owner deleted')
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

  function openEdit(owner: User) {
    setEditing(owner)
    setFormOpen(true)
  }

  const owners = data?.items ?? []
  const shopOptions = shopsQuery.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shop owners"
        description="Accounts that manage exactly the shops you assign to them."
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus />
            New owner
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <FilterBar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search name or email…"
            ariaLabel="Search shop owners"
          />
          <FilterSelect
            value={activeFilter}
            onChange={setActiveFilter}
            ariaLabel="Filter owners by status"
            options={[
              { value: 'all', label: 'All statuses' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
          <FilterSelect
            value={shopFilter}
            onChange={setShopFilter}
            ariaLabel="Filter owners by shop"
            options={[
              { value: 'all', label: 'All shops' },
              ...shopOptions.map((shop) => ({
                value: String(shop.id),
                label: shop.name,
              })),
            ]}
            className="sm:w-52"
          />
        </FilterBar>

        {isError ? (
          <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
        ) : isPending ? (
          <TableSkeleton rows={6} columns={6} />
        ) : owners.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Owner</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Shops</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {owners.map((owner) => (
                  <TableRow key={owner.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {initials(owner.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{owner.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {owner.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {owner.phone ?? '—'}
                    </TableCell>
                    <TableCell>
                      {owner.shops && owner.shops.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {owner.shops.slice(0, 2).map((shop) => (
                            <Badge key={shop.id} variant="secondary">
                              {shop.name}
                            </Badge>
                          ))}
                          {owner.shops.length > 2 ? (
                            <Badge variant="outline">
                              +{formatCount(owner.shops.length - 2)}
                            </Badge>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          No shops assigned
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={owner.is_active ? 'active' : 'inactive'}
                        activeLabel="Active"
                        inactiveLabel="Inactive"
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(owner.created_at)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal />
                            <span className="sr-only">Actions for {owner.name}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => openEdit(owner)}>
                            <Pencil />
                            Edit owner
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => setDeleting(owner)}
                          >
                            <Trash2 />
                            Delete owner
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
            icon={<Users className="size-5" aria-hidden="true" />}
            title="No shop owners found"
            description="Try a different search or filter, or create an owner account."
            action={
              <Button size="sm" onClick={openCreate}>
                <Plus />
                New owner
              </Button>
            }
          />
        )}
      </Card>

      <ShopOwnerFormDialog
        key={editing?.id ?? 'new-owner'}
        open={formOpen}
        onOpenChange={setFormOpen}
        owner={editing}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null)
          }
        }}
        title="Delete shop owner?"
        description={
          deleting
            ? `${deleting.name} will lose access immediately. Their shop assignments are removed, but the shops and catalog stay intact.`
            : ''
        }
        confirmLabel="Delete owner"
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
