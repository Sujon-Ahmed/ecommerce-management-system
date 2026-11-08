<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ListProductsRequest;
use App\Http\Requests\Admin\StoreProductRequest;
use App\Http\Requests\Admin\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\ProductService;
use App\Support\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

class ProductController extends Controller
{
    public function __construct(private readonly ProductService $products) {}

    public function index(ListProductsRequest $request): JsonResponse
    {
        $products = Product::query()
            ->with('creator')
            ->withCount(['shops', 'shopProducts'])
            ->when($request->filled('search'), function (Builder $query) use ($request) {
                $search = (string) $request->input('search');
                $query->where(function (Builder $inner) use ($search) {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%")
                        ->orWhere('category', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('category'), fn (Builder $query) => $query->where('category', $request->input('category')))
            ->when($request->filled('is_active'), fn (Builder $query) => $query->where('is_active', $request->boolean('is_active')))
            ->when($request->filled('created_by'), fn (Builder $query) => $query->where('created_by', $request->integer('created_by')))
            ->latest()
            ->paginate((int) $request->input('per_page', 15));

        return ApiResponse::success(
            ProductResource::collection($products),
            'Products retrieved successfully',
            200,
            ApiResponse::paginationMeta($products)
        );
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $product = $this->products->create(
            $request->validated(),
            $request->file('thumbnail'),
            $request->user()->id
        );

        return ApiResponse::success(new ProductResource($product), 'Product created successfully', 201);
    }

    public function show(Product $product): JsonResponse
    {
        $this->authorize('view', $product);

        $product->load(['creator', 'shopProducts.shop'])
            ->loadCount(['shops', 'shopProducts']);

        return ApiResponse::success(new ProductResource($product), 'Product retrieved successfully');
    }

    public function update(UpdateProductRequest $request, Product $product): JsonResponse
    {
        $this->authorize('update', $product);

        $product = $this->products->update(
            $product,
            $request->validated(),
            $request->file('thumbnail'),
            $request->boolean('remove_thumbnail')
        );

        return ApiResponse::success(new ProductResource($product), 'Product updated successfully');
    }

    public function destroy(Product $product): JsonResponse
    {
        $this->authorize('delete', $product);

        $this->products->delete($product);

        return ApiResponse::success(null, 'Product deleted successfully');
    }
}
