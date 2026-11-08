<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Shop;
use App\Models\ShopProduct;
use App\Models\User;

class DashboardService
{
    public function adminStats(): array
    {
        return [
            'shops' => [
                'total' => Shop::count(),
                'active' => Shop::active()->count(),
                'inactive' => Shop::where('status', 'inactive')->count(),
            ],
            'products' => [
                'total' => Product::count(),
                'active' => Product::active()->count(),
            ],
            'shop_owners' => User::role('shop_owner')->count(),
            'assignments' => ShopProduct::count(),
        ];
    }

    public function shopOwnerStats(Shop $shop): array
    {
        $listings = ShopProduct::query()->where('shop_id', $shop->id);

        return [
            'listings' => [
                'total' => (clone $listings)->count(),
                'active' => (clone $listings)->where('status', 'active')->count(),
                'inactive' => (clone $listings)->where('status', 'inactive')->count(),
                'in_stock' => (clone $listings)->where('stock', '>', 0)->count(),
                'out_of_stock' => (clone $listings)->where('stock', '<=', 0)->count(),
            ],
            'catalog' => [
                'available' => Product::query()
                    ->active()
                    ->whereDoesntHave('shopProducts', fn ($query) => $query->where('shop_id', $shop->id))
                    ->count(),
            ],
        ];
    }
}
