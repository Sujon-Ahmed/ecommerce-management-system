<?php

use App\Models\Product;
use App\Models\Shop;
use App\Models\ShopProduct;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->shop = Shop::factory()->create(['slug' => 'test-shop']);
    $this->otherShop = Shop::factory()->create(['slug' => 'other-shop']);
});

it('exposes only products actively assigned to the requested shop', function () {
    $visible = createListing($this->shop, ['name' => 'Visible Product']);
    createListing($this->shop, ['name' => 'Inactive Global', 'is_active' => false]);
    createListing($this->shop, ['name' => 'Inactive Listing'], ['status' => 'inactive']);
    createListing($this->otherShop, ['name' => 'Other Shop Product']);

    $response = $this->getJson('/api/v1/storefront/shops/test-shop/products');

    $response
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $visible->product_id)
        ->assertJsonPath('data.0.name', 'Visible Product');
});

it('hides soft-deleted products assignment rows remain', function () {
    $listing = createListing($this->shop);
    $listing->product->delete();

    $this->getJson('/api/v1/storefront/shops/test-shop/products')
        ->assertOk()
        ->assertJsonCount(0, 'data');

    $this->getJson('/api/v1/storefront/shops/test-shop/products/'.$listing->product->slug)
        ->assertStatus(404);
});

it('returns shop-specific price, description and thumbnail with fallbacks', function () {
    $product = Product::factory()->create([
        'name' => 'Wireless Earbuds',
        'slug' => 'wireless-earbuds',
        'description' => 'Global description.',
        'thumbnail' => 'products/earbuds.png',
    ]);
    $listing = ShopProduct::factory()->create([
        'shop_id' => $this->shop->id,
        'product_id' => $product->id,
        'price' => 2490.50,
        'description' => 'Shop description.',
        'thumbnail' => 'shop-products/1/earbuds.png',
        'stock' => 4,
    ]);

    $this->getJson('/api/v1/storefront/shops/test-shop/products/wireless-earbuds')
        ->assertOk()
        ->assertJsonPath('data.id', $product->id)
        ->assertJsonPath('data.shop_product_id', $listing->id)
        ->assertJsonPath('data.price', '2490.50')
        ->assertJsonPath('data.description', 'Shop description.')
        ->assertJsonPath('data.stock', 4)
        ->assertJsonPath('data.in_stock', true)
        ->assertJsonPath('data.thumbnail_url', Storage::disk('public')->url('shop-products/1/earbuds.png'));

    $listing->update(['description' => null, 'thumbnail' => null]);

    $this->getJson('/api/v1/storefront/shops/test-shop/products/wireless-earbuds')
        ->assertOk()
        ->assertJsonPath('data.description', 'Global description.')
        ->assertJsonPath('data.thumbnail_url', Storage::disk('public')->url('products/earbuds.png'));
});

it('filters by search, category, price and stock', function () {
    createListing($this->shop, ['name' => 'Wireless Earbuds', 'category' => 'Electronics'], ['price' => 2500, 'stock' => 5]);
    createListing($this->shop, ['name' => 'Cotton Panjabi', 'category' => 'Fashion'], ['price' => 1800, 'stock' => 0]);
    createListing($this->shop, ['name' => 'Smart Bulb', 'category' => 'Home'], ['price' => 450, 'stock' => 9]);

    $this->getJson('/api/v1/storefront/shops/test-shop/products?search=Earbuds')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Wireless Earbuds');

    $this->getJson('/api/v1/storefront/shops/test-shop/products?category=Fashion')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Cotton Panjabi');

    $this->getJson('/api/v1/storefront/shops/test-shop/products?min_price=1000&max_price=2000')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Cotton Panjabi');

    $this->getJson('/api/v1/storefront/shops/test-shop/products?in_stock=0')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Cotton Panjabi');

    $this->getJson('/api/v1/storefront/shops/test-shop/products?in_stock=1')
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

it('sorts by price and name', function () {
    createListing($this->shop, ['name' => 'Bravo'], ['price' => 200]);
    createListing($this->shop, ['name' => 'Alpha'], ['price' => 100]);
    createListing($this->shop, ['name' => 'Charlie'], ['price' => 300]);

    $asc = $this->getJson('/api/v1/storefront/shops/test-shop/products?sort=price_asc');
    expect(array_column($asc->json('data'), 'price'))->toBe(['100.00', '200.00', '300.00']);

    $desc = $this->getJson('/api/v1/storefront/shops/test-shop/products?sort=price_desc');
    expect(array_column($desc->json('data'), 'price'))->toBe(['300.00', '200.00', '100.00']);

    $byName = $this->getJson('/api/v1/storefront/shops/test-shop/products?sort=name');
    expect(array_column($byName->json('data'), 'name'))->toBe(['Alpha', 'Bravo', 'Charlie']);
});

it('paginates storefront products', function () {
    createListing($this->shop);
    createListing($this->shop);
    createListing($this->shop);

    $this->getJson('/api/v1/storefront/shops/test-shop/products?per_page=2')
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('meta.total', 3)
        ->assertJsonPath('meta.per_page', 2)
        ->assertJsonPath('meta.last_page', 2);
});

it('returns 404 for products assigned to another shop', function () {
    $listing = createListing($this->otherShop);

    $this->getJson('/api/v1/storefront/shops/test-shop/products/'.$listing->product->slug)
        ->assertStatus(404);
});

it('returns 404 for inactive listings and inactive global products', function () {
    $inactiveListing = createListing($this->shop, [], ['status' => 'inactive']);
    $inactiveProduct = createListing($this->shop, ['is_active' => false]);

    $this->getJson('/api/v1/storefront/shops/test-shop/products/'.$inactiveListing->product->slug)
        ->assertStatus(404);
    $this->getJson('/api/v1/storefront/shops/test-shop/products/'.$inactiveProduct->product->slug)
        ->assertStatus(404);
});

it('hides products of inactive shops', function () {
    $inactive = Shop::factory()->inactive()->create(['slug' => 'closed-shop']);
    $listing = createListing($inactive);

    $this->getJson('/api/v1/storefront/shops/closed-shop/products')->assertStatus(404);
    $this->getJson('/api/v1/storefront/shops/closed-shop/products/'.$listing->product->slug)->assertStatus(404);
});

it('validates storefront filters', function () {
    $this->getJson('/api/v1/storefront/shops/test-shop/products?sort=unknown')
        ->assertStatus(422)
        ->assertJsonValidationErrors(['sort']);

    $this->getJson('/api/v1/storefront/shops/test-shop/products?min_price=500&max_price=100')
        ->assertStatus(422)
        ->assertJsonValidationErrors(['max_price']);
});
