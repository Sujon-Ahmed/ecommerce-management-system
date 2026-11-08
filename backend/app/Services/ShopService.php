<?php

namespace App\Services;

use App\Enums\ShopStatus;
use App\Models\Shop;
use App\Support\Slug;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

class ShopService
{
    public function __construct(private readonly ImageStorageService $images) {}

    public function create(array $data, ?UploadedFile $logo, int $createdBy): Shop
    {
        $slug = ! empty($data['slug'])
            ? Str::slug((string) $data['slug'])
            : Slug::unique((string) $data['name'], Shop::class);

        return Shop::create([
            'name' => $data['name'],
            'slug' => $slug,
            'description' => $data['description'] ?? null,
            'logo' => $logo ? $this->images->store($logo, 'shops') : null,
            'status' => $data['status'] ?? ShopStatus::Active->value,
            'created_by' => $createdBy,
        ]);
    }

    public function update(
        Shop $shop,
        array $data,
        ?UploadedFile $logo,
        bool $removeLogo = false
    ): Shop {
        $shop->fill([
            'name' => $data['name'] ?? $shop->name,
            'description' => array_key_exists('description', $data)
                ? $data['description']
                : $shop->description,
            'status' => $data['status'] ?? $shop->status,
        ]);

        if (! empty($data['slug'])) {
            $shop->slug = Str::slug((string) $data['slug']);
        }

        if ($logo !== null) {
            $shop->logo = $this->images->replace($shop->logo, $logo, 'shops');
        } elseif ($removeLogo) {
            $shop->logo = $this->images->remove($shop->logo);
        }

        $shop->save();

        return $shop;
    }

    public function delete(Shop $shop): void
    {
        $shop->delete();
    }
}
