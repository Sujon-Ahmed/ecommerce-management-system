<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ShopOwnerService
{
    public function create(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => Str::lower(trim((string) $data['email'])),
                'password' => $data['password'],
                'phone' => $data['phone'] ?? null,
                'is_active' => $data['is_active'] ?? true,
            ]);

            $user->assignRole('shop_owner');
            $user->shops()->sync($data['shop_ids'] ?? []);

            return $user->load('roles', 'shops')->loadCount('shops');
        });
    }

    public function update(User $user, array $data): User
    {
        return DB::transaction(function () use ($user, $data) {
            $revokeTokens = false;

            $user->name = $data['name'] ?? $user->name;
            $user->email = isset($data['email'])
                ? Str::lower(trim((string) $data['email']))
                : $user->email;
            $user->phone = array_key_exists('phone', $data) ? $data['phone'] : $user->phone;

            if (! empty($data['password'])) {
                $user->password = $data['password'];
                $revokeTokens = true;
            }

            if (array_key_exists('is_active', $data)) {
                $user->is_active = (bool) $data['is_active'];

                if (! $user->is_active) {
                    $revokeTokens = true;
                }
            }

            $user->save();

            if (array_key_exists('shop_ids', $data)) {
                $user->shops()->sync($data['shop_ids'] ?? []);
            }

            if ($revokeTokens) {
                $user->tokens()->delete();
            }

            return $user->load('roles', 'shops')->loadCount('shops');
        });
    }

    public function delete(User $user): void
    {
        DB::transaction(function () use ($user) {
            $user->tokens()->delete();
            $user->shops()->detach();
            $user->delete();
        });
    }
}
