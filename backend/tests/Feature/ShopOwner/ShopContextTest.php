<?php

use App\Models\Shop;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

it('infers the shop when the owner has exactly one assignment', function () {
    $shop = Shop::factory()->create();
    Sanctum::actingAs(ownerForShops([$shop]));

    $this->getJson('/api/v1/shop-owner/dashboard')
        ->assertOk()
        ->assertJsonPath('data.shop.id', $shop->id);
});

it('requires a shop context when the owner has multiple shops', function () {
    $shops = Shop::factory()->count(2)->create();
    Sanctum::actingAs(ownerForShops($shops->all()));

    $this->getJson('/api/v1/shop-owner/dashboard')
        ->assertStatus(422)
        ->assertJsonPath('code', 'SHOP_CONTEXT_REQUIRED');
});

it('selects the shop from the X-Shop-Id header', function () {
    $shops = Shop::factory()->count(2)->create();
    $owner = ownerForShops($shops->all());
    Sanctum::actingAs($owner);

    $this->withHeader('X-Shop-Id', (string) $shops[1]->id)
        ->getJson('/api/v1/shop-owner/shop')
        ->assertOk()
        ->assertJsonPath('data.id', $shops[1]->id);
});

it('selects the shop from the shop_id query parameter', function () {
    $shops = Shop::factory()->count(2)->create();
    Sanctum::actingAs(ownerForShops($shops->all()));

    $this->getJson('/api/v1/shop-owner/shop?shop_id='.$shops[0]->id)
        ->assertOk()
        ->assertJsonPath('data.id', $shops[0]->id);
});

it('rejects a shop the owner is not assigned to', function () {
    $other = Shop::factory()->create();
    Sanctum::actingAs(ownerForShops([Shop::factory()->create()]));

    $this->withHeader('X-Shop-Id', (string) $other->id)
        ->getJson('/api/v1/shop-owner/dashboard')
        ->assertStatus(403)
        ->assertJsonPath('code', 'SHOP_NOT_ASSIGNED');
});

it('rejects owners with no assigned shop', function () {
    Sanctum::actingAs(shopOwnerUser());

    $this->getJson('/api/v1/shop-owner/dashboard')
        ->assertStatus(403)
        ->assertJsonPath('code', 'NO_SHOP_ASSIGNED');
});

it('rejects inactive shops', function () {
    Sanctum::actingAs(ownerForShops([Shop::factory()->inactive()->create()]));

    $this->getJson('/api/v1/shop-owner/dashboard')
        ->assertStatus(403)
        ->assertJsonPath('code', 'SHOP_INACTIVE');
});

it('rejects inactive shops even when selected explicitly', function () {
    $inactive = Shop::factory()->inactive()->create();
    Sanctum::actingAs(ownerForShops([$inactive, Shop::factory()->create()]));

    $this->withHeader('X-Shop-Id', (string) $inactive->id)
        ->getJson('/api/v1/shop-owner/dashboard')
        ->assertStatus(403)
        ->assertJsonPath('code', 'SHOP_INACTIVE');
});

it('forbids administrators and customers from the shop-owner area', function () {
    Sanctum::actingAs(adminUser());

    $this->getJson('/api/v1/shop-owner/dashboard')
        ->assertStatus(403)
        ->assertJsonPath('code', 'FORBIDDEN');

    Sanctum::actingAs(User::factory()->create()->assignRole('customer'));

    $this->getJson('/api/v1/shop-owner/catalog')->assertStatus(403);
});
