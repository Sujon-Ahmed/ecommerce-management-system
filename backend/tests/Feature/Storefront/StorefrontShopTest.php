<?php

use App\Models\Shop;

it('lists active shops only with visible product counts', function () {
    $active = Shop::factory()->create(['name' => 'Active Shop']);
    $inactive = Shop::factory()->inactive()->create(['name' => 'Closed Shop']);

    createListing($active);
    createListing($active);
    createListing($active, ['is_active' => false]);
    createListing($active, [], ['status' => 'inactive']);

    $response = $this->getJson('/api/v1/storefront/shops');

    $response
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $active->id)
        ->assertJsonPath('data.0.products_count', 2);

    expect($inactive)->not->toBeNull();
});

it('returns a public shop profile', function () {
    $shop = Shop::factory()->create([
        'name' => 'Dhaka Gadget Hub',
        'slug' => 'dhaka-gadget-hub',
        'description' => 'Electronics for everyone.',
    ]);

    createListing($shop);
    createListing($shop, ['is_active' => false]);

    $this->getJson('/api/v1/storefront/shops/dhaka-gadget-hub')
        ->assertOk()
        ->assertJsonPath('data.id', $shop->id)
        ->assertJsonPath('data.name', 'Dhaka Gadget Hub')
        ->assertJsonPath('data.products_count', 1);
});

it('hides inactive and soft-deleted shops', function () {
    $inactive = Shop::factory()->inactive()->create();
    $deleted = Shop::factory()->create();
    $deleted->delete();

    $this->getJson('/api/v1/storefront/shops/'.$inactive->slug)->assertStatus(404);
    $this->getJson('/api/v1/storefront/shops/'.$deleted->slug)->assertStatus(404);
});

it('returns 404 for unknown shops', function () {
    $this->getJson('/api/v1/storefront/shops/does-not-exist')->assertStatus(404);
});
