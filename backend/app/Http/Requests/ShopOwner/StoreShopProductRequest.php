<?php

namespace App\Http\Requests\ShopOwner;

use App\Enums\ShopProductStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class StoreShopProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('shop_owner') ?? false;
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('sku')) {
            $this->merge(['sku' => Str::upper(trim((string) $this->input('sku')))]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            // Global catalog fields (editable by admins only after creation).
            'name' => ['required', 'string', 'max:255'],
            'sku' => ['required', 'string', 'max:100', Rule::unique('products', 'sku')],
            'description' => ['nullable', 'string', 'max:5000'],
            'category' => ['nullable', 'string', 'max:100'],
            'thumbnail' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],

            // Shop-specific listing fields.
            'price' => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
            'stock' => ['sometimes', 'integer', 'min:0', 'max:1000000'],
            'shop_description' => ['nullable', 'string', 'max:5000'],
            'shop_thumbnail' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'shop_status' => ['sometimes', Rule::enum(ShopProductStatus::class)],
        ];
    }
}
