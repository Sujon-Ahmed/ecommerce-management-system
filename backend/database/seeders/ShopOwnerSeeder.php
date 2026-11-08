<?php

namespace Database\Seeders;

use App\Models\Shop;
use App\Models\User;
use Illuminate\Database\Seeder;

class ShopOwnerSeeder extends Seeder
{
    public function run(): void
    {
        $owners = [
            [
                'name' => 'Rafiq Ahmed',
                'email' => 'owner.dhaka@example.com',
                'phone' => '+8801700000002',
                'shops' => ['dhaka-gadget-hub', 'chattogram-fashion-house'],
            ],
            [
                'name' => 'Nusrat Jahan',
                'email' => 'owner.sylhet@example.com',
                'phone' => '+8801700000003',
                'shops' => ['sylhet-organic-bazaar'],
            ],
            [
                'name' => 'Imran Hossain',
                'email' => 'owner.barishal@example.com',
                'phone' => '+8801700000004',
                'shops' => ['barishal-books-stationery'],
            ],
        ];

        foreach ($owners as $owner) {
            $user = User::updateOrCreate(
                ['email' => $owner['email']],
                [
                    'name' => $owner['name'],
                    'password' => 'Password@123!',
                    'phone' => $owner['phone'],
                    'is_active' => true,
                    'email_verified_at' => now(),
                ]
            );

            $user->syncRoles(['shop_owner']);

            $shopIds = Shop::whereIn('slug', $owner['shops'])->pluck('id')->all();
            $user->shops()->sync($shopIds);
        }
    }
}
