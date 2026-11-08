<?php

use App\Models\Product;
use App\Models\Shop;
use App\Models\ShopProduct;
use Laravel\Sanctum\Sanctum;

it('returns aggregate admin dashboard statistics', function () {
    $admin = adminUser();
    Sanctum::actingAs($admin);

    $activeShop = Shop::factory()->create(['created_by' => $admin->id]);
    Shop::factory()->inactive()->create(['created_by' => $admin->id]);

    $activeProduct = Product::factory()->create(['created_by' => $admin->id]);
    Product::factory()->inactive()->create(['created_by' => $admin->id]);

    ShopProduct::factory()->create([
        'shop_id' => $activeShop->id,
        'product_id' => $activeProduct->id,
    ]);

    shopOwnerUser();

    $this->getJson('/api/v1/admin/dashboard')
        ->assertOk()
        ->assertJsonPath('data.stats.shops.total', 2)
        ->assertJsonPath('data.stats.shops.active', 1)
        ->assertJsonPath('data.stats.shops.inactive', 1)
        ->assertJsonPath('data.stats.products.total', 2)
        ->assertJsonPath('data.stats.products.active', 1)
        ->assertJsonPath('data.stats.shop_owners', 1)
        ->assertJsonPath('data.stats.assignments', 1)
        ->assertJsonStructure(['data' => ['recent_shops', 'recent_products']]);
});

it('forbids shop owners from the admin dashboard', function () {
    Sanctum::actingAs(shopOwnerUser());

    $this->getJson('/api/v1/admin/dashboard')->assertStatus(403);
});
