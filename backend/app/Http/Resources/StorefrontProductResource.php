<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StorefrontProductResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $product = $this->product;

        return [
            'id' => $product?->id,
            'shop_product_id' => $this->id,
            'name' => $product?->name,
            'slug' => $product?->slug,
            'sku' => $product?->sku,
            'category' => $product?->category,
            'price' => (string) $this->price,
            'description' => $this->effective_description,
            'thumbnail_url' => $this->effective_thumbnail_url,
            'stock' => $this->stock,
            'in_stock' => $this->in_stock,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
