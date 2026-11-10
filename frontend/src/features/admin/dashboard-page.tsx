import { EntityThumb } from "@/components/entity-thumb";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { ErrorCard } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAdminDashboard } from "@/features/admin/api";
import { errorMessage } from "@/lib/errors";
import { formatCount, formatDate } from "@/lib/format";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Boxes,
  Link2,
  Package,
  Plus,
  Store,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

export function AdminDashboardPage() {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: getAdminDashboard,
  });

  const stats = data?.stats;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="A quick pulse on the catalog, shops, and people running them."
        actions={
          <>
            <Button asChild size="sm">
              <Link to="/admin/shops">
                <Plus />
                New shop
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/admin/products">
                <Plus />
                New product
              </Link>
            </Button>
          </>
        }
      />

      {isError ? (
        <ErrorCard
          message={errorMessage(error)}
          onRetry={() => void refetch()}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Shops"
              value={formatCount(stats?.shops.total)}
              hint={
                stats
                  ? `${formatCount(stats.shops.active)} active · ${formatCount(stats.shops.inactive)} inactive`
                  : undefined
              }
              icon={Store}
              tone="primary"
              loading={isPending}
            />
            <StatCard
              label="Catalog products"
              value={formatCount(stats?.products.total)}
              hint={
                stats
                  ? `${formatCount(stats.products.active)} active`
                  : undefined
              }
              icon={Package}
              tone="success"
              loading={isPending}
            />
            <StatCard
              label="Shop owners"
              value={formatCount(stats?.shop_owners)}
              hint="Accounts scoped to their shops"
              icon={Users}
              tone="warning"
              loading={isPending}
            />
            <StatCard
              label="Shop listings"
              value={formatCount(stats?.assignments)}
              hint="Catalog products assigned to shops"
              icon={Boxes}
              tone="muted"
              loading={isPending}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle>Recent shops</CardTitle>
                  <CardDescription>
                    The latest shops added to the platform.
                  </CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/admin/shops">
                    View all
                    <ArrowRight />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-1 pt-0">
                {isPending ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Loading shops…
                  </p>
                ) : data && data.recent_shops.length > 0 ? (
                  data.recent_shops.map((shop) => (
                    <div
                      key={shop.id}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50"
                    >
                      <EntityThumb
                        src={shop.logo_url}
                        alt={`${shop.name} logo`}
                        fallback={shop.name}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {shop.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          /{shop.slug}
                        </p>
                      </div>
                      <StatusBadge status={shop.status} />
                      <span className="hidden text-xs text-muted-foreground sm:block">
                        {formatDate(shop.created_at)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No shops yet.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle>Recent products</CardTitle>
                  <CardDescription>
                    The newest entries in the shared catalog.
                  </CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/admin/products">
                    View all
                    <ArrowRight />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-1 pt-0">
                {isPending ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Loading products…
                  </p>
                ) : data && data.recent_products.length > 0 ? (
                  data.recent_products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50"
                    >
                      <EntityThumb
                        src={product.thumbnail_url}
                        alt={product.name}
                        fallback={product.name}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {product.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {product.sku}
                          {product.category ? ` · ${product.category}` : ""}
                        </p>
                      </div>
                      <StatusBadge
                        status={product.is_active ? "active" : "inactive"}
                      />
                    </div>
                  ))
                ) : (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No products yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3 mt-2">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Link2 className="size-5" aria-hidden="true" />
                </span>
                <div className="space-y-0.5">
                  <p className="font-medium">
                    Shared catalog, per-shop control
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Shop owners can assign an existing catalog product or create
                    a new one, then override its price, stock, description, and
                    image.
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/admin/products">
                  Review catalog
                  <ArrowRight />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
