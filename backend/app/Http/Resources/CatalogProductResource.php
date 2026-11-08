<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CatalogProductResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $listings = $this->relationLoaded('shopProducts')
            ? $this->shopProducts
            : collect();

        $listing = $listings->first();

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'sku' => $this->sku,
            'description' => $this->description,
            'category' => $this->category,
            'thumbnail_url' => $this->thumbnail_url,
            'is_active' => $this->is_active,
            'assigned' => $listing !== null,
            'shop_product_id' => $listing?->id,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
