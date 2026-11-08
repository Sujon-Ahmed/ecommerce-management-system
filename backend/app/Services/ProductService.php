<?php

namespace App\Services;

use App\Models\Product;
use App\Support\Slug;
use Illuminate\Http\UploadedFile;

class ProductService
{
    public function __construct(private readonly ImageStorageService $images) {}

    public function create(array $data, ?UploadedFile $thumbnail, int $createdBy): Product
    {
        return Product::create([
            'name' => $data['name'],
            'slug' => Slug::unique((string) $data['name'], Product::class),
            'sku' => $data['sku'],
            'description' => $data['description'] ?? null,
            'category' => $data['category'] ?? null,
            'thumbnail' => $thumbnail ? $this->images->store($thumbnail, 'products') : null,
            'is_active' => $data['is_active'] ?? true,
            'created_by' => $createdBy,
        ]);
    }

    public function update(
        Product $product,
        array $data,
        ?UploadedFile $thumbnail,
        bool $removeThumbnail = false
    ): Product {
        $product->fill([
            'name' => $data['name'] ?? $product->name,
            'sku' => $data['sku'] ?? $product->sku,
            'description' => array_key_exists('description', $data)
                ? $data['description']
                : $product->description,
            'category' => array_key_exists('category', $data)
                ? $data['category']
                : $product->category,
            'is_active' => $data['is_active'] ?? $product->is_active,
        ]);

        if ($thumbnail !== null) {
            $product->thumbnail = $this->images->replace($product->thumbnail, $thumbnail, 'products');
        } elseif ($removeThumbnail) {
            $product->thumbnail = $this->images->remove($product->thumbnail);
        }

        $product->save();

        return $product;
    }

    public function delete(Product $product): void
    {
        $product->delete();
    }
}
