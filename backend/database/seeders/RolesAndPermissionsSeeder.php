<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * @var list<string>
     */
    private array $permissions = [
        'dashboard.view',
        'shops.view',
        'shops.create',
        'shops.update',
        'shops.delete',
        'shop-owners.view',
        'shop-owners.create',
        'shop-owners.update',
        'shop-owners.delete',
        'products.view',
        'products.create',
        'products.update',
        'products.delete',
        'catalog.view',
        'shop-products.view',
        'shop-products.assign',
        'shop-products.update',
        'shop-products.delete',
        'storefront.view',
    ];

    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach ($this->permissions as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        $admin = Role::findOrCreate('admin', 'web');
        $admin->syncPermissions($this->permissions);

        $shopOwner = Role::findOrCreate('shop_owner', 'web');
        $shopOwner->syncPermissions([
            'dashboard.view',
            'shops.view',
            'products.view',
            'products.create',
            'catalog.view',
            'shop-products.view',
            'shop-products.assign',
            'shop-products.update',
            'shop-products.delete',
        ]);

        $customer = Role::findOrCreate('customer', 'web');
        $customer->syncPermissions(['storefront.view']);

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
