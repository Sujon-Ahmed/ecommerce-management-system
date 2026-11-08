<?php

use App\Models\Product;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    Sanctum::actingAs(adminUser());
});

it('lists products with pagination metadata', function () {
    Product::factory()->count(4)->create(['created_by' => auth()->id()]);

    $this->getJson('/api/v1/admin/products')
        ->assertOk()
        ->assertJsonPath('meta.total', 4)
        ->assertJsonCount(4, 'data');
});

it('filters products by search and category', function () {
    Product::factory()->create([
        'name' => 'Wireless Earbuds',
        'category' => 'Electronics',
        'created_by' => auth()->id(),
        'sku' => 'AUD-001',
    ]);
    Product::factory()->create([
        'name' => 'Cotton Panjabi',
        'category' => 'Fashion',
        'created_by' => auth()->id(),
        'sku' => 'FAS-001',
    ]);

    $this->getJson('/api/v1/admin/products?search=Wireless')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Wireless Earbuds');

    $this->getJson('/api/v1/admin/products?category=Fashion')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Cotton Panjabi');
});

it('creates a global product and normalizes the sku', function () {
    $response = $this->postJson('/api/v1/admin/products', [
        'name' => 'Portable Charger',
        'sku' => '  ele-chg-001  ',
        'description' => 'A 10,000mAh power bank.',
        'category' => 'Electronics',
        'is_active' => true,
    ]);

    $response
        ->assertCreated()
        ->assertJsonPath('data.name', 'Portable Charger')
        ->assertJsonPath('data.sku', 'ELE-CHG-001')
        ->assertJsonPath('data.slug', 'portable-charger')
        ->assertJsonPath('data.is_active', true);

    $this->assertDatabaseHas('products', ['sku' => 'ELE-CHG-001']);
});

it('creates a product with an uploaded thumbnail', function () {
    Storage::fake('public');

    $response = $this->post('/api/v1/admin/products', [
        'name' => 'Thumbnail Product',
        'sku' => 'THM-001',
        'thumbnail' => UploadedFile::fake()->image('thumb.png', 600, 400),
    ], ['Accept' => 'application/json']);

    $response->assertCreated();

    $product = Product::firstWhere('sku', 'THM-001');
    expect($product->thumbnail)->not->toBeNull();
    Storage::disk('public')->assertExists($product->thumbnail);
});

it('rejects duplicate skus', function () {
    Product::factory()->create(['sku' => 'DUP-001', 'created_by' => auth()->id()]);

    $this->postJson('/api/v1/admin/products', [
        'name' => 'Duplicate SKU',
        'sku' => 'DUP-001',
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['sku']);
});

it('shows a product with its shop assignments', function () {
    $product = Product::factory()->create(['created_by' => auth()->id()]);

    $this->getJson("/api/v1/admin/products/{$product->id}")
        ->assertOk()
        ->assertJsonPath('data.id', $product->id)
        ->assertJsonStructure(['data' => ['created_by', 'shop_products', 'shops_count']]);
});

it('updates a global product', function () {
    $product = Product::factory()->create([
        'name' => 'Old Product',
        'created_by' => auth()->id(),
    ]);

    $this->putJson("/api/v1/admin/products/{$product->id}", [
        'name' => 'Renamed Product',
        'category' => 'Home',
        'is_active' => false,
    ])
        ->assertOk()
        ->assertJsonPath('data.name', 'Renamed Product')
        ->assertJsonPath('data.category', 'Home')
        ->assertJsonPath('data.is_active', false);
});

it('soft deletes a product', function () {
    $product = Product::factory()->create(['created_by' => auth()->id()]);

    $this->deleteJson("/api/v1/admin/products/{$product->id}")
        ->assertOk();

    $this->assertSoftDeleted('products', ['id' => $product->id]);
});

it('validates product payloads', function () {
    $this->postJson('/api/v1/admin/products', [])
        ->assertStatus(422)
        ->assertJsonPath('code', 'VALIDATION_ERROR')
        ->assertJsonValidationErrors(['name', 'sku']);
});

it('forbids shop owners from the admin product endpoints', function () {
    Sanctum::actingAs(shopOwnerUser());

    $this->postJson('/api/v1/admin/products', [
        'name' => 'No Permission',
        'sku' => 'NOP-001',
    ])->assertStatus(403);
});
