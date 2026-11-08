<?php

namespace App\Http\Controllers\Api\V1\ShopOwner;

use App\Exceptions\BusinessRuleException;
use App\Http\Requests\ShopOwner\AssignProductRequest;
use App\Http\Requests\ShopOwner\ListCatalogProductsRequest;
use App\Http\Resources\CatalogProductResource;
use App\Http\Resources\ShopProductResource;
use App\Models\Product;
use App\Services\ShopOwnerProductService;
use App\Support\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CatalogController extends ShopOwnerController
{
    public function __construct(private readonly ShopOwnerProductService $listings) {}

    public function index(ListCatalogProductsRequest $request): JsonResponse
    {
        $shop = $this->shop($request);

        $products = Product::query()
            ->active()
            ->with(['shopProducts' => fn ($query) => $query->where('shop_id', $shop->id)])
            ->when($request->filled('search'), function (Builder $query) use ($request) {
                $search = (string) $request->input('search');
                $query->where(function (Builder $inner) use ($search) {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%")
                        ->orWhere('category', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('category'), fn (Builder $query) => $query->where('category', $request->input('category')))
            ->when($request->has('assigned'), function (Builder $query) use ($request, $shop) {
                $request->boolean('assigned')
                    ? $query->whereHas('shopProducts', fn (Builder $inner) => $inner->where('shop_id', $shop->id))
                    : $query->whereDoesntHave('shopProducts', fn (Builder $inner) => $inner->where('shop_id', $shop->id));
            })
            ->latest()
            ->paginate((int) $request->input('per_page', 15));

        return ApiResponse::success(
            CatalogProductResource::collection($products),
            'Catalog retrieved successfully',
            200,
            ApiResponse::paginationMeta($products)
        );
    }

    public function show(Request $request, Product $product): JsonResponse
    {
        abort_unless($product->is_active, 404);

        $shop = $this->shop($request);

        $product->load(['shopProducts' => fn ($query) => $query->where('shop_id', $shop->id)]);

        return ApiResponse::success(
            new CatalogProductResource($product),
            'Catalog product retrieved successfully'
        );
    }

    public function assign(AssignProductRequest $request, Product $product): JsonResponse
    {
        if (! $product->is_active) {
            throw new BusinessRuleException(
                'This product is not available in the catalog.',
                'PRODUCT_INACTIVE'
            );
        }

        $shop = $this->shop($request);

        $listing = $this->listings->assign(
            $shop,
            $product,
            $request->validated(),
            $request->file('shop_thumbnail')
        );

        return ApiResponse::success(
            new ShopProductResource($listing),
            'Product assigned to shop successfully',
            201
        );
    }
}
