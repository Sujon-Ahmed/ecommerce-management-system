<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ListShopOwnersRequest;
use App\Http\Requests\Admin\StoreShopOwnerRequest;
use App\Http\Requests\Admin\UpdateShopOwnerRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\ShopOwnerService;
use App\Support\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

class ShopOwnerController extends Controller
{
    public function __construct(private readonly ShopOwnerService $owners) {}

    public function index(ListShopOwnersRequest $request): JsonResponse
    {
        $owners = User::query()
            ->role('shop_owner')
            ->with('shops')
            ->withCount('shops')
            ->when($request->filled('search'), function (Builder $query) use ($request) {
                $search = (string) $request->input('search');
                $query->where(function (Builder $inner) use ($search) {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('is_active'), fn (Builder $query) => $query->where('is_active', $request->boolean('is_active')))
            ->when($request->filled('shop_id'), fn (Builder $query) => $query->whereHas(
                'shops',
                fn (Builder $inner) => $inner->whereKey($request->integer('shop_id'))
            ))
            ->latest()
            ->paginate((int) $request->input('per_page', 15));

        return ApiResponse::success(
            UserResource::collection($owners),
            'Shop owners retrieved successfully',
            200,
            ApiResponse::paginationMeta($owners)
        );
    }

    public function store(StoreShopOwnerRequest $request): JsonResponse
    {
        $owner = $this->owners->create($request->validated());

        return ApiResponse::success(new UserResource($owner), 'Shop owner created successfully', 201);
    }

    public function show(User $user): JsonResponse
    {
        $this->ensureShopOwner($user);
        $this->authorize('view', $user);

        $user->load('shops')->loadCount('shops');

        return ApiResponse::success(new UserResource($user), 'Shop owner retrieved successfully');
    }

    public function update(UpdateShopOwnerRequest $request, User $user): JsonResponse
    {
        $this->ensureShopOwner($user);
        $this->authorize('update', $user);

        $owner = $this->owners->update($user, $request->validated());

        return ApiResponse::success(new UserResource($owner), 'Shop owner updated successfully');
    }

    public function destroy(User $user): JsonResponse
    {
        $this->ensureShopOwner($user);
        $this->authorize('delete', $user);

        $this->owners->delete($user);

        return ApiResponse::success(null, 'Shop owner deleted successfully');
    }

    private function ensureShopOwner(User $user): void
    {
        abort_unless($user->hasRole('shop_owner'), 404);
    }
}
