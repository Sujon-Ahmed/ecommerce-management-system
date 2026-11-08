<?php

namespace App\Http\Middleware;

use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user !== null && ! $user->is_active) {
            $user->currentAccessToken()?->delete();

            return ApiResponse::error(
                'Your account has been deactivated. Please contact an administrator.',
                403,
                [],
                'ACCOUNT_INACTIVE'
            );
        }

        return $next($request);
    }
}
