<?php

namespace App\Http\Controllers\Api\V1\ShopOwner;

use App\Http\Controllers\Controller;
use App\Models\Shop;
use Illuminate\Http\Request;

abstract class ShopOwnerController extends Controller
{
    protected function shop(Request $request): Shop
    {
        /** @var Shop|null $shop */
        $shop = $request->attributes->get('shop_context');

        abort_if($shop === null, 500, 'Shop context was not resolved.');

        return $shop;
    }
}
