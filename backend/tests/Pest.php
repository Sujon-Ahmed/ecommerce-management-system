<?php

use App\Models\Product;
use App\Models\Shop;
use App\Models\ShopProduct;
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

/**
 * Create a product and assign it to the given shop.
 *
 * @param  array<string, mixed>  $productAttributes
 * @param  array<string, mixed>  $listingAttributes
 */
function createListing(Shop $shop, array $productAttributes = [], array $listingAttributes = []): ShopProduct
{
    $product = Product::factory()->create($productAttributes);

    $listing = ShopProduct::factory()->create(array_merge([
        'shop_id' => $shop->id,
        'product_id' => $product->id,
    ], $listingAttributes));

    return $listing->setRelation('product', $product);
}
