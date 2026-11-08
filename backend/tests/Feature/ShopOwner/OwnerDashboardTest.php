<?php

use App\Models\Product;
use App\Models\Shop;
use App\Models\ShopProduct;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    $this->shop = Shop::factory()->create();
    $this->otherShop = Shop::factory()->create();
    Sanctum::actingAs(ownerForShops([$this->shop]));
});

it('returns dashboard statistics scoped to the current shop', function () {
    ShopProduct::factory()->create([
        'shop_id' => $this->shop->id,
        'product_id' => Product::factory(),
        'stock' => 5,
    ]);
    ShopProduct::factory()->outOfStock()->create([
        'shop_id' => $this->shop->id,
        'product_id' => Product::factory(),
    ]);
    ShopProduct::factory()->inactive()->create([
        'shop_id' => $this->shop->id,
        'product_id' => Product::factory(),
        'stock' => 3,
    ]);

    // Assigned to another shop, so it only counts toward this shop's available catalog.
    ShopProduct::factory()->create([
        'shop_id' => $this->otherShop->id,
        'product_id' => Product::factory(),
    ]);

    Product::factory()->inactive()->create();

    $this->getJson('/api/v1/shop-owner/dashboard')
        ->assertOk()
        ->assertJsonPath('data.shop.id', $this->shop->id)
        ->assertJsonPath('data.stats.listings.total', 3)
        ->assertJsonPath('data.stats.listings.active', 2)
        ->assertJsonPath('data.stats.listings.inactive', 1)
        ->assertJsonPath('data.stats.listings.in_stock', 2)
        ->assertJsonPath('data.stats.listings.out_of_stock', 1)
        ->assertJsonPath('data.stats.catalog.available', 1);
});

it('exposes read-only shop settings with listing counts', function () {
    ShopProduct::factory()->count(2)->create(['shop_id' => $this->shop->id]);

    $this->getJson('/api/v1/shop-owner/shop')
        ->assertOk()
        ->assertJsonPath('data.id', $this->shop->id)
        ->assertJsonPath('data.shop_products_count', 2);

    $this->putJson('/api/v1/shop-owner/shop', ['name' => 'Hacked'])
        ->assertStatus(405);

    expect($this->shop->fresh()->name)->not->toBe('Hacked');
});
