import { EntityThumb } from "@/components/entity-thumb";
import { ErrorCard } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { listStorefrontShops } from "@/features/storefront/api";
import { errorMessage } from "@/lib/errors";
import { formatCount } from "@/lib/format";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Package, ShieldCheck, Store, Truck } from "lucide-react";
import { Link } from "react-router-dom";

export function StorefrontShopsPage() {
  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["storefront", "shops"],
    queryFn: listStorefrontShops,
  });

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-2xl border bg-sidebar px-6 py-10 text-sidebar-foreground sm:px-10 sm:py-14">
        <div
          className="pointer-events-none absolute -right-20 -top-24 size-80 rounded-full bg-primary/30 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-24 left-1/3 size-72 rounded-full bg-accent/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative max-w-2xl space-y-4">
          <Badge className="border-sidebar-border bg-sidebar-accent/60 text-sidebar-foreground">
            Storefront
          </Badge>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-balance sm:text-4xl">
            Shop local stores across Bangladesh.
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-sidebar-muted sm:text-base">
            Every shop on ShopSphere draws from a shared catalog but sets its
            own prices, stock, and presentation. Pick a shop to see exactly what
            it sells today.
          </p>
          <div className="flex flex-wrap gap-4 pt-2 text-xs text-sidebar-muted">
            <span className="inline-flex items-center gap-1.5">
              <Store className="size-4 text-accent" aria-hidden="true" />
              {data
                ? `${formatCount(data.length)} active shops`
                : "Active shops"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-accent" aria-hidden="true" />
              Shop-scoped inventory
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Truck className="size-4 text-accent" aria-hidden="true" />
              Local delivery
            </span>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Browse shops
            </h2>
            <p className="text-sm text-muted-foreground">
              Only active shops with visible products are listed.
            </p>
          </div>
          {isFetching && data ? (
            <span className="text-xs text-muted-foreground">Refreshing…</span>
          ) : null}
        </div>

        {isError ? (
          <ErrorCard
            message={errorMessage(error)}
            onRetry={() => void refetch()}
          />
        ) : isPending ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="space-y-3 p-5">
                  <Skeleton className="size-12 rounded-xl" />
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((shop) => (
              <Link
                key={shop.id}
                to={`/shops/${shop.slug}`}
                className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Card className="h-full transition-shadow group-hover:shadow-lg">
                  <CardContent className="flex h-full flex-col gap-4 p-5">
                    <div className="flex items-start justify-between gap-3 mt-2">
                      <EntityThumb
                        src={shop.logo_url}
                        alt={`${shop.name} logo`}
                        fallback={shop.name}
                        className="size-12 rounded-xl text-sm"
                      />
                      <Badge variant="secondary">
                        <Package className="size-3" aria-hidden="true" />
                        {formatCount(shop.products_count)} products
                      </Badge>
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-semibold leading-tight">
                        {shop.name}
                      </h3>
                      <p className="line-clamp-3 text-sm text-muted-foreground">
                        {shop.description ??
                          "Browse this shop’s current selection."}
                      </p>
                    </div>
                    <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary">
                      Visit shop
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 px-6 py-14 text-center">
              <Store
                className="size-6 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="font-medium">No active shops yet</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                An administrator needs to activate a shop before it can appear
                on the storefront.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-1">
                <Link to="/login">Staff sign in</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
