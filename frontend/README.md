# ShopSphere Frontend

React 19 + TypeScript + Vite client for the ShopSphere multi-shop commerce platform.

## Features

- **Public storefront** — browse active shops, filter and sort a shop's listings, and open shop-specific product details.
- **Authentication** — token-based sign in against the Laravel Sanctum API, route guards by role, and automatic sign-out on `401`.
- **Admin console** — dashboard statistics, shop CRUD (with logo upload), shop-owner CRUD and shop assignments, catalog product CRUD, and per-shop listing inspection.
- **Shop-owner console** — dashboard, read-only shop settings, shared catalog browsing, product assignment, and shop-scoped listing management with price, stock, description, status, and thumbnail overrides.
- **Account settings** — profile and password updates.

Shop-owner requests automatically include the selected shop as an `X-Shop-Id` header. When an owner has several shops, the selection is kept per user in `localStorage`; the first active shop is the default.

## Stack

| Concern | Choice |
|---|---|
| Build | Vite 8, TypeScript 7 (strict) |
| UI | Tailwind CSS 4, Radix primitives, shadcn-style components |
| Data | TanStack Query 5, Axios |
| Forms | React Hook Form, Zod, `@hookform/resolvers` |
| Routing | React Router 7 |
| Notifications | Sonner |
| Tests | Vitest, Testing Library, jsdom |

## Getting started

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The app runs at `http://localhost:5173` and calls the API at `VITE_API_BASE_URL`:

```dotenv
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

Start the backend first (`cd backend && php artisan serve`) and make sure CORS allows the frontend origin. Uploaded images are served from the backend's `/storage` URL.

## Scripts

```bash
npm run dev        # Vite dev server
npm run build      # Type-check and build for production
npm run preview    # Preview the production build
npm run lint       # Oxlint
npm run typecheck  # tsc project build, no emit
npm test           # Vitest in watch mode
npm run test:run   # Vitest once (CI)
```

## Project structure

```
src/
  components/      shared UI, form fields, states, dialogs
  features/
    account/       profile and password forms
    admin/         admin dashboard, shops, owners, catalog
    auth/          auth context, login, guards helpers
    shop-owner/    shop context, dashboard, catalog, listings
    storefront/    public shop and product pages
  hooks/           reusable hooks
  layouts/         authenticated shell and storefront shell
  lib/             API client, errors, formatting, helpers
  routes/          guards and error pages
  test/            Vitest setup
  types/           API envelope and domain models
```

## API conventions

Responses use the Laravel envelope:

```json
{ "success": true, "message": "…", "data": { }, "meta": { } }
```

List endpoints return pagination metadata (`current_page`, `last_page`, `per_page`, `total`, `from`, `to`) in `meta`.

Validation failures return `422` with `errors` keyed by field name; these are mapped onto the matching React Hook Form fields. Domain failures include stable codes such as `SHOP_CONTEXT_REQUIRED`, `SHOP_NOT_ASSIGNED`, `SHOP_INACTIVE`, and `NO_SHOP_ASSIGNED`.

Multipart updates are sent as `POST` with `_method=PUT` because Laravel cannot parse multipart bodies on `PUT`/`PATCH`.

## Demo accounts

Password for all demo accounts: `Password@123!`.

| Role | Email |
|---|---|
| Administrator | `admin@example.com` |
| Shop owner (Dhaka + Chattogram) | `owner.dhaka@example.com` |
| Shop owner (Sylhet) | `owner.sylhet@example.com` |
| Shop owner (inactive shop demo) | `owner.barishal@example.com` |

See the root [`README.md`](../README.md) for backend setup and [`docs/API.md`](../docs/API.md) for the full endpoint reference.
