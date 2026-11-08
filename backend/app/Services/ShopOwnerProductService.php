<?php

namespace App\Services;

use App\Enums\ShopProductStatus;
use App\Exceptions\BusinessRuleException;
use App\Models\Product;
use App\Models\Shop;
use App\Models\ShopProduct;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class ShopOwnerProductService
{
    public function __construct(
        private readonly ProductService $products,
        private readonly ImageStorageService $images,
    ) {}

    /**
     * Create a global catalog product and assign it to the shop in one step.
     */
    public function createForShop(
        Shop $shop,
        array $data,
        ?UploadedFile $globalThumbnail,
        ?UploadedFile $shopThumbnail,
        int $createdBy
    ): ShopProduct {
        return DB::transaction(function () use ($shop, $data, $globalThumbnail, $shopThumbnail, $createdBy) {
            $product = $this->products->create([
                'name' => $data['name'],
                'sku' => $data['sku'],
                'description' => $data['description'] ?? null,
                'category' => $data['category'] ?? null,
            ], $globalThumbnail, $createdBy);

            return $this->assign($shop, $product, $data, $shopThumbnail);
        });
    }

    /**
     * Assign an existing catalog product to a shop with shop-specific values.
     */
    public function assign(
        Shop $shop,
        Product $product,
        array $data,
        ?UploadedFile $shopThumbnail = null
    ): ShopProduct {
        if ($shop->shopProducts()->where('product_id', $product->id)->exists()) {
            throw new BusinessRuleException(
                'This product is already assigned to the shop.',
                'ALREADY_ASSIGNED'
            );
        }

        $listing = $shop->shopProducts()->create([
            'product_id' => $product->id,
            'price' => $data['price'],
            'description' => $data['shop_description'] ?? null,
            'thumbnail' => $shopThumbnail
                ? $this->images->store($shopThumbnail, "shop-products/{$shop->id}")
                : null,
            'stock' => $data['stock'] ?? 0,
            'status' => $data['shop_status'] ?? ShopProductStatus::Active->value,
        ]);

        return $listing->load('product');
    }

    public function update(
        ShopProduct $listing,
        array $data,
        ?UploadedFile $shopThumbnail,
        bool $removeThumbnail = false
    ): ShopProduct {
        $listing->fill([
            'price' => $data['price'] ?? $listing->price,
            'description' => array_key_exists('shop_description', $data)
                ? $data['shop_description']
                : $listing->description,
            'stock' => $data['stock'] ?? $listing->stock,
            'status' => $data['shop_status'] ?? $listing->status,
        ]);

        if ($shopThumbnail !== null) {
            $listing->thumbnail = $this->images->replace(
                $listing->thumbnail,
                $shopThumbnail,
                "shop-products/{$listing->shop_id}"
            );
        } elseif ($removeThumbnail) {
            $listing->thumbnail = $this->images->remove($listing->thumbnail);
        }

        $listing->save();

        return $listing->load('product');
    }

    public function unassign(ShopProduct $listing): void
    {
        $this->images->delete($listing->thumbnail);
        $listing->delete();
    }
}
