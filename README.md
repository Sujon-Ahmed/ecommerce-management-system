# ShopSphere — Small E-commerce Management System

A multi-shop e-commerce management platform built for the CSN Bangladesh technical assessment.

Administrators manage shops, shop owners, and the global product catalog. Shop owners browse the shared catalog, add products to their shops, create new catalog products, and customize their own prices, descriptions, and thumbnails. Customers browse a shop-specific storefront that never exposes products not assigned to that shop.

> **Status:** All phases are complete — Laravel REST API, React frontend, and API documentation with a runnable Postman collection.

## Repository layout

```
backend/     Laravel 12 REST API (PHP 8.3, MySQL 8)
frontend/    React 19 + TypeScript + Vite client
docs/        API reference and Postman collection/environment
```

## Requirements

- PHP 8.3+ with `pdo_mysql`, `fileinfo`, `gd`, `zip`, `intl`, `mbstring`, `openssl`
- Composer 2
- MySQL 8
- Node.js 20+ and npm

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

## Frontend setup

Start the backend first, then install and run the React client:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The app runs at `http://localhost:5173`. It reads the API root from `VITE_API_BASE_URL`:

```dotenv
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

Shop owners with more than one shop choose a shop in the UI. The selection is stored per user in `localStorage` and sent as `X-Shop-Id` on every shop-owner request. Uploaded images are served from the backend's `/storage` URL.

Frontend commands:

```bash
npm run dev        # Vite dev server
npm run build      # Type-check and build for production
npm run preview    # Preview the production build
npm run lint       # Oxlint
npm run typecheck  # tsc project build, no emit
npm test           # Vitest in watch mode
npm run test:run   # Vitest once (CI)
```

See [`frontend/README.md`](frontend/README.md) for the client architecture and conventions.

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

Frontend checks:

```bash
cd frontend
npm run typecheck
npm run lint
npm run test:run
npm run build
```

## API documentation

The full endpoint reference is in [`docs/API.md`](docs/API.md). It covers the response envelope, authentication, roles, shop context, uploads, error codes, request bodies, and cURL examples.

**Endpoint groups**

| Group | Prefix | Authentication |
|---|---|---|
| Authentication | `/api/v1/auth` | Login is public; other routes need a bearer token |
| Storefront | `/api/v1/storefront` | Public |
| Admin | `/api/v1/admin` | `role:admin` |
| Shop owner | `/api/v1/shop-owner` | `role:shop_owner` plus an active shop context |

The storefront exposes active shops and only products that are active in the global catalog **and** actively assigned to the requested shop. List filters: `search`, `category`, `min_price`, `max_price`, `in_stock`; sorting: `latest`, `price_asc`, `price_desc`, `name`.

Shop-owner routes are scoped to one shop per request. The API resolves the shop automatically when the owner has exactly one assignment. Owners with multiple shops send either:

```http
X-Shop-Id: <shop id>
```

or `?shop_id=<shop id>`. Without a context the API returns `422 SHOP_CONTEXT_REQUIRED`; an unassigned shop returns `403 SHOP_NOT_ASSIGNED`, an inactive shop returns `403 SHOP_INACTIVE`, and an owner with no shops returns `403 NO_SHOP_ASSIGNED`.

## Postman collection

Import both files from [`docs/postman`](docs/postman):

1. [`ShopSphere.postman_environment.json`](docs/postman/ShopSphere.postman_environment.json)
2. [`ShopSphere.postman_collection.json`](docs/postman/ShopSphere.postman_collection.json)

Select the **ShopSphere Local** environment, then run the folders in this order: **Auth → Storefront → Admin → Shop owner**. The login scripts capture `adminToken`, `ownerToken`, `ownerShopId`, and `ownerShopSlug`; later requests capture the ids of resources they create. The optional **Cleanup** folder revokes the captured tokens.

Requests that support image uploads use `multipart/form-data` with the file field disabled. Enable the field and choose a jpg, jpeg, png, or webp image (max 2 MB) to exercise an upload.

From a terminal with the Postman CLI installed:

```bash
postman collection run docs/postman/ShopSphere.postman_collection.json -e docs/postman/ShopSphere.postman_environment.json
```
