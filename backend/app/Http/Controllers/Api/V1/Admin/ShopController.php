<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ListShopProductsRequest;
use App\Http\Requests\Admin\ListShopsRequest;
use App\Http\Requests\Admin\StoreShopRequest;
use App\Http\Requests\Admin\UpdateShopRequest;
use App\Http\Resources\ShopProductResource;
use App\Http\Resources\ShopResource;
use App\Models\Shop;
use App\Services\ShopService;
use App\Support\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

class ShopController extends Controller
{
    public function __construct(private readonly ShopService $shops) {}

    public function index(ListShopsRequest $request): JsonResponse
    {
        $shops = Shop::query()
            ->withCount(['owners', 'shopProducts'])
            ->when($request->filled('search'), function (Builder $query) use ($request) {
                $search = (string) $request->input('search');
                $query->where(function (Builder $inner) use ($search) {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('status'), fn (Builder $query) => $query->where('status', $request->input('status')))
            ->latest()
            ->paginate((int) $request->input('per_page', 15));

        return ApiResponse::success(
            ShopResource::collection($shops),
            'Shops retrieved successfully',
            200,
            ApiResponse::paginationMeta($shops)
        );
    }

    public function store(StoreShopRequest $request): JsonResponse
    {
        $shop = $this->shops->create(
            $request->validated(),
            $request->file('logo'),
            $request->user()->id
        );

        $shop->loadCount(['owners', 'shopProducts']);

        return ApiResponse::success(new ShopResource($shop), 'Shop created successfully', 201);
    }

    public function show(Shop $shop): JsonResponse
    {
        $this->authorize('view', $shop);

        $shop->load('owners')->loadCount(['owners', 'shopProducts']);

        return ApiResponse::success(new ShopResource($shop), 'Shop retrieved successfully');
    }

    public function update(UpdateShopRequest $request, Shop $shop): JsonResponse
    {
        $this->authorize('update', $shop);

        $shop = $this->shops->update(
            $shop,
            $request->validated(),
            $request->file('logo'),
            $request->boolean('remove_logo')
        );

        $shop->loadCount(['owners', 'shopProducts']);

        return ApiResponse::success(new ShopResource($shop), 'Shop updated successfully');
    }

    public function destroy(Shop $shop): JsonResponse
    {
        $this->authorize('delete', $shop);

        $this->shops->delete($shop);

        return ApiResponse::success(null, 'Shop deleted successfully');
    }

    public function products(ListShopProductsRequest $request, Shop $shop): JsonResponse
    {
        $this->authorize('view', $shop);

        $shopProducts = $shop->shopProducts()
            ->with('product')
            ->when($request->filled('search'), function (Builder $query) use ($request) {
                $search = (string) $request->input('search');
                $query->whereHas('product', function (Builder $inner) use ($search) {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('status'), fn (Builder $query) => $query->where('status', $request->input('status')))
            ->latest()
            ->paginate((int) $request->input('per_page', 15));

        return ApiResponse::success(
            ShopProductResource::collection($shopProducts),
            'Shop products retrieved successfully',
            200,
            ApiResponse::paginationMeta($shopProducts)
        );
    }
}
