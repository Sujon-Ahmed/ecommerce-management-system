<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'sku' => $this->sku,
            'description' => $this->description,
            'category' => $this->category,
            'thumbnail_url' => $this->thumbnail_url,
            'is_active' => $this->is_active,
            'created_by' => $this->whenLoaded('creator', fn () => new UserResource($this->creator)),
            'shops_count' => $this->whenCounted('shops'),
            'shop_products_count' => $this->whenCounted('shopProducts'),
            'shop_products' => ShopProductResource::collection($this->whenLoaded('shopProducts')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
