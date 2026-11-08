<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ShopProductResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'shop_id' => $this->shop_id,
            'product_id' => $this->product_id,
            'product' => $this->whenLoaded('product', fn () => new ProductResource($this->product)),
            'shop' => $this->whenLoaded('shop', fn () => new ShopResource($this->shop)),
            'price' => (string) $this->price,
            'description' => $this->description,
            'thumbnail_url' => $this->thumbnail_url,
            'effective_thumbnail_url' => $this->effective_thumbnail_url,
            'stock' => $this->stock,
            'in_stock' => $this->in_stock,
            'status' => $this->status->value,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
