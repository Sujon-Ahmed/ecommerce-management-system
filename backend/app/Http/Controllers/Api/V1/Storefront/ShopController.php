<?php

namespace App\Http\Controllers\Api\V1\Storefront;

use App\Enums\ShopStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\StorefrontShopResource;
use App\Models\Shop;
use App\Support\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

class ShopController extends Controller
{
    public function index(): JsonResponse
    {
        $shops = Shop::query()
            ->active()
            ->withCount($this->visibleProductsCount())
            ->orderBy('name')
            ->get();

        return ApiResponse::success(
            StorefrontShopResource::collection($shops),
            'Active shops retrieved successfully'
        );
    }

    public function show(Shop $shop): JsonResponse
    {
        abort_unless($shop->status === ShopStatus::Active, 404);

        $shop->loadCount($this->visibleProductsCount());

        return ApiResponse::success(
            new StorefrontShopResource($shop),
            'Shop retrieved successfully'
        );
    }

    /**
     * @return array<string, \Closure(Builder): void>
     */
    private function visibleProductsCount(): array
    {
        return [
            'shopProducts as visible_products_count' => function (Builder $query) {
                $query->where('status', 'active')
                    ->whereHas('product', fn (Builder $product) => $product->where('is_active', true));
            },
        ];
    }
}
