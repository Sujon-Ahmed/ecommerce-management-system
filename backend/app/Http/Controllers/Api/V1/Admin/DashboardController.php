<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Http\Resources\ShopResource;
use App\Models\Product;
use App\Models\Shop;
use App\Services\DashboardService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __construct(private readonly DashboardService $dashboard) {}

    public function index(): JsonResponse
    {
        return ApiResponse::success([
            'stats' => $this->dashboard->adminStats(),
            'recent_shops' => ShopResource::collection(Shop::latest()->limit(5)->get()),
            'recent_products' => ProductResource::collection(Product::latest()->limit(5)->get()),
        ], 'Dashboard statistics retrieved successfully');
    }
}
