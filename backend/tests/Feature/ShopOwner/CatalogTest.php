<?php

use App\Models\Product;
use App\Models\Shop;
use App\Models\ShopProduct;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    $this->shop = Shop::factory()->create();
    $this->owner = ownerForShops([$this->shop]);
    Sanctum::actingAs($this->owner);
});

it('lists only active catalog products with assignment status', function () {
    $active = Product::factory()->create();
    $inactive = Product::factory()->inactive()->create();
    ShopProduct::factory()->create([
        'shop_id' => $this->shop->id,
        'product_id' => $active->id,
    ]);

    $response = $this->getJson('/api/v1/shop-owner/catalog');

    $response
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $active->id)
        ->assertJsonPath('data.0.assigned', true)
        ->assertJsonPath('data.0.shop_product_id', ShopProduct::firstWhere('product_id', $active->id)->id);

    expect(Product::find($inactive->id))->not->toBeNull();
});

it('filters the catalog by search, category and assignment', function () {
    $earbuds = Product::factory()->create(['name' => 'Wireless Earbuds', 'category' => 'Electronics']);
    $panjabi = Product::factory()->create(['name' => 'Cotton Panjabi', 'category' => 'Fashion']);
    ShopProduct::factory()->create(['shop_id' => $this->shop->id, 'product_id' => $earbuds->id]);

    $this->getJson('/api/v1/shop-owner/catalog?search=Earbuds')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $earbuds->id);

    $this->getJson('/api/v1/shop-owner/catalog?category=Fashion')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $panjabi->id);

    $this->getJson('/api/v1/shop-owner/catalog?assigned=0')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $panjabi->id);
});

it('scopes assignment status to the current shop', function () {
    $product = Product::factory()->create();
    $otherShop = Shop::factory()->create();
    ShopProduct::factory()->create([
        'shop_id' => $otherShop->id,
        'product_id' => $product->id,
    ]);

    $this->getJson('/api/v1/shop-owner/catalog/'.$product->id)
        ->assertOk()
        ->assertJsonPath('data.assigned', false)
        ->assertJsonPath('data.shop_product_id', null);
});

it('assigns an existing catalog product to the shop', function () {
    $product = Product::factory()->create();

    $response = $this->postJson("/api/v1/shop-owner/catalog/{$product->id}/assign", [
        'price' => 2490.50,
        'stock' => 7,
        'shop_description' => 'Shop exclusive bundle.',
        'shop_status' => 'active',
    ]);

    $response
        ->assertCreated()
        ->assertJsonPath('data.product_id', $product->id)
        ->assertJsonPath('data.price', '2490.50')
        ->assertJsonPath('data.stock', 7)
        ->assertJsonPath('data.in_stock', true)
        ->assertJsonPath('data.product.id', $product->id);

    $this->assertDatabaseHas('shop_products', [
        'shop_id' => $this->shop->id,
        'product_id' => $product->id,
        'stock' => 7,
    ]);
});

it('rejects assigning the same product twice', function () {
    $product = Product::factory()->create();
    ShopProduct::factory()->create([
        'shop_id' => $this->shop->id,
        'product_id' => $product->id,
    ]);

    $this->postJson("/api/v1/shop-owner/catalog/{$product->id}/assign", [
        'price' => 100,
    ])
        ->assertStatus(409)
        ->assertJsonPath('code', 'ALREADY_ASSIGNED');
});

it('rejects assigning an inactive product', function () {
    $product = Product::factory()->inactive()->create();

    $this->postJson("/api/v1/shop-owner/catalog/{$product->id}/assign", [
        'price' => 100,
    ])
        ->assertStatus(409)
        ->assertJsonPath('code', 'PRODUCT_INACTIVE');
});

it('validates the assignment payload', function () {
    $product = Product::factory()->create();

    $this->postJson("/api/v1/shop-owner/catalog/{$product->id}/assign", [])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['price']);
});

it('hides inactive catalog products from the detail endpoint', function () {
    $product = Product::factory()->inactive()->create();

    $this->getJson('/api/v1/shop-owner/catalog/'.$product->id)
        ->assertStatus(404);
});
