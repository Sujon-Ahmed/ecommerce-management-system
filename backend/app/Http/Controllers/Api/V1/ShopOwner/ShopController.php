<?php

namespace App\Http\Controllers\Api\V1\ShopOwner;

use App\Http\Resources\ShopResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShopController extends ShopOwnerController
{
    /**
     * Shop settings are managed by administrators; owners can read them only.
     */
    public function show(Request $request): JsonResponse
    {
        $shop = $this->shop($request)->loadCount('shopProducts');

        return ApiResponse::success(new ShopResource($shop), 'Shop retrieved successfully');
    }
}
