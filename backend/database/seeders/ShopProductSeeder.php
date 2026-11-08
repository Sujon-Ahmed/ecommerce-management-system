<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Shop;
use App\Models\ShopProduct;
use Database\Seeders\Concerns\GeneratesPlaceholderImages;
use Illuminate\Database\Seeder;

class ShopProductSeeder extends Seeder
{
    use GeneratesPlaceholderImages;

    public function run(): void
    {
        $shops = Shop::pluck('id', 'slug');
        $products = Product::pluck('id', 'sku');

        $assignments = [
            [
                'shop' => 'dhaka-gadget-hub',
                'sku' => 'AUD-EB-001',
                'price' => 2490.00,
                'stock' => 12,
                'status' => 'active',
                'description' => 'Crisp sound, touch controls, and a pocket-sized charging case.',
            ],
            [
                'shop' => 'dhaka-gadget-hub',
                'sku' => 'AUD-BT-001',
                'price' => 3200.00,
                'stock' => 8,
                'status' => 'active',
                'description' => null,
            ],
            [
                'shop' => 'dhaka-gadget-hub',
                'sku' => 'HOM-LB-001',
                'price' => 450.00,
                'stock' => 0,
                'status' => 'active',
                'description' => null,
            ],
            [
                'shop' => 'dhaka-gadget-hub',
                'sku' => 'HOM-BT-002',
                'price' => 850.00,
                'stock' => 20,
                'status' => 'inactive',
                'description' => 'Temporarily hidden from the Dhaka storefront.',
            ],
            [
                'shop' => 'chattogram-fashion-house',
                'sku' => 'AUD-EB-001',
                'price' => 2650.00,
                'stock' => 6,
                'status' => 'active',
                'description' => 'Chattogram exclusive colour with the same 24-hour battery life.',
            ],
            [
                'shop' => 'chattogram-fashion-house',
                'sku' => 'FAS-PJ-001',
                'price' => 1890.00,
                'stock' => 15,
                'status' => 'active',
                'description' => null,
            ],
            [
                'shop' => 'chattogram-fashion-house',
                'sku' => 'FAS-SR-001',
                'price' => 4500.00,
                'stock' => 4,
                'status' => 'active',
                'description' => null,
            ],
            [
                'shop' => 'sylhet-organic-bazaar',
                'sku' => 'GRO-HN-001',
                'price' => 950.00,
                'stock' => 30,
                'status' => 'active',
                'description' => null,
            ],
            [
                'shop' => 'sylhet-organic-bazaar',
                'sku' => 'GRO-RC-001',
                'price' => 1250.00,
                'stock' => 25,
                'status' => 'active',
                'description' => null,
            ],
            [
                'shop' => 'sylhet-organic-bazaar',
                'sku' => 'HOM-BT-002',
                'price' => 890.00,
                'stock' => 10,
                'status' => 'active',
                'description' => null,
            ],
            [
                'shop' => 'sylhet-organic-bazaar',
                'sku' => 'HOM-LB-001',
                'price' => 480.00,
                'stock' => 18,
                'status' => 'active',
                'description' => null,
            ],
        ];

        foreach ($assignments as $assignment) {
            ShopProduct::updateOrCreate(
                [
                    'shop_id' => $shops[$assignment['shop']],
                    'product_id' => $products[$assignment['sku']],
                ],
                [
                    'price' => $assignment['price'],
                    'description' => $assignment['description'],
                    'stock' => $assignment['stock'],
                    'status' => $assignment['status'],
                ]
            );
        }

        $chattogramId = $shops['chattogram-fashion-house'];
        $earbudsId = $products['AUD-EB-001'];
        $thumbnailPath = "shop-products/{$chattogramId}/wireless-earbuds.png";

        if ($this->makePlaceholderPng('Chattogram Exclusive Earbuds', $thumbnailPath, [190, 24, 93])) {
            ShopProduct::where('shop_id', $chattogramId)
                ->where('product_id', $earbudsId)
                ->update(['thumbnail' => $thumbnailPath]);
        }
    }
}
