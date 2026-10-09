# Restaurant POS — *working title*

A free, open-source, self-hostable point-of-sale and management system for
**any** restaurant, café, or eatery. Mobile-first (customers order from phones;
staff run the floor from tablets/phones), India GST compliant, and white-label
ready.

> **Status: pre-alpha · in development · name not decided.**
> Nothing here is released yet. Features work end-to-end and CI is green, but
> some areas are stubbed and hardware/manual checks are pending. The product name
> is **undecided** — "Restaurant POS" and the older "Cafe Management System" are
> placeholders. See [`docs/STATUS.md`](docs/STATUS.md) for exactly what remains.

## What it does

- **Customer storefront** — browse the menu, search, favourites, one-tap add,
  real modifiers/sizes, cart, checkout, **order history + reorder**, and
  table/QR ordering (`?table=N`). Identity is a phone number (no password).
- **Waiter / counter POS** (`/admin/order`) — build an order against a table or
  takeaway, take cash / UPI-manual / card-manual payment.
- **Kitchen display (KDS)** — tickets in New / Preparing / Ready columns, age
  colours, keyboard bump, audible alert on new orders.
- **Admin** — dashboard + revenue + analytics (real SQL), menu CRUD (image
  upload), inventory with **recipes/BOM**, customers with derived summaries and
  loyalty, staff, GST invoices, per-action **activity log**, and tenant management.
- **GST invoicing** — Rule 46 tax invoice with FY-wise numbering, CGST/SGST/IGST,
  HSN/SAC summary, amount in words, and a frozen `brand_snapshot`. Export as
  **PDF (A4 / A5 / 80mm / 58mm)**, print-ready HTML, or optional raw ESC/POS.
- **Realtime & offline** — Socket.IO pushes order/stock/invoice/activity events;
  orders placed offline are queued in an outbox and replayed idempotently.
- **White-label** — brand name, title, logo, colours, favicon, manifest, and
  emails are driven at runtime from tenant settings. Change the brand without
  touching code or rewriting past invoices.
- **Multi-tenant** — resolve a tenant from the request host/subdomain
  (`cafe1.example.com`); a platform admin manages tenants.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, **Vite 8**, MUI v5 (Material-3 flavoured), React Router v6 |
| Backend | Express 4, **Knex 3 + PostgreSQL** (Neon or any Postgres) |
| Auth | JWT (staff / admin), tenant-scoped |
| Realtime | Socket.IO (`/ops` namespace, JWT handshake) |
| Media | Cloudinary (default) or local disk (`STORAGE_DRIVER`) |
| Invoices | GST Rule 46, PDF via **pdfkit**, HTML print, optional ESC/POS |
| Tests | Vitest (backend + frontend) · GitHub Actions CI |

> There is **no ORM lock-in** and no paid-service hard dependency — the app boots
> with only `DATABASE_URL` + `JWT_SECRET`. Cloudinary and SMTP are optional.

## Quick start

### 1. Database

```bash
# Local Postgres via Docker (port 5433)
docker compose up -d postgres
# …or point DATABASE_URL at Neon / any Postgres in server/.env
```

### 2. Backend (`server/`)

```bash
cd server
npm install
cp .env.example .env          # set DATABASE_URL + JWT_SECRET
npm run db:migrate && npm run db:seed
npm start
# API:   http://localhost:4969/api/v1
# Docs:  http://localhost:4969/api/v1/docs
# Health:http://localhost:4969/health
```

### 3. Frontend (`cafe-management-sys/`)

```bash
cd cafe-management-sys
npm install
cp .env.example .env          # VITE_API_URL=http://localhost:4969/api/v1
npm start
# http://localhost:3000
```

Full deployment, Docker Compose, reverse-proxy and backup notes:
[`docs/self-host.md`](docs/self-host.md).

## Demo tenants (after seed)

| Slug | Admin email | Password |
|---|---|---|
| `cafe1` | `admin@cafe1.local` | `Admin123!` |
| `cafe2` | `admin@cafe2.local` | `Admin123!` |

These are **demo credentials** — change them immediately. Subdomain routing:
`cafe1.localhost:3000` (browser) → API `cafe1.localhost:4969`; bare `localhost`
falls back to `DEFAULT_TENANT_SLUG`.

## Documentation

| Doc | What's in it |
|---|---|
| [`docs/STATUS.md`](docs/STATUS.md) | Live remaining work, known gaps, name/status |
| [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) | Full plan + deviation log (historical) |
| [`docs/self-host.md`](docs/self-host.md) | Deploy the API + frontend |
| [`docs/database.md`](docs/database.md) | Knex schema, migrations, Neon |
| [`docs/ui-patterns.md`](docs/ui-patterns.md) | Primitives, theming, frontend rules |
| [`docs/testing.md`](docs/testing.md) | Test strategy and CI |
| [`docs/print-matrix.md`](docs/print-matrix.md) | Printer compatibility checklist |
| [`docs/lighthouse.md`](docs/lighthouse.md) | Perf/a11y budgets + baseline |
| [`docs/secrets-rotation.md`](docs/secrets-rotation.md) | Rotate + purge leaked secrets |
| [`AGENTS.md`](AGENTS.md) | Codebase orientation for contributors/agents |

## API (v1)

All product endpoints live under **`/api/v1`**; infra endpoints are unversioned
(`/health`, `/metrics`, `/api`). Highlights:

- **Auth**: `POST /auth/login`, `POST /auth/register/staff`
- **Public menu/settings**: `GET /menu`, `GET /settings/public`
- **Orders**: `POST /orders` (public, tenant-scoped), `GET /orders/history?phone=`,
  `GET /orders`, `PUT /orders/:id/status`, `PUT /orders/:id/assign`
- **Invoices**: `POST /orders/:id/invoice`, `GET /invoices`, `GET /invoices/:id/print`,
  `GET /invoices/:id/pdf?format=a4|a5|thermal80|thermal58`, `POST /invoices/:id/void`
- **Inventory / recipes / customers / staff / analytics / activity / tables / tenants / settings**

See the full list at `/api/v1/docs` (Swagger) and in `server/routes/`.

## Tests

```bash
# Backend (needs a Postgres — CI provides one)
cd server && npm test

# Frontend
cd cafe-management-sys && npm run test:run

# Full local gate (lint + tests + build)
cd cafe-management-sys && npm run verify
```

CI: [`.github/workflows/ci.yml`](.github/workflows/ci.yml) (Postgres + migrate +
seed + lint + tests + build) and a non-blocking
[Lighthouse job](.github/workflows/lighthouse.yml).

## Security

No secrets are tracked. `.env` files, `server/logs/`, `server/mail/*.json`, and
`server/firebase/` are gitignored; `.env.example` templates contain key names
only. **If you clone an old commit, read
[`docs/secrets-rotation.md`](docs/secrets-rotation.md)** — git history still
contains credentials that must be rotated and purged. Report vulnerabilities per
[`SECURITY.md`](SECURITY.md).

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

## License

MIT — see [`LICENSE`](LICENSE).
