# Self-hosting

This app is free and self-hostable. Two services: an **API** (`server/`, Node +
Knex/Postgres) and a **static frontend** (`cafe-management-sys/`, Vite build).
You need Node 20 + a Postgres database (local, Docker, Neon, or any Postgres).

## 1. Prerequisites

- Node.js 20+
- A Postgres 14+ database (or Docker)

Minimum required config: `DATABASE_URL` + `JWT_SECRET`. Everything else
(Cloudinary, SMTP) is optional — the app boots without them.

## 2A. Quick start with Docker Compose (API + Postgres)

```bash
# from the repo root
JWT_SECRET=$(openssl rand -hex 32) \
docker compose -f docker-compose.selfhost.yml up --build
```

This starts Postgres, runs migrations + the demo seed once, then serves the API
on `http://localhost:4969` (health at `/health`). Provide Cloudinary/SMTP vars
via the environment to enable them.

## 2B. Manual setup

```bash
cd server
cp .env.example .env         # set DATABASE_URL + JWT_SECRET
npm install
npm run db:deploy            # migrations (production-safe; use db:migrate in dev)
npm run db:seed              # demo tenants/menu/admin (idempotent)
npm start                    # http://localhost:4969
```

`server/db/knexfile.js` loads `server/.env` automatically, so the `db:*` scripts
work without exporting env first.

## 3. Frontend

```bash
cd cafe-management-sys
cp .env.example .env         # set VITE_API_URL to your API (…/api/v1)
npm install
npm run build                # outputs static files to build/
```

Serve `build/` with any static host. Because it is a SPA, add a catch-all
fallback to `index.html`. Example nginx:

```nginx
location / { try_files $uri /index.html; }
```

For per-restaurant branding, serve each tenant from its own subdomain
(`cafe1.example.com`) and point `VITE_API_URL` at the matching API host — the
server resolves the tenant from the request Host header.

## 4. First login / admin

The seed creates per-tenant admins:

- `admin@cafe1.local` / `Admin123!`
- `admin@cafe2.local` / `Admin123!`

**Change these immediately.** Set `PLATFORM_ADMIN_EMAIL` / `PLATFORM_ADMIN_PASSWORD`
before seeding to control the platform admin. Tenants are managed at
`/admin/tenants` (platform admin only).

## 5. Environment reference

See `server/.env.example` for the full list. Key variables:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres connection (pooled). `DIRECT_DATABASE_URL` for migrations in prod |
| `JWT_SECRET` | Token signing — set a long random value |
| `DEFAULT_TENANT_SLUG` | Tenant used on bare hosts (e.g. `localhost`) |
| `PUBLIC_DOMAIN` / `CORS_ORIGINS` | Allowed browser origins |
| `STORAGE_DRIVER` | `local` (serves `/uploads`) or `cloudinary` (auto when configured) |
| `CLOUDINARY_*` | Cloudinary upload credentials |
| `SMTP_*` | Outgoing email (optional) |

## 6. Backup

Back up the database regularly (`pg_dump`), and your Cloudinary account if used.
Uploads stored with `STORAGE_DRIVER=local` live in `server/uploads/` — back that
directory up too.
