<?php

use App\Models\Product;
use App\Models\Shop;
use App\Models\ShopProduct;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    $this->shop = Shop::factory()->create();
    $this->owner = ownerForShops([$this->shop]);
    Sanctum::actingAs($this->owner);
});

it('creates a catalog product and assigns it to the current shop', function () {
    $response = $this->postJson('/api/v1/shop-owner/products', [
        'name' => 'Owner Made Product',
        'sku' => ' own-001 ',
        'description' => 'Global catalog description.',
        'category' => 'Home',
        'price' => 1250.25,
        'stock' => 4,
        'shop_description' => 'Local description.',
    ]);

    $response
        ->assertCreated()
        ->assertJsonPath('data.product.name', 'Owner Made Product')
        ->assertJsonPath('data.product.sku', 'OWN-001')
        ->assertJsonPath('data.price', '1250.25')
        ->assertJsonPath('data.stock', 4)
        ->assertJsonPath('data.description', 'Local description.');

    $product = Product::firstWhere('sku', 'OWN-001');
    expect($product)->not->toBeNull()
        ->and($product->created_by)->toBe($this->owner->id);

    $this->assertDatabaseHas('shop_products', [
        'shop_id' => $this->shop->id,
        'product_id' => $product->id,
    ]);
});

it('creates a product with global and shop-specific thumbnails', function () {
    Storage::fake('public');

    $response = $this->post('/api/v1/shop-owner/products', [
        'name' => 'Image Product',
        'sku' => 'IMG-001',
        'price' => 500,
        'thumbnail' => UploadedFile::fake()->image('base.png', 600, 400),
        'shop_thumbnail' => UploadedFile::fake()->image('shop.png', 600, 400),
    ], ['Accept' => 'application/json']);

    $response->assertCreated();

    $listing = ShopProduct::firstWhere('product_id', Product::firstWhere('sku', 'IMG-001')->id);
    Storage::disk('public')->assertExists($listing->product->thumbnail);
    Storage::disk('public')->assertExists($listing->thumbnail);
});

it('rejects a duplicate sku when creating a product', function () {
    Product::factory()->create(['sku' => 'DUP-100']);

    $this->postJson('/api/v1/shop-owner/products', [
        'name' => 'Duplicate',
        'sku' => 'dup-100',
        'price' => 10,
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['sku']);
});

it('requires a price when creating a product', function () {
    $this->postJson('/api/v1/shop-owner/products', [
        'name' => 'No Price',
        'sku' => 'NOP-100',
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['price']);
});

it('lists only the current shop listings', function () {
    ShopProduct::factory()->create(['shop_id' => $this->shop->id]);
    ShopProduct::factory()->create();

    $this->getJson('/api/v1/shop-owner/products')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.shop_id', $this->shop->id);
});

it('filters shop listings by status and search', function () {
    $active = Product::factory()->create(['name' => 'Visible Item']);
    $inactive = Product::factory()->create(['name' => 'Hidden Item']);

    ShopProduct::factory()->create(['shop_id' => $this->shop->id, 'product_id' => $active->id]);
    ShopProduct::factory()->inactive()->create(['shop_id' => $this->shop->id, 'product_id' => $inactive->id]);

    $this->getJson('/api/v1/shop-owner/products?status=inactive')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.product.name', 'Hidden Item');

    $this->getJson('/api/v1/shop-owner/products?search=Visible')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.product.name', 'Visible Item');
});

it('updates shop-specific values without touching the global product', function () {
    $product = Product::factory()->create(['name' => 'Global Name']);
    ShopProduct::factory()->create([
        'shop_id' => $this->shop->id,
        'product_id' => $product->id,
    ]);

    $this->putJson("/api/v1/shop-owner/products/{$product->id}", [
        'name' => 'Hijacked Name',
        'sku' => 'HIJ-001',
        'price' => 2222.50,
        'stock' => 0,
        'shop_description' => 'Updated locally.',
        'shop_status' => 'inactive',
    ])
        ->assertOk()
        ->assertJsonPath('data.price', '2222.50')
        ->assertJsonPath('data.in_stock', false)
        ->assertJsonPath('data.status', 'inactive')
        ->assertJsonPath('data.description', 'Updated locally.');

    expect($product->fresh()->name)->toBe('Global Name');
    expect($product->fresh()->sku)->not->toBe('HIJ-001');
});

it('overrides and removes a shop thumbnail with fallback to the global image', function () {
    Storage::fake('public');

    $product = Product::factory()->create(['thumbnail' => 'products/base.png']);
    Storage::disk('public')->put('products/base.png', 'base');
    ShopProduct::factory()->create([
        'shop_id' => $this->shop->id,
        'product_id' => $product->id,
    ]);

    $this->post("/api/v1/shop-owner/products/{$product->id}", [
        '_method' => 'PUT',
        'shop_thumbnail' => UploadedFile::fake()->image('override.png'),
    ], ['Accept' => 'application/json'])->assertOk();

    $listing = ShopProduct::firstWhere('product_id', $product->id);
    $overridePath = $listing->thumbnail;
    Storage::disk('public')->assertExists($overridePath);
    expect($overridePath)->toStartWith('shop-products/'.$this->shop->id);

    $this->putJson("/api/v1/shop-owner/products/{$product->id}", [
        'remove_shop_thumbnail' => true,
    ])
        ->assertOk()
        ->assertJsonPath('data.thumbnail_url', null)
        ->assertJsonPath('data.effective_thumbnail_url', $product->thumbnail_url);

    expect($listing->fresh()->thumbnail)->toBeNull();
    Storage::disk('public')->assertMissing($overridePath);
});

it('returns not found when updating a product not assigned to the shop', function () {
    $product = Product::factory()->create();

    $this->putJson("/api/v1/shop-owner/products/{$product->id}", ['price' => 10])
        ->assertStatus(404)
        ->assertJsonPath('code', 'NOT_ASSIGNED');
});

it('unassigns a product while keeping the global product', function () {
    $product = Product::factory()->create();
    ShopProduct::factory()->create([
        'shop_id' => $this->shop->id,
        'product_id' => $product->id,
    ]);

    $this->deleteJson("/api/v1/shop-owner/products/{$product->id}")
        ->assertOk();

    $this->assertDatabaseMissing('shop_products', [
        'shop_id' => $this->shop->id,
        'product_id' => $product->id,
    ]);
    expect(Product::find($product->id))->not->toBeNull();
});

it('prevents another shop owner from modifying the listing', function () {
    $product = Product::factory()->create();
    ShopProduct::factory()->create([
        'shop_id' => $this->shop->id,
        'product_id' => $product->id,
    ]);

    $otherOwner = ownerForShops([Shop::factory()->create()]);
    Sanctum::actingAs($otherOwner);

    $this->putJson("/api/v1/shop-owner/products/{$product->id}", ['price' => 1])
        ->assertStatus(404)
        ->assertJsonPath('code', 'NOT_ASSIGNED');
});
