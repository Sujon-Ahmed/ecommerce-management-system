<?php

use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case & Database
|--------------------------------------------------------------------------
*/

uses(TestCase::class, RefreshDatabase::class)->in('Feature');

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function adminUser(array $attributes = []): User
{
    return User::factory()->create($attributes)->assignRole('admin');
}

function shopOwnerUser(array $attributes = []): User
{
    return User::factory()->create($attributes)->assignRole('shop_owner');
}

/**
 * @param  array<int, Shop>  $shops
 */
function ownerForShops(array $shops, array $attributes = []): User
{
    $owner = shopOwnerUser($attributes);
    $owner->shops()->attach(collect($shops)->pluck('id')->all());

    return $owner;
}
