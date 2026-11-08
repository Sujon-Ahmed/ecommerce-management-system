# ShopSphere — Small E-commerce Management System

A multi-shop e-commerce management platform built for the CSN Bangladesh technical assessment.

Administrators manage shops, shop owners, and the global product catalog. Shop owners browse the shared catalog, add products to their shops, create new catalog products, and customize their own prices, descriptions, and thumbnails. Customers browse a shop-specific storefront that never exposes products not assigned to that shop.

> **Status:** Phase 3 (backend foundation, admin module, and shop-owner module) is implemented. The public storefront, React frontend, and full documentation follow in later phases.

## Repository layout

```
backend/     Laravel 12 REST API (PHP 8.3, MySQL 8)
frontend/    React + TypeScript + Vite application (added in Phase 5)
docs/        API documentation and Postman collection (added in Phase 7)
```

## Requirements

- PHP 8.3+ with `pdo_mysql`, `fileinfo`, `gd`, `zip`, `intl`, `mbstring`, `openssl`
- Composer 2
- MySQL 8
- Node.js 20+ and npm (frontend, Phase 5)

## Backend setup

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Create the database and configure `.env`:

```sql
CREATE DATABASE csn_ecommerce CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

```dotenv
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=csn_ecommerce
DB_USERNAME=root
DB_PASSWORD=
```

Run migrations, seed demo data, and expose uploaded images:

```bash
php artisan migrate --seed
php artisan storage:link
php artisan serve
```

The API is available at `http://localhost:8000/api/v1`.

## Demo credentials

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@example.com` | `Password@123!` |
| Shop owner (Dhaka + Chattogram) | `owner.dhaka@example.com` | `Password@123!` |
| Shop owner (Sylhet) | `owner.sylhet@example.com` | `Password@123!` |
| Shop owner (inactive shop demo) | `owner.barishal@example.com` | `Password@123!` |

## Tests

Backend tests run against an in-memory SQLite database:

```bash
cd backend
php artisan test
```

## API documentation

The full endpoint reference, payloads, and the Postman collection are added in Phase 7. Implemented so far:

**Authentication**

- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`
- `PUT /api/v1/auth/profile`
- `PUT /api/v1/auth/password`

**Admin** (`role:admin`)

- `/api/v1/admin/dashboard`
- `/api/v1/admin/shops`
- `/api/v1/admin/shop-owners`
- `/api/v1/admin/products`

**Shop owner** (`role:shop_owner`)

- `GET /api/v1/shop-owner/dashboard`
- `GET /api/v1/shop-owner/shop` (read-only settings)
- `GET /api/v1/shop-owner/catalog`
- `GET /api/v1/shop-owner/catalog/{product}`
- `POST /api/v1/shop-owner/catalog/{product}/assign`
- `GET /api/v1/shop-owner/products`
- `POST /api/v1/shop-owner/products` (creates a catalog product and assigns it)
- `PUT /api/v1/shop-owner/products/{product}` (shop-specific overrides only)
- `DELETE /api/v1/shop-owner/products/{product}` (unassign)

### Shop context

Shop-owner requests resolve the active shop automatically when the owner has exactly one assignment. Owners with multiple shops must send either:

```
X-Shop-Id: <shop id>
```

or `?shop_id=<shop id>`. Without a context the API returns `422 SHOP_CONTEXT_REQUIRED`; an unassigned shop returns `403 SHOP_NOT_ASSIGNED`, and an inactive shop returns `403 SHOP_INACTIVE`.
