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
}
