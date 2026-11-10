# ShopSphere API Reference

REST API for the ShopSphere multi-shop commerce platform. The API is versioned under `/api/v1` and returns JSON.

- **Base URL:** `http://localhost:8000/api/v1`
- **Authentication:** Laravel Sanctum bearer tokens
- **Content types:** `application/json` for JSON payloads, `multipart/form-data` for uploads
- **Postman collection:** [`postman/ShopSphere.postman_collection.json`](./postman/ShopSphere.postman_collection.json)
- **Postman environment:** [`postman/ShopSphere.postman_environment.json`](./postman/ShopSphere.postman_environment.json)

## Contents

- [Conventions](#conventions)
- [Authentication](#authentication)
- [Authorization](#authorization)
- [Shop context](#shop-context)
- [Uploads](#uploads)
- [Errors](#errors)
- [Endpoints](#endpoints)
  - [Auth](#auth)
  - [Storefront](#storefront)
  - [Admin](#admin)
  - [Shop owner](#shop-owner)
- [Quick start with cURL](#quick-start-with-curl)
- [Postman](#postman)

## Conventions

### Response envelope

Every successful response uses the same envelope:

```json
{
  "success": true,
  "message": "Shops retrieved successfully",
  "data": [],
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 15,
    "total": 0,
    "from": null,
    "to": null
  }
}
```

`data` may be an object, an array, or `null` (for deletes and logout). `meta` is included only on paginated endpoints.

### Pagination

Paginated endpoints accept:

| Parameter | Type | Default | Notes |
|---|---|---|---|
| `page` | integer | `1` | 1-based page number |
| `per_page` | integer | `15` | Maximum `100`, except storefront products (`48`) |

Pagination metadata keys are `current_page`, `last_page`, `per_page`, `total`, `from`, and `to`.

### Timestamps and money

- Timestamps are ISO-8601 strings or `null`.
- Prices are decimal strings in BDT (for example `"1299.00"`).

### HTTP status codes

| Code | Meaning |
|---|---|
| `200` | Request succeeded |
| `201` | Resource created |
| `401` | Missing, invalid, or revoked token; invalid credentials |
| `403` | Authenticated but not allowed, inactive account, inactive shop, or unassigned shop |
| `404` | Resource not found or not visible |
| `422` | Validation failed or shop context missing |
| `500` | Unexpected server error |

## Authentication

1. Send `POST /auth/login` with an email and password.
2. Store the returned `data.token`.
3. Send it on every protected request:

```http
Authorization: Bearer <token>
Accept: application/json
```

`POST /auth/logout` revokes the current token. Changing a password revokes every other token for that user.

### Login

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Password@123!"}'
```

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "1|Q0nH...",
    "token_type": "Bearer",
    "user": {
      "id": 1,
      "name": "System Administrator",
      "email": "admin@example.com",
      "phone": null,
      "is_active": true,
      "roles": ["admin"],
      "shops": [],
      "created_at": "2026-01-01T00:00:00+00:00",
      "updated_at": "2026-01-01T00:00:00+00:00"
    }
  }
}
```

Demo accounts use the password `Password@123!`:

| Role | Email |
|---|---|
| Administrator | `admin@example.com` |
| Shop owner, two shops | `owner.dhaka@example.com` |
| Shop owner, one shop | `owner.sylhet@example.com` |
| Shop owner, inactive shop | `owner.barishal@example.com` |

## Authorization

| Role | Access |
|---|---|
| `admin` | `/admin/*`; can manage shops, shop owners, and the shared catalog |
| `shop_owner` | `/shop-owner/*`; can only act on shops assigned to them |
| `customer` | Public storefront only (no protected endpoints in this assessment) |

Inactive accounts receive `403 ACCOUNT_INACTIVE` and are blocked by the `active` middleware even when holding a valid token.

Admin endpoints also enforce granular permissions (`shops.view`, `shops.create`, `shops.update`, `shops.delete`, `shop-owners.*`, `products.*`, `dashboard.view`). The seeded administrator has every permission.

## Shop context

Shop-owner routes are scoped to one shop per request.

1. If the owner has exactly one assigned shop, the API resolves it automatically.
2. If the owner has multiple shops, send either:

```http
X-Shop-Id: 2
```

or:

```http
GET /shop-owner/products?shop_id=2
```

3. If the context is missing, the API returns:

```json
{
  "success": false,
  "message": "Multiple shops are available. Provide a shop context using the X-Shop-Id header or shop_id query parameter.",
  "code": "SHOP_CONTEXT_REQUIRED"
}
```

| Code | Status | Meaning |
|---|---|---|
| `SHOP_CONTEXT_REQUIRED` | 422 | Owner has multiple shops and did not choose one |
| `SHOP_NOT_ASSIGNED` | 403 | Requested shop is not assigned to this owner |
| `SHOP_INACTIVE` | 403 | Selected shop is inactive |
| `NO_SHOP_ASSIGNED` | 403 | Owner has no shop at all |

All shop-owner endpoints, including reads, require an active selected shop.

## Uploads

Image fields expect `multipart/form-data` with files up to **2 MB** in `jpg`, `jpeg`, `png`, or `webp` format.

Use these field names:

| Context | Field | Remove flag |
|---|---|---|
| Shop logo | `logo` | `remove_logo` |
| Catalog thumbnail | `thumbnail` | `remove_thumbnail` |
| Shop listing thumbnail | `shop_thumbnail` | `remove_shop_thumbnail` |

Laravel cannot parse multipart bodies on `PUT`/`PATCH`. Send updates that include files as `POST` with a `_method=PUT` field. The frontend does this automatically.

## Errors

### Validation error (`422`)

```json
{
  "success": false,
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email field is required."],
    "password": ["The password field is required."]
  }
}
```

### Domain error

```json
{
  "success": false,
  "message": "The selected shop is not active.",
  "code": "SHOP_INACTIVE"
}
```

### Authentication error

```json
{
  "success": false,
  "message": "Unauthenticated.",
  "code": "UNAUTHENTICATED"
}
```

| Code | Meaning |
|---|---|
| `INVALID_CREDENTIALS` | Wrong email or password |
| `ACCOUNT_INACTIVE` | Account has been deactivated |
| `INVALID_CURRENT_PASSWORD` | Current password did not match |
| `PRODUCT_INACTIVE` | Product is not available in the catalog |
| `NOT_ASSIGNED` | Product is not assigned to the current shop |
| `SHOP_CONTEXT_REQUIRED` | Multiple shops and no selection |
| `SHOP_NOT_ASSIGNED` | Shop is not assigned to the owner |
| `SHOP_INACTIVE` | Selected shop is inactive |
| `NO_SHOP_ASSIGNED` | Owner has no shops |

## Endpoints

### Auth

#### `POST /auth/login`

Public. Body: `email`, `password`.

Returns `token`, `token_type`, and the authenticated `user`.

#### `GET /auth/me`

Protected. Returns the current user with `roles` and assigned `shops`.

#### `POST /auth/logout`

Protected. Revokes the current access token. Returns `data: null`.

#### `PUT /auth/profile`

Protected. Body:

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | no | Max 255 |
| `phone` | string \| null | no | Max 30 |

Returns the updated user.

#### `PUT /auth/password`

Protected. Body:

| Field | Type | Required | Notes |
|---|---|---|---|
| `current_password` | string | yes | Must match the current password |
| `password` | string | yes | Min 8, letters and numbers |
| `password_confirmation` | string | yes | Must match `password` |

Revokes all other tokens.

### Storefront

Public endpoints. They only expose active shops, active global products, and active shop listings.

#### `GET /storefront/shops`

Returns active shops with a `products_count` of visible products, ordered by name. No pagination.

```json
{
  "success": true,
  "message": "Active shops retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Dhaka Fashion House",
      "slug": "dhaka-fashion-house",
      "description": "Contemporary fashion from Dhaka.",
      "logo_url": "http://localhost:8000/storage/shops/logo.jpg",
      "products_count": 12,
      "created_at": "2026-01-01T00:00:00+00:00"
    }
  ]
}
```

#### `GET /storefront/shops/{shop-slug}`

Returns one active shop profile. Inactive, soft-deleted, or unknown shops return `404`.

#### `GET /storefront/shops/{shop-slug}/products`

Paginated visible listings for the shop.

| Query | Type | Notes |
|---|---|---|
| `search` | string | Matches product name, SKU, or category |
| `category` | string | Exact match |
| `min_price` | number | Inclusive minimum shop price |
| `max_price` | number | Inclusive maximum; must be `>= min_price` |
| `in_stock` | boolean | `true` = stock > 0, `false` = stock <= 0 |
| `sort` | string | `latest`, `price_asc`, `price_desc`, `name` |
| `page` | integer | Page number |
| `per_page` | integer | Max 48, default 12 |

```json
{
  "success": true,
  "message": "Shop products retrieved successfully",
  "data": [
    {
      "id": 5,
      "shop_product_id": 8,
      "name": "Cotton Panjabi",
      "slug": "cotton-panjabi",
      "sku": "PAN-001",
      "category": "Fashion",
      "price": "1890.00",
      "description": "Shop-specific description.",
      "thumbnail_url": "http://localhost:8000/storage/shop-products/panjabi.jpg",
      "stock": 14,
      "in_stock": true,
      "created_at": "2026-01-01T00:00:00+00:00"
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 12,
    "total": 1,
    "from": 1,
    "to": 1
  }
}
```

#### `GET /storefront/shops/{shop-slug}/products/{product-slug}`

Returns one visible listing with the same shape as a list item. Shop-specific price, description, and thumbnail are already applied. Returns `404` for inactive listings, inactive catalog products, inactive shops, or products not assigned to that shop.

### Admin

All admin endpoints require `role:admin`.

#### `GET /admin/dashboard`

Returns aggregate statistics and the five most recent shops and products.

```json
{
  "success": true,
  "message": "Dashboard statistics retrieved successfully",
  "data": {
    "stats": {
      "shops": { "total": 4, "active": 3, "inactive": 1 },
      "products": { "total": 20, "active": 18 },
      "shop_owners": 3,
      "assignments": 31
    },
    "recent_shops": [],
    "recent_products": []
  }
}
```

#### Shops

| Method | Path | Notes |
|---|---|---|
| `GET` | `/admin/shops` | Paginated |
| `POST` | `/admin/shops` | Multipart if uploading `logo` |
| `GET` | `/admin/shops/{id}` | Includes owners |
| `PUT/PATCH` | `/admin/shops/{id}` | Multipart with `_method=PUT` when uploading |
| `DELETE` | `/admin/shops/{id}` | Soft delete |
| `GET` | `/admin/shops/{id}/products` | Paginated shop listings |

List filters: `search` (name or slug), `status` (`active`/`inactive`), `page`, `per_page`.

Create body:

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | yes | Max 255 |
| `slug` | string | no | Auto-generated from the name when absent |
| `description` | string | no | Max 2000 |
| `logo` | file | no | Image, max 2 MB |
| `status` | string | no | `active` or `inactive`, default `active` |

Update accepts the same fields plus `remove_logo` (boolean). Deleting a shop removes its listings; owner accounts remain.

#### Shop owners

| Method | Path | Notes |
|---|---|---|
| `GET` | `/admin/shop-owners` | Paginated, includes assigned shops |
| `POST` | `/admin/shop-owners` | Creates an owner account |
| `GET` | `/admin/shop-owners/{id}` | Includes assigned shops |
| `PUT/PATCH` | `/admin/shop-owners/{id}` | Updates the owner |
| `DELETE` | `/admin/shop-owners/{id}` | Soft delete and detach shops |

List filters: `search` (name or email), `is_active` (boolean), `shop_id`, `page`, `per_page`.

Create body:

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | yes | Max 255 |
| `email` | string | yes | Unique |
| `password` | string | yes | Min 8, letters and numbers |
| `password_confirmation` | string | yes | Must match |
| `phone` | string | no | Max 30 |
| `is_active` | boolean | no | Default `true` |
| `shop_ids` | integer[] | no | Assigned shop IDs |

Update makes `password` optional. Supplying it requires `password_confirmation`. Deactivating an owner revokes their tokens.

#### Catalog products

| Method | Path | Notes |
|---|---|---|
| `GET` | `/admin/products` | Paginated |
| `POST` | `/admin/products` | Multipart if uploading `thumbnail` |
| `GET` | `/admin/products/{id}` | Includes all shop listings |
| `PUT/PATCH` | `/admin/products/{id}` | Multipart with `_method=PUT` when uploading |
| `DELETE` | `/admin/products/{id}` | Soft delete and remove assignments |

List filters: `search` (name, SKU, category), `category`, `is_active`, `created_by`, `page`, `per_page`.

Create body:

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | yes | Max 255 |
| `sku` | string | yes | Unique; uppercased automatically |
| `description` | string | no | Max 5000 |
| `category` | string | no | Max 100 |
| `thumbnail` | file | no | Image, max 2 MB |
| `is_active` | boolean | no | Default `true` |

Update accepts the same fields plus `remove_thumbnail` (boolean).

### Shop owner

All shop-owner endpoints require `role:shop_owner` and a resolved active shop (see [Shop context](#shop-context)).

#### `GET /shop-owner/dashboard`

Returns the selected shop and listing statistics.

```json
{
  "success": true,
  "message": "Shop dashboard retrieved successfully",
  "data": {
    "shop": { "id": 1, "name": "Dhaka Fashion House" },
    "stats": {
      "listings": {
        "total": 12,
        "active": 10,
        "inactive": 2,
        "in_stock": 9,
        "out_of_stock": 3
      },
      "catalog": { "available": 8 }
    }
  }
}
```

#### `GET /shop-owner/shop`

Returns the selected shop and its listing count. Shop profile fields are read-only for owners.

#### Catalog

| Method | Path | Notes |
|---|---|---|
| `GET` | `/shop-owner/catalog` | Active catalog products with `assigned` status for this shop |
| `GET` | `/shop-owner/catalog/{product-id}` | One active catalog product |
| `POST` | `/shop-owner/catalog/{product-id}/assign` | Creates a shop listing |

Catalog filters: `search` (name, SKU, category), `category`, `assigned` (boolean), `page`, `per_page`.

Assignment body (`multipart/form-data`):

| Field | Type | Required | Notes |
|---|---|---|---|
| `price` | number | yes | 0 to 9,999,999,999.99 |
| `stock` | integer | no | 0 or more, default 0 |
| `shop_description` | string | no | Max 5000 |
| `shop_thumbnail` | file | no | Overrides the catalog image |
| `shop_status` | string | no | `active` or `inactive`, default `active` |

Assigning an inactive product returns `422 PRODUCT_INACTIVE`. Assigning the same product twice is rejected.

#### Listings

| Method | Path | Notes |
|---|---|---|
| `GET` | `/shop-owner/products` | Paginated listings for the selected shop |
| `POST` | `/shop-owner/products` | Creates a catalog product **and** assigns it |
| `PUT/PATCH` | `/shop-owner/products/{product-id}` | Updates shop-specific overrides only |
| `DELETE` | `/shop-owner/products/{product-id}` | Unassigns the product; does not delete the catalog product |

List filters: `search` (name or SKU), `status` (`active`/`inactive`), `page`, `per_page`.

Create body (`multipart/form-data`):

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | yes | Catalog product name |
| `sku` | string | yes | Unique; uppercased automatically |
| `description` | string | no | Catalog description |
| `category` | string | no | Catalog category |
| `thumbnail` | file | no | Catalog image |
| `price` | number | yes | Shop price |
| `stock` | integer | no | Shop stock |
| `shop_description` | string | no | Shop override |
| `shop_thumbnail` | file | no | Shop override image |
| `shop_status` | string | no | `active` or `inactive` |

Update body (`multipart/form-data` with `_method=PUT` when uploading):

| Field | Type | Required | Notes |
|---|---|---|---|
| `price` | number | no | Shop price |
| `stock` | integer | no | Shop stock |
| `shop_description` | string | no | Shop override |
| `shop_thumbnail` | file | no | Shop override image |
| `remove_shop_thumbnail` | boolean | no | Fall back to the catalog image |
| `shop_status` | string | no | `active` or `inactive` |

Owners cannot change global catalog fields on update. Updating a product that is not assigned to the selected shop returns `404 NOT_ASSIGNED`.

## Quick start with cURL

```bash
BASE=http://localhost:8000/api/v1

# 1. Sign in as an administrator
TOKEN=$(curl -s -X POST "$BASE/auth/login" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Password@123!"}' \
  | python -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

# 2. List shops
curl "$BASE/admin/shops?per_page=10" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN"

# 3. Browse the public storefront
curl "$BASE/storefront/shops"
curl "$BASE/storefront/shops/dhaka-fashion-house/products?sort=price_asc"

# 4. Sign in as a shop owner with two shops and pick the first
OWNER=$(curl -s -X POST "$BASE/auth/login" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"email":"owner.dhaka@example.com","password":"Password@123!"}')

OWNER_TOKEN=$(echo "$OWNER" | python -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")
SHOP_ID=$(echo "$OWNER" | python -c "import sys,json; print(json.load(sys.stdin)['data']['user']['shops'][0]['id'])")

# 5. Read the selected shop dashboard
curl "$BASE/shop-owner/dashboard" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -H "X-Shop-Id: $SHOP_ID"
```

On Windows PowerShell, use `curl.exe` and `Invoke-RestMethod`, or run the commands through Git Bash/WSL.

## Postman

Import both files from [`docs/postman`](./postman):

1. `ShopSphere.postman_environment.json`
2. `ShopSphere.postman_collection.json`

Select the **ShopSphere Local** environment, then run the folders in this order: **Auth → Storefront → Admin → Shop owner**. The optional **Cleanup** folder revokes the captured tokens.

The login scripts store `adminToken`, `ownerToken`, `ownerShopId`, and `ownerShopSlug` automatically. Later scripts capture `shopSlug`, `productSlug`, `catalogProductId`, and the ids of resources they create. Requests that support image uploads use `multipart/form-data`; their file fields are disabled until you select an image.

The collection requests use:

- `{{baseUrl}}` — API root, default `http://localhost:8000/api/v1`
- `{{adminToken}}` — captured from the admin login
- `{{ownerToken}}` — captured from the shop-owner login
- `{{ownerShopId}}` — the owner's first assigned shop, sent as `X-Shop-Id`
- `{{ownerShopSlug}}`, `{{shopSlug}}`, `{{productSlug}}` — storefront navigation
- `{{catalogProductId}}` — an unassigned catalog product chosen for the assignment request
- `{{createdShopId}}`, `{{createdOwnerId}}`, `{{createdProductId}}`, `{{createdListingProductId}}` — QA resources created and removed during the run

To run the collection from a terminal with the Postman CLI:

```bash
postman collection run docs/postman/ShopSphere.postman_collection.json -e docs/postman/ShopSphere.postman_environment.json
```
