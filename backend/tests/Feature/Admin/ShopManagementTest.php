<?php

use App\Models\Shop;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    Sanctum::actingAs(adminUser());
});

it('lists shops with pagination metadata', function () {
    Shop::factory()->count(3)->create(['created_by' => auth()->id()]);

    $response = $this->getJson('/api/v1/admin/shops');

    $response
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('meta.total', 3)
        ->assertJsonCount(3, 'data');
});

it('filters shops by search and status', function () {
    Shop::factory()->create([
        'name' => 'Dhaka Gadget Hub',
        'created_by' => auth()->id(),
        'status' => 'active',
    ]);
    Shop::factory()->inactive()->create([
        'name' => 'Closed Books',
        'created_by' => auth()->id(),
    ]);

    $this->getJson('/api/v1/admin/shops?search=Dhaka')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Dhaka Gadget Hub');

    $this->getJson('/api/v1/admin/shops?status=inactive')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Closed Books');
});

it('creates a shop with an auto-generated slug', function () {
    $response = $this->postJson('/api/v1/admin/shops', [
        'name' => 'New Dhaka Shop',
        'description' => 'A brand new shop.',
        'status' => 'active',
    ]);

    $response
        ->assertCreated()
        ->assertJsonPath('data.name', 'New Dhaka Shop')
        ->assertJsonPath('data.slug', 'new-dhaka-shop')
        ->assertJsonPath('data.status', 'active');

    $this->assertDatabaseHas('shops', [
        'name' => 'New Dhaka Shop',
        'slug' => 'new-dhaka-shop',
    ]);
});

it('creates a shop with an uploaded logo', function () {
    Storage::fake('public');

    $response = $this->post('/api/v1/admin/shops', [
        'name' => 'Logo Shop',
        'logo' => UploadedFile::fake()->image('logo.png', 600, 400),
    ], ['Accept' => 'application/json']);

    $response->assertCreated();

    $shop = Shop::firstWhere('name', 'Logo Shop');
    expect($shop->logo)->not->toBeNull();
    Storage::disk('public')->assertExists($shop->logo);
    expect($response->json('data.logo_url'))->toBeString();
});

it('shows a shop with its owners', function () {
    $shop = Shop::factory()->create(['created_by' => auth()->id()]);

    $this->getJson("/api/v1/admin/shops/{$shop->id}")
        ->assertOk()
        ->assertJsonPath('data.id', $shop->id)
        ->assertJsonStructure(['data' => ['owners', 'owners_count', 'shop_products_count']]);
});

it('updates a shop', function () {
    $shop = Shop::factory()->create(['name' => 'Old Name', 'created_by' => auth()->id()]);

    $this->putJson("/api/v1/admin/shops/{$shop->id}", [
        'name' => 'Renamed Shop',
        'status' => 'inactive',
    ])
        ->assertOk()
        ->assertJsonPath('data.name', 'Renamed Shop')
        ->assertJsonPath('data.status', 'inactive');

    expect($shop->fresh()->name)->toBe('Renamed Shop');
});

it('replaces and removes a shop logo', function () {
    Storage::fake('public');

    $shop = Shop::factory()->create([
        'created_by' => auth()->id(),
        'logo' => 'shops/old-logo.png',
    ]);
    Storage::disk('public')->put('shops/old-logo.png', 'old');

    $this->post("/api/v1/admin/shops/{$shop->id}", [
        '_method' => 'PUT',
        'logo' => UploadedFile::fake()->image('new-logo.png'),
    ], ['Accept' => 'application/json'])->assertOk();

    $newLogo = $shop->fresh()->logo;
    expect($newLogo)->not->toBe('shops/old-logo.png');
    Storage::disk('public')->assertExists($newLogo);
    Storage::disk('public')->assertMissing('shops/old-logo.png');

    $this->putJson("/api/v1/admin/shops/{$shop->id}", [
        'remove_logo' => true,
    ])->assertOk();

    expect($shop->fresh()->logo)->toBeNull();
});

it('soft deletes a shop', function () {
    $shop = Shop::factory()->create(['created_by' => auth()->id()]);

    $this->deleteJson("/api/v1/admin/shops/{$shop->id}")
        ->assertOk()
        ->assertJsonPath('success', true);

    $this->assertSoftDeleted('shops', ['id' => $shop->id]);
});

it('validates shop payloads', function () {
    $this->postJson('/api/v1/admin/shops', [])
        ->assertStatus(422)
        ->assertJsonPath('code', 'VALIDATION_ERROR')
        ->assertJsonValidationErrors(['name']);
});

it('rejects duplicate shop slugs', function () {
    Shop::factory()->create(['slug' => 'taken-slug', 'created_by' => auth()->id()]);

    $this->postJson('/api/v1/admin/shops', [
        'name' => 'Another Shop',
        'slug' => 'taken-slug',
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['slug']);
});

it('forbids shop owners from the admin shop endpoints', function () {
    Sanctum::actingAs(shopOwnerUser());

    $this->getJson('/api/v1/admin/shops')
        ->assertStatus(403)
        ->assertJsonPath('code', 'FORBIDDEN');
});
