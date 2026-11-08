<?php

use App\Models\Shop;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    $this->admin = adminUser();
    Sanctum::actingAs($this->admin);
});

it('lists shop owners with their shops', function () {
    $owner = shopOwnerUser();
    $shop = Shop::factory()->create(['created_by' => $this->admin->id]);
    $owner->shops()->attach($shop);

    // Admin and owner accounts both exist; only shop owners are listed.
    $this->getJson('/api/v1/admin/shop-owners')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.id', $owner->id)
        ->assertJsonPath('data.0.shops_count', 1);
});

it('creates a shop owner assigned to shops', function () {
    $shop = Shop::factory()->create(['created_by' => $this->admin->id]);

    $response = $this->postJson('/api/v1/admin/shop-owners', [
        'name' => 'New Owner',
        'email' => 'New.Owner@Example.com',
        'password' => 'Password@123!',
        'password_confirmation' => 'Password@123!',
        'phone' => '+8801700000010',
        'shop_ids' => [$shop->id],
    ]);

    $response
        ->assertCreated()
        ->assertJsonPath('data.email', 'new.owner@example.com')
        ->assertJsonPath('data.shops_count', 1);

    expect($response->json('data.roles'))->toContain('shop_owner');

    $owner = User::firstWhere('email', 'new.owner@example.com');
    expect($owner->hasRole('shop_owner'))->toBeTrue()
        ->and($owner->shops->pluck('id')->all())->toBe([$shop->id]);
});

it('validates unique owner emails and password confirmation', function () {
    User::factory()->create(['email' => 'taken@example.com']);

    $this->postJson('/api/v1/admin/shop-owners', [
        'name' => 'Duplicate Email',
        'email' => 'taken@example.com',
        'password' => 'Password@123!',
        'password_confirmation' => 'different',
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['email', 'password']);
});

it('updates a shop owner and syncs shops', function () {
    $owner = shopOwnerUser();
    $first = Shop::factory()->create(['created_by' => $this->admin->id]);
    $second = Shop::factory()->create(['created_by' => $this->admin->id]);
    $owner->shops()->attach($first);

    $this->putJson("/api/v1/admin/shop-owners/{$owner->id}", [
        'name' => 'Renamed Owner',
        'shop_ids' => [$second->id],
    ])
        ->assertOk()
        ->assertJsonPath('data.name', 'Renamed Owner');

    expect($owner->fresh()->shops->pluck('id')->all())->toBe([$second->id]);
});

it('revokes tokens when an owner is deactivated', function () {
    $owner = shopOwnerUser();
    $owner->createToken('mobile');

    $this->putJson("/api/v1/admin/shop-owners/{$owner->id}", [
        'is_active' => false,
    ])->assertOk()->assertJsonPath('data.is_active', false);

    expect($owner->tokens()->count())->toBe(0);
});

it('soft deletes a shop owner and detaches shops', function () {
    $owner = shopOwnerUser();
    $shop = Shop::factory()->create(['created_by' => $this->admin->id]);
    $owner->shops()->attach($shop);

    $this->deleteJson("/api/v1/admin/shop-owners/{$owner->id}")
        ->assertOk();

    $this->assertSoftDeleted('users', ['id' => $owner->id]);
    $this->assertDatabaseMissing('shop_user', ['user_id' => $owner->id]);
});

it('returns not found for users who are not shop owners', function () {
    $other = User::factory()->create();

    $this->getJson("/api/v1/admin/shop-owners/{$other->id}")
        ->assertStatus(404);
});

it('forbids shop owners from managing accounts', function () {
    Sanctum::actingAs(shopOwnerUser());

    $this->getJson('/api/v1/admin/shop-owners')->assertStatus(403);
});
