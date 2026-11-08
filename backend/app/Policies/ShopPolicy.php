<?php

namespace App\Policies;

use App\Models\Shop;
use App\Models\User;

class ShopPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole('admin');
    }

    public function view(User $user, Shop $shop): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return $user->hasRole('shop_owner')
            && $user->shops()->whereKey($shop->id)->exists();
    }

    public function create(User $user): bool
    {
        return $user->hasRole('admin');
    }

    public function update(User $user, Shop $shop): bool
    {
        return $user->hasRole('admin');
    }

    public function delete(User $user, Shop $shop): bool
    {
        return $user->hasRole('admin');
    }
}
