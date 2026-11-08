<?php

namespace App\Http\Middleware;

use App\Enums\ShopStatus;
use App\Models\Shop;
use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveShopContext
{
    /**
     * Resolve which shop the authenticated owner is acting for.
     *
     * A single assigned shop is inferred. Owners with more than one shop must
     * send the X-Shop-Id header or the shop_id query parameter.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        $assigned = $user->shops()->get();

        if ($assigned->isEmpty()) {
            return ApiResponse::error(
                'No shop is assigned to your account. Please contact an administrator.',
                403,
                [],
                'NO_SHOP_ASSIGNED'
            );
        }

        $requestedId = $request->header('X-Shop-Id') ?? $request->query('shop_id');

        if ($requestedId !== null && $requestedId !== '') {
            $shop = $assigned->firstWhere('id', (int) $requestedId);

            if ($shop === null) {
                return ApiResponse::error(
                    'You are not assigned to the requested shop.',
                    403,
                    [],
                    'SHOP_NOT_ASSIGNED'
                );
            }
        } else {
            if ($assigned->count() > 1) {
                return ApiResponse::error(
                    'Multiple shops are available. Provide a shop context using the X-Shop-Id header or shop_id query parameter.',
                    422,
                    [],
                    'SHOP_CONTEXT_REQUIRED'
                );
            }

            /** @var Shop $shop */
            $shop = $assigned->first();
        }

        if ($shop->status !== ShopStatus::Active) {
            return ApiResponse::error(
                'The selected shop is not active.',
                403,
                [],
                'SHOP_INACTIVE'
            );
        }

        $request->attributes->set('shop_context', $shop);

        return $next($request);
    }
}
