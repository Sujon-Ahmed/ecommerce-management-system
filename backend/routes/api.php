<?php

use App\Http\Controllers\Api\V1\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Api\V1\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Api\V1\Admin\ShopController as AdminShopController;
use App\Http\Controllers\Api\V1\Admin\ShopOwnerController as AdminShopOwnerController;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\ShopOwner\CatalogController as ShopOwnerCatalogController;
use App\Http\Controllers\Api\V1\ShopOwner\DashboardController as ShopOwnerDashboardController;
use App\Http\Controllers\Api\V1\ShopOwner\ShopController as ShopOwnerShopController;
use App\Http\Controllers\Api\V1\ShopOwner\ShopProductController as ShopOwnerProductController;
use App\Http\Middleware\ResolveShopContext;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:login');

    Route::middleware(['auth:sanctum', 'active'])->group(function () {
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::put('auth/profile', [AuthController::class, 'updateProfile']);
        Route::put('auth/password', [AuthController::class, 'updatePassword']);
    });

    Route::prefix('admin')
        ->middleware(['auth:sanctum', 'active', 'role:admin'])
        ->group(function () {
            Route::get('dashboard', [AdminDashboardController::class, 'index'])
                ->middleware('permission:dashboard.view');

            Route::get('shops', [AdminShopController::class, 'index'])
                ->middleware('permission:shops.view');
            Route::post('shops', [AdminShopController::class, 'store'])
                ->middleware('permission:shops.create');
            Route::get('shops/{shop}', [AdminShopController::class, 'show'])
                ->middleware('permission:shops.view');
            Route::match(['put', 'patch'], 'shops/{shop}', [AdminShopController::class, 'update'])
                ->middleware('permission:shops.update');
            Route::delete('shops/{shop}', [AdminShopController::class, 'destroy'])
                ->middleware('permission:shops.delete');
            Route::get('shops/{shop}/products', [AdminShopController::class, 'products'])
                ->middleware('permission:shops.view');

            Route::get('shop-owners', [AdminShopOwnerController::class, 'index'])
                ->middleware('permission:shop-owners.view');
            Route::post('shop-owners', [AdminShopOwnerController::class, 'store'])
                ->middleware('permission:shop-owners.create');
            Route::get('shop-owners/{user}', [AdminShopOwnerController::class, 'show'])
                ->middleware('permission:shop-owners.view');
            Route::match(['put', 'patch'], 'shop-owners/{user}', [AdminShopOwnerController::class, 'update'])
                ->middleware('permission:shop-owners.update');
            Route::delete('shop-owners/{user}', [AdminShopOwnerController::class, 'destroy'])
                ->middleware('permission:shop-owners.delete');

            Route::get('products', [AdminProductController::class, 'index'])
                ->middleware('permission:products.view');
            Route::post('products', [AdminProductController::class, 'store'])
                ->middleware('permission:products.create');
            Route::get('products/{product}', [AdminProductController::class, 'show'])
                ->middleware('permission:products.view');
            Route::match(['put', 'patch'], 'products/{product}', [AdminProductController::class, 'update'])
                ->middleware('permission:products.update');
            Route::delete('products/{product}', [AdminProductController::class, 'destroy'])
                ->middleware('permission:products.delete');
        });

    Route::prefix('shop-owner')
        ->middleware(['auth:sanctum', 'active', 'role:shop_owner', ResolveShopContext::class])
        ->group(function () {
            Route::get('dashboard', [ShopOwnerDashboardController::class, 'index'])
                ->middleware('permission:dashboard.view');

            Route::get('shop', [ShopOwnerShopController::class, 'show'])
                ->middleware('permission:shops.view');

            Route::get('catalog', [ShopOwnerCatalogController::class, 'index'])
                ->middleware('permission:catalog.view');
            Route::get('catalog/{product}', [ShopOwnerCatalogController::class, 'show'])
                ->middleware('permission:catalog.view');
            Route::post('catalog/{product}/assign', [ShopOwnerCatalogController::class, 'assign'])
                ->middleware('permission:shop-products.assign');

            Route::get('products', [ShopOwnerProductController::class, 'index'])
                ->middleware('permission:shop-products.view');
            Route::post('products', [ShopOwnerProductController::class, 'store'])
                ->middleware('permission:products.create');
            Route::match(['put', 'patch'], 'products/{product}', [ShopOwnerProductController::class, 'update'])
                ->middleware('permission:shop-products.update');
            Route::delete('products/{product}', [ShopOwnerProductController::class, 'destroy'])
                ->middleware('permission:shop-products.delete');
        });
});
