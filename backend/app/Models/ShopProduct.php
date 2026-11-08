<?php

namespace App\Models;

use App\Enums\ShopProductStatus;
use Database\Factories\ShopProductFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class ShopProduct extends Model
{
    /** @use HasFactory<ShopProductFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'shop_id',
        'product_id',
        'price',
        'description',
        'thumbnail',
        'stock',
        'status',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'stock' => 'integer',
            'status' => ShopProductStatus::class,
        ];
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function scopeActive(Builder $query): void
    {
        $query->where('status', ShopProductStatus::Active->value);
    }

    protected function thumbnailUrl(): Attribute
    {
        return Attribute::get(
            fn (): ?string => $this->thumbnail ? Storage::disk('public')->url($this->thumbnail) : null
        );
    }

    protected function effectiveThumbnailUrl(): Attribute
    {
        return Attribute::get(function (): ?string {
            if ($this->thumbnail) {
                return Storage::disk('public')->url($this->thumbnail);
            }

            return $this->product?->thumbnail_url;
        });
    }

    protected function inStock(): Attribute
    {
        return Attribute::get(fn (): bool => $this->stock > 0);
    }
}
