<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\User;
use Database\Seeders\Concerns\GeneratesPlaceholderImages;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    use GeneratesPlaceholderImages;

    public function run(): void
    {
        $admin = User::role('admin')->firstOrFail();

        $products = [
            [
                'name' => 'Wireless Earbuds',
                'sku' => 'AUD-EB-001',
                'category' => 'Electronics',
                'description' => 'Compact true-wireless earbuds with a charging case and 24-hour battery life.',
                'color' => [79, 70, 229],
            ],
            [
                'name' => 'Bluetooth Speaker',
                'sku' => 'AUD-BT-001',
                'category' => 'Electronics',
                'description' => 'Portable Bluetooth speaker with deep bass and a splash-resistant body.',
                'color' => [14, 116, 144],
            ],
            [
                'name' => 'Smart LED Bulb',
                'sku' => 'HOM-LB-001',
                'category' => 'Home',
                'description' => 'Wi-Fi enabled LED bulb with adjustable warmth and brightness.',
                'color' => [234, 179, 8],
            ],
            [
                'name' => 'Cotton Panjabi',
                'sku' => 'FAS-PJ-001',
                'category' => 'Fashion',
                'description' => 'Breathable cotton panjabi with a classic cut for everyday wear.',
                'color' => [190, 24, 93],
            ],
            [
                'name' => 'Handloom Saree',
                'sku' => 'FAS-SR-001',
                'category' => 'Fashion',
                'description' => 'Handwoven saree produced by artisan weavers in Bangladesh.',
                'color' => [147, 51, 234],
            ],
            [
                'name' => 'Leather Sandal',
                'sku' => 'FAS-SD-001',
                'category' => 'Fashion',
                'description' => 'Durable leather sandal with a cushioned sole.',
                'color' => [120, 53, 15],
            ],
            [
                'name' => 'Organic Honey 500g',
                'sku' => 'GRO-HN-001',
                'category' => 'Grocery',
                'description' => 'Raw organic honey sourced from Sundarban apiaries.',
                'color' => [202, 138, 4],
            ],
            [
                'name' => 'Basmati Rice 5kg',
                'sku' => 'GRO-RC-001',
                'category' => 'Grocery',
                'description' => 'Premium long-grain basmati rice, cleaned and packaged for retail.',
                'color' => [22, 163, 74],
            ],
            [
                'name' => 'Stainless Steel Bottle',
                'sku' => 'HOM-BT-002',
                'category' => 'Home',
                'description' => 'Insulated 750ml stainless steel bottle that keeps drinks cold for 18 hours.',
                'color' => [71, 85, 105],
            ],
            [
                'name' => 'Notebook Set',
                'sku' => 'STA-NB-001',
                'category' => 'Stationery',
                'description' => 'Set of three lined notebooks with sturdy covers and 160 pages each.',
                'color' => [220, 38, 38],
            ],
        ];

        foreach ($products as $product) {
            $slug = Str::slug($product['name']);
            $thumbnailPath = "products/{$slug}.png";

            $thumbnail = $this->makePlaceholderPng(
                $product['name'],
                $thumbnailPath,
                $product['color']
            ) ? $thumbnailPath : null;

            Product::updateOrCreate(
                ['sku' => $product['sku']],
                [
                    'name' => $product['name'],
                    'slug' => $slug,
                    'description' => $product['description'],
                    'category' => $product['category'],
                    'thumbnail' => $thumbnail,
                    'is_active' => true,
                    'created_by' => $admin->id,
                ]
            );
        }
    }
}
