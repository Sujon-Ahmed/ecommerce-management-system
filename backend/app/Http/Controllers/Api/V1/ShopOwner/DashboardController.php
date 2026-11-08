<?php

namespace App\Http\Controllers\Api\V1\ShopOwner;

use App\Http\Resources\ShopResource;
use App\Services\DashboardService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends ShopOwnerController
{
    public function __construct(private readonly DashboardService $dashboard) {}

    public function index(Request $request): JsonResponse
    {
        $shop = $this->shop($request);

        return ApiResponse::success([
            'shop' => new ShopResource($shop->loadCount('shopProducts')),
            'stats' => $this->dashboard->shopOwnerStats($shop),
        ], 'Shop dashboard retrieved successfully');
    }
}
