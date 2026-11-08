<?php

namespace App\Http\Controllers\Api\V1\Storefront;

use App\Enums\ShopStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Storefront\ListStorefrontProductsRequest;
use App\Http\Resources\StorefrontProductResource;
use App\Models\Product;
use App\Models\Shop;
use App\Models\ShopProduct;
use App\Support\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

class ProductController extends Controller
{
    public function index(ListStorefrontProductsRequest $request, Shop $shop): JsonResponse
    {
        $this->ensureShopIsActive($shop);

        $listings = $this->visibleQuery($shop)
            ->when($request->filled('search'), function (Builder $query) use ($request) {
                $search = (string) $request->input('search');
                $query->whereHas('product', function (Builder $product) use ($search) {
                    $product->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%")
                        ->orWhere('category', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('category'), function (Builder $query) use ($request) {
                $query->whereHas(
                    'product',
                    fn (Builder $product) => $product->where('category', $request->input('category'))
                );
            })
            ->when($request->filled('min_price'), fn (Builder $query) => $query->where('price', '>=', $request->input('min_price')))
            ->when($request->filled('max_price'), fn (Builder $query) => $query->where('price', '<=', $request->input('max_price')))
            ->when($request->has('in_stock'), function (Builder $query) use ($request) {
                $request->boolean('in_stock')
                    ? $query->where('stock', '>', 0)
                    : $query->where('stock', '<=', 0);
            });

        $this->applySort($listings, (string) $request->input('sort', 'latest'));

        $paginator = $listings->paginate((int) $request->input('per_page', 12));

        return ApiResponse::success(
            StorefrontProductResource::collection($paginator),
            'Shop products retrieved successfully',
            200,
            ApiResponse::paginationMeta($paginator)
        );
    }

    public function show(Shop $shop, Product $product): JsonResponse
    {
        $this->ensureShopIsActive($shop);

        $listing = $this->visibleQuery($shop)
            ->where('product_id', $product->id)
            ->first();

        abort_if($listing === null, 404);

        return ApiResponse::success(
            new StorefrontProductResource($listing),
            'Product retrieved successfully'
        );
    }

    private function visibleQuery(Shop $shop): Builder
    {
        return ShopProduct::query()
            ->where('shop_id', $shop->id)
            ->active()
            ->whereHas('product', fn (Builder $product) => $product->where('is_active', true))
            ->with('product');
    }

    private function applySort(Builder $query, string $sort): void
    {
        match ($sort) {
            'price_asc' => $query->orderBy('price')->orderByDesc('id'),
            'price_desc' => $query->orderByDesc('price')->orderByDesc('id'),
            'name' => $query->orderByRaw(
                '(select name from products where products.id = shop_products.product_id) asc'
            )->orderByDesc('id'),
            default => $query->latest('id'),
        };
    }

    private function ensureShopIsActive(Shop $shop): void
    {
        abort_unless($shop->status === ShopStatus::Active, 404);
    }
}
