<?php

namespace App\Http\Controllers\Api\V1\ShopOwner;

use App\Exceptions\BusinessRuleException;
use App\Http\Requests\ShopOwner\ListShopProductsRequest;
use App\Http\Requests\ShopOwner\StoreShopProductRequest;
use App\Http\Requests\ShopOwner\UpdateShopProductRequest;
use App\Http\Resources\ShopProductResource;
use App\Models\Product;
use App\Models\Shop;
use App\Models\ShopProduct;
use App\Services\ShopOwnerProductService;
use App\Support\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShopProductController extends ShopOwnerController
{
    public function __construct(private readonly ShopOwnerProductService $listings) {}

    public function index(ListShopProductsRequest $request): JsonResponse
    {
        $shop = $this->shop($request);

        $listings = $shop->shopProducts()
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
            ShopProductResource::collection($listings),
            'Shop products retrieved successfully',
            200,
            ApiResponse::paginationMeta($listings)
        );
    }

    public function store(StoreShopProductRequest $request): JsonResponse
    {
        $shop = $this->shop($request);

        $listing = $this->listings->createForShop(
            $shop,
            $request->validated(),
            $request->file('thumbnail'),
            $request->file('shop_thumbnail'),
            $request->user()->id
        );

        return ApiResponse::success(
            new ShopProductResource($listing),
            'Product created and assigned to the shop successfully',
            201
        );
    }

    public function update(UpdateShopProductRequest $request, Product $product): JsonResponse
    {
        $listing = $this->listingFor($this->shop($request), $product);

        $listing = $this->listings->update(
            $listing,
            $request->validated(),
            $request->file('shop_thumbnail'),
            $request->boolean('remove_shop_thumbnail')
        );

        return ApiResponse::success(
            new ShopProductResource($listing),
            'Shop product updated successfully'
        );
    }

    public function destroy(Request $request, Product $product): JsonResponse
    {
        $listing = $this->listingFor($this->shop($request), $product);

        $this->listings->unassign($listing);

        return ApiResponse::success(null, 'Product unassigned from the shop successfully');
    }

    private function listingFor(Shop $shop, Product $product): ShopProduct
    {
        /** @var ShopProduct|null $listing */
        $listing = $shop->shopProducts()->where('product_id', $product->id)->first();

        if ($listing === null) {
            throw new BusinessRuleException(
                'This product is not assigned to the current shop.',
                'NOT_ASSIGNED',
                404
            );
        }

        return $listing;
    }
}
