# Cafe Management System

Full-stack cafe POS: **React 18 + Vite** frontend, **Express + Knex/Postgres** backend. Multi-tenant, GST invoicing, staff-only auth, white-label ready.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite 8, MUI v5, React Router v6 |
| Backend | Express 4, Knex 3, PostgreSQL (Neon or Docker) |
| Auth | JWT (staff/admin), tenant-scoped |
| Invoices | GST Rule 46, PDF (A4 / A5 / 58mm / 80mm) |
| Tests | Vitest (backend + frontend) |

## Quick start

### Database

```bash
# Local Postgres (Docker)
docker compose up -d postgres

# Or point DATABASE_URL at Neon in server/.env
```

### Backend

```bash
cd server
npm install
# server/.env → DATABASE_URL=postgresql://user:pass@host:5433/db
npm run db:migrate && npm run db:seed
npm start
# API: http://localhost:4969/api/v1
# Docs: http://localhost:4969/api/v1/docs
```

### Frontend

```bash
cd cafe-management-sys
npm install
# .env → VITE_API_URL=http://localhost:4969/api/v1
npm start
# http://localhost:3000
```

## Demo tenants (after seed)

| Slug | Admin email | Password |
|---|---|---|
| cafe1 | admin@cafe1.local | Admin123! |
| cafe2 | admin@cafe2.local | Admin123! |

Subdomain routing: `cafe1.localhost:3000` or `cafe1.yourdomain.com`. Bare localhost uses `DEFAULT_TENANT_SLUG`.

## API (v1)

All product endpoints under **`/api/v1`**. Infra: `/health`, `/metrics`.

- Auth: `POST /auth/login`, `POST /auth/register/staff`
- Orders: `POST /orders`, `GET /orders/history?phone=`, `GET /orders`, `PUT /orders/:id/status`
- Invoices: `POST /orders/:id/invoice`, `GET /invoices`, `GET /invoices/:id/pdf?format=a4|a5|thermal80|thermal58`
- Analytics: `GET /analytics/summary|sales|orders|top-items|category-mix`
- Tenants (platform admin): `GET/POST /tenants`, `PATCH /tenants/:id`
- Settings: `GET /settings/public`, `GET/PUT /settings`

## Tests

```bash
cd server && npm run test:coverage          # Vitest + v8 (Docker PG)
cd cafe-management-sys && CI=true npx vitest run --coverage
```

## License

MIT — see [LICENSE](./LICENSE).
