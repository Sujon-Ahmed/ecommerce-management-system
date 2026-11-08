<?php

namespace Database\Seeders;

use App\Enums\ShopStatus;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Database\Seeder;

class ShopSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::role('admin')->firstOrFail();

        $shops = [
            [
                'name' => 'Dhaka Gadget Hub',
                'slug' => 'dhaka-gadget-hub',
                'description' => 'Everyday electronics and accessories, delivered across Dhaka.',
                'status' => ShopStatus::Active->value,
            ],
            [
                'name' => 'Chattogram Fashion House',
                'slug' => 'chattogram-fashion-house',
                'description' => 'Traditional and contemporary fashion from Chattogram.',
                'status' => ShopStatus::Active->value,
            ],
            [
                'name' => 'Sylhet Organic Bazaar',
                'slug' => 'sylhet-organic-bazaar',
                'description' => 'Organic groceries and household essentials from Sylhet.',
                'status' => ShopStatus::Active->value,
            ],
            [
                'name' => 'Barishal Books & Stationery',
                'slug' => 'barishal-books-stationery',
                'description' => 'A temporarily inactive demo shop used to verify storefront hiding.',
                'status' => ShopStatus::Inactive->value,
            ],
        ];

        foreach ($shops as $shop) {
            Shop::updateOrCreate(
                ['slug' => $shop['slug']],
                $shop + ['created_by' => $admin->id]
            );
        }
    }
}
