<?php

namespace App\Http\Requests\ShopOwner;

use Illuminate\Foundation\Http\FormRequest;

class ListCatalogProductsRequest extends FormRequest
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
            'search' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:100'],
            'assigned' => ['nullable', 'boolean'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
