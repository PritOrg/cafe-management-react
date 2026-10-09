# Database & migrations

Postgres via **Knex + `pg`**. There is no ORM lock-in: Neon, a self-hosted
Postgres, Docker, or CI's `postgres:16` service all work identically.

## Configuration

`server/db/knexfile.js` resolves the environment and **loads `server/.env`
itself** (explicit path), so the `db:*` scripts work without exporting env first.

| Env | Purpose |
|---|---|
| `DATABASE_URL` | Runtime connection (pooled). `db/pool.js` → `getDb()` singleton |
| `DIRECT_DATABASE_URL` | Optional direct/unpooled URL used by migrations in prod |
| `NEON_BRANCH` | Informational; used by `db:reset` to refuse `prod` |

Fallbacks: `DB_URI`, then local Docker (`docker-compose.yml`, port `5433`,
user/pass/db `cafe`). SSL is disabled for localhost.

## Scripts

```bash
cd server
npm run db:migrate     # apply pending migrations (dev)
npm run db:deploy      # apply migrations (production-safe)
npm run db:seed        # idempotent demo data
npm run db:reset       # drop + recreate + seed (refuses when NEON_BRANCH=prod
                       # unless ALLOW_DB_RESET=true)
```

## Layout

- `server/db/migrations/` — ordered SQL migrations (`YYYYMMDDHHMMSS_name.js`).
- `server/db/seeds/001_demo.js` — tenants, per-tenant admins, menu, tables,
  discount, settings (incl. demo GST).
- `server/db/mappers.js` — snake_case ↔ API camelCase (plus `_id` aliases).
- `server/db/pool.js` — Knex singleton (`getDb()` / `destroyDb()`).

Repositories in `server/repositories/*` own every query and **always take
`tenantId` first**. Controllers never import models (gate:
`grep -rn "models/" server/controllers` → 0).

## Migration rules

- **All schema changes go through checked-in migrations.** Never edit an applied
  migration — **fix forward** with a new one.
- Dev: `db:migrate`. Prod/CI: `db:deploy` (`migrate` is discouraged against a
  shared database).
- Migrations run against `DIRECT_DATABASE_URL` when set; the app runtime uses the
  pooled `DATABASE_URL`.

## Neon (optional)

Neon is supported but not required. If you use it:

- Point `DATABASE_URL` at the **pooled** connection string; set
  `DIRECT_DATABASE_URL` to the **unpooled** string for migrations.
- A branch checkout per environment is a good fit for the migration workflow:
  `neonctl branches create --name feat/x` → `db:deploy` → test → delete on merge.
- `NEON_BRANCH=prod` makes `db:reset` refuse to run.

## Backups

`pg_dump` the database on a schedule. If `STORAGE_DRIVER=local`, back up
`server/uploads/` too; if Cloudinary, back up the Cloudinary account.
