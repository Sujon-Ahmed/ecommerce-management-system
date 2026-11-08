<?php

namespace App\Http\Requests\ShopOwner;

use App\Enums\ShopProductStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AssignProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('shop_owner') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'price' => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
            'stock' => ['sometimes', 'integer', 'min:0', 'max:1000000'],
            'shop_description' => ['nullable', 'string', 'max:5000'],
            'shop_thumbnail' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'shop_status' => ['sometimes', Rule::enum(ShopProductStatus::class)],
        ];
    }
}
