<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\UpdatePasswordRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $email = Str::lower(trim((string) $request->input('email')));
        $user = User::whereRaw('LOWER(email) = ?', [$email])->first();

        if ($user === null || ! Hash::check((string) $request->input('password'), $user->password)) {
            return ApiResponse::error(
                'Invalid email or password.',
                401,
                [],
                'INVALID_CREDENTIALS'
            );
        }

        if (! $user->is_active) {
            return ApiResponse::error(
                'Your account has been deactivated. Please contact an administrator.',
                403,
                [],
                'ACCOUNT_INACTIVE'
            );
        }

        $token = $user->createToken('api-token')->plainTextToken;
        $user->loadMissing('roles', 'shops');

        return ApiResponse::success([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => new UserResource($user),
        ], 'Login successful');
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->loadMissing('roles', 'shops');

        return ApiResponse::success(new UserResource($user), 'Authenticated user retrieved successfully');
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return ApiResponse::success(null, 'Logged out successfully');
    }

    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();

        $user->fill([
            'name' => $data['name'] ?? $user->name,
            'phone' => array_key_exists('phone', $data) ? $data['phone'] : $user->phone,
        ])->save();

        return ApiResponse::success(
            new UserResource($user->loadMissing('roles', 'shops')),
            'Profile updated successfully'
        );
    }

    public function updatePassword(UpdatePasswordRequest $request): JsonResponse
    {
        $user = $request->user();

        if (! Hash::check((string) $request->input('current_password'), $user->password)) {
            return ApiResponse::error(
                'The current password is incorrect.',
                422,
                ['current_password' => ['The current password is incorrect.']],
                'INVALID_CURRENT_PASSWORD'
            );
        }

        $user->password = (string) $request->input('password');
        $user->save();

        $currentTokenId = $user->currentAccessToken()?->getKey();

        $user->tokens()
            ->when($currentTokenId !== null, fn ($query) => $query->whereKeyNot($currentTokenId))
            ->delete();

        return ApiResponse::success(null, 'Password updated successfully');
    }
}
