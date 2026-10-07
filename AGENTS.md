# AGENTS.md

## Repo shape
- Two independent npm projects, **not** a workspace. Root `package.json` is `{}` — never `npm install` there expecting workspaces/monorepo tooling.
  - `cafe-management-sys/` — React 18 SPA, **Vite 8** (migrated from CRA 2026-10-06), MUI v5, React Router v6, `"type": "module"`. Entry: `src/index.jsx`, `index.html` at package root, routes in `src/App.jsx`.
  - `server/` — Express 4 + **Knex/Postgres** (Phase I; Mongoose removed), CommonJS. Entry: `server/index.js`, mounts routes from `server/routes/` → `server/controllers/` → `server/repositories/` → `server/db/pool.js`.
- No CI pipeline, no Prettier/Husky. README's old CRA/Prettier/Husky claims are gone; frontend README is accurate.
- State is React Context only (`contexts/AuthContext`, `contexts/ThemeContext`, `components/CartContext`). No Redux.

## Run
- Backend: `cd server && npm start` → `node index.js` (nodemon via `npm run dev` if installed). Requires Postgres (`DATABASE_URL` or Docker on :5433) + `npm run db:migrate && npm run db:seed` first.
- Frontend: `cd cafe-management-sys && npm start` → **Vite dev server on :3000** (`strictPort: true`). Build: `npm run build` → `build/`. `npm run preview` serves the build.
- Ports: server **4969**. Product API: **`/api/v1`** (e.g. `http://localhost:4969/api/v1/auth/login`). Unversioned: `/health`, `/metrics`, `/api` (info). Docs: `/api/v1/docs`.
- Startup console logs **Cafe API listening on http://localhost:PORT** with Health/API/Docs URLs after Postgres ping; failures print `❌ Postgres connection failed`.
- Access logs: `request` + `response` lines include **`requestId`**, `userId`, `tenantId`, `tenantSlug`, method, url, status, `durationMs`. Every response carries **`X-Request-Id`** (echoes client value if sent). JSONL files in `server/logs/`. Login security events logged separately.
- Frontend `.env`: `VITE_API_URL=http://localhost:4969/api/v1`. Server will not boot without Postgres; Firebase/SMTP optional (`STORAGE_DRIVER`, `SMTP_HOST`). Local uploads: `STORAGE_DRIVER=local` serves `/uploads`.

## Env
- `server/.env` and `cafe-management-sys/.env` are **local-only (untracked since 2026-10-06)** — root `.gitignore` covers `.env`/`.env.*`. Template: `server/.env.example` (key names only). Don't recreate tracked env files; don't print their contents.
- Frontend `.env` has only `VITE_API_URL=http://localhost:4969/api/v1`. Vite exposes **only `VITE_*`** vars via `import.meta.env.VITE_*`. **`process.env` and `REACT_APP_*` are banned in `src/`** — they crash the browser bundle. Gate: `grep -rn "process\.\|REACT_APP" src` → 0.
- **DB (Phase I, live):** Knex + Postgres. `DATABASE_URL` (runtime pool) and optional `DIRECT_DATABASE_URL` (migrations in prod). Falls back to `DB_URI` then localhost Docker (`docker-compose.yml`, port **5433**, user/pass/db `cafe`). **Mongoose/mongodb deps removed**; `server/models/` deleted. Neon: same `DATABASE_URL` pointing at `postgres://…neon.tech`; `NEON_BRANCH` used by `db:reset` guard (refuses `prod`).

## Database (Knex / Phase I)
- Config: `server/db/knexfile.js` (env `development|test|production`), pool singleton `server/db/pool.js` → `getDb()`.
- Migrations: `server/db/migrations/` — `npm run db:migrate` (from `server/`). Prod: `npm run db:deploy`. Reset: `npm run db:reset` (refuses when `NEON_BRANCH=prod` unless `ALLOW_DB_RESET=true`).
- Seeds: `npm run db:seed` (`server/db/seeds/001_demo.js`) — tenants cafe1/cafe2, per-tenant admin `admin@cafe1.local` / `Admin123!`, platform admin from env, demo menu/tables/discount/settings.
- Local PG: `docker compose up -d postgres` (repo root) → port 5433.
- Row mappers live in `server/db/mappers.js` (snake_case ↔ API camelCase, `_id` aliases).
- **WLS note:** `require('knex')` can take ~5–6s on this D:-mounted `node_modules` — don't use short timeouts when booting the server.

## Analytics (Phase J)
- `GET /api/v1/analytics/{summary,sales,orders,top-items,category-mix}` — `ensureAdminOrStaff`, tenant-scoped SQL in `server/services/analyticsService.js` (money in minor units via `utils/money.js`; day bounds from settings `ops.timezone`, default IST +330).
- Summary: revenue, orders, AOV, pending/served counts, top items, prev-day delta bps. Sales: daily series + category breakdown + period change %.
- Frontend AdminDashboard/AdminRevenue/AdminAnalytics call these for real; error surfaces + Retry; no mock fallbacks in `services/api.js` analytics block.

## Tenancy (Phase F + I)
- Multi-tenant from request host: `cafe1.app.com` / `cafe1.localhost:3000` → slug `cafe1`; bare `localhost` → `DEFAULT_TENANT_SLUG`. Middleware: `server/middleware/tenant.js` (mounted on `/api` before routes). Unknown slug → 404; suspended → 403.
- All live tables carry `tenant_id`; unique indexes are tenant-scoped (`staff_admins(tenant_id,email)`, `orders(tenant_id,order_number)`, etc.). Tenants table + platform admin flag `is_platform_admin`.
- JWT payload includes `tenantId` + `isPlatformAdmin`. Token-tenant vs host-tenant mismatch → 403. `ensurePlatformAdmin` guards `/api/tenants`.
- Repositories in `server/repositories/*` — **every fn takes `tenantId` first** (Knex queries now). Controllers **never** import models (gate: 0). `server/services/orderService.js` placeOrder runs in a **knex.transaction** (order + items + customer upsert + table + counter + activity log).
- Money helpers: `server/utils/money.js` (minor units, `applyBps`, `splitCgstSgst`, `TAX_BPS=500`).
- Settings: `GET /api/settings/public`, `GET/PUT /api/settings` (admin). Activity log via `activityRepo.log`.
- Customer auth **removed**. `POST /api/orders` public+tenant-scoped (`phone`+`customerName` upsert guest). History: `GET /api/orders/history?phone=`. Staff login only (`authService.verifyPassword`). Frontend AuthContext staff-only; `AdminTenants` at `/admin/tenants`.
- Lazy drivers: `STORAGE_DRIVER=local|firebase`; mail only if `SMTP_HOST` set. Rate limiters no-op when `NODE_ENV=test`.
- Bcrypt hashing: `services/authService.js` (called explicitly from staffRepo.create / login — no pre-save hook).

## Native modules / WSL
- `node_modules` is shared with Windows (repo lives on `D:`). Native `.node` binaries are PE32+ Windows DLLs → `invalid ELF header` / `ERR_DLOPEN_FAILED` when running Node from WSL. `bcrypt` is the one loaded at server boot (via `authController` → `staffAndAdmin` model).
- Fix: `cd server && rm -rf node_modules/bcrypt && npm install bcrypt@5.1.1` under WSL (node-pre-gyp fetches the Linux binding). `npm rebuild bcrypt` alone may NOT replace the existing Windows binary. Audit other native deps the same way if boot fails on a different `.node` file.

## Frontend API layer
- Real client: `src/services/api.js` (fetch, injects `Bearer` token from `sessionStorage.token` + **`X-Request-Id`**). Base URL: **`/api/v1`** (`VITE_API_URL=http://localhost:4969/api/v1`). Exports `unwrap(body)` → `body.data` when envelope present. Analytics endpoints are real (`/analytics/summary|sales|orders|top-items|category-mix`) — no silent mocks. `src/utils/formatMoney.js` for INR display. `src/adapters/` for API→view models.
- `components/CartContext.jsx` and `pages/customer/MenuPage.jsx` go through `services/api.js` (no direct axios/fetch for menu/orders).
- Backend responses are wrapped: `{ success, message, data?, timestamp }`. Handle that shape, not raw payloads. Orders, menu, staff, and customers controllers all use `sendResponse` from `middleware/auth.js`.
- Frontend calls some endpoints that don't exist on the server (`/analytics/*`, `/health` under `/api`) — they have `.catch()` mock fallbacks. Adding analytics routes is real work, not a wiring mistake.
- Dead code deleted in Phase V: `src/config/` (api/routes/theme), `src/data.js`, `src/reportWebVitals.js`, `src/App.test.js`, `web-vitals`, `dotenv`. Don't reintroduce them.

## Order pipeline contract (Phase 0, verified)
- Order line: `{ menuItemId|menuItem, size: 'medium'|'large', quantity ≥1 int, options: [{name, priceDelta}]|selectedOptions, specialInstructions }`. Legacy keys (`selectedSize`/`selectedOptions`) are still accepted; prices are always computed server-side from `MenuItem.price[size]` (client totals ignored).
- Statuses: `pending → preparing → ready → served | cancelled` (`server/constants/order.js`, shared by model + controller). Payment methods: `cash | upi_manual | card_manual`.
- Responses use the standard envelope. `POST /api/orders` requires `ensureAuthenticated` — identity comes from the JWT (`placedByCustomer` for customer role, `placedByStaff` for admin/staff). No hardcoded ids.
- `orderNumber` is server-generated (`ORD-YYMMDD-####`, unique index, retry on duplicate). Money is numeric (5% GST tax + tip); response `data` includes `order`, `orderNumber`, `taxAmount`, `totalPreparationTime`.
- Cart UI shows ₹; checkout has no delivery step pricing (tax added at checkout).

## Auth / roles
- JWT Bearer token; guards live in `server/middleware/auth.js`: `ensureAuthenticated`, `ensureAdmin`, `ensureAdminOrStaff`. Backend roles are only `staff` and `admin` (enum in `models/staffAndAdmin.js`).
- Frontend `AuthContext.isAdmin/isStaff` also accept `manager`, `waiter`, and `userType === 'staffOrAdmin'` — client-side only; the backend rejects anything but `admin`/`staff`.
- Staff model requires `firstName`/`lastName` (not `name`); AdminStaff page aligned to that + `staff`/`admin` roles + `isActive`/`registrationDate` fields.
- Rate limits are aggressive: auth endpoints 5 req/15 min per IP, all `/api` 100 req/15 min. Scripted/manual API testing trips 429s fast; reset requires waiting or restarting the server. Under `NODE_ENV=test` these should be disabled (not done yet — plan Phase F).

## Tests / verification
- Backend: `npm test` is `echo "Error: no test specified" && exit 1` — it always fails; there is no test suite. `server/test-*.js` are throwaway manual debug scripts, not a framework.
- Frontend: **Vitest** (`npm test` watch, `npm run test:run` single-shot). Config in `vite.config.js` (`test` block: jsdom, globals, `./src/vitest.setup.js`, `passWithNoTests: true` — no real tests yet; Phase P adds them with coverage thresholds). Setup file imports `@testing-library/jest-dom/vitest`.
- Lint gate: `cd cafe-management-sys && npx eslint src --ext .js,.jsx` — **ESLint 8** (eslintrc format; config in `package.json` → `eslintConfig`). ESLint 9 dropped `--ext`/eslintrc, hence the pin. Current state: 0 errors. Note: `react/no-unescaped-entities` is off (JSX copy contains quotes); `no-unused-vars` warns but ignores `React` and `_`-prefixed names.
- Phase 0/verification harnesses live in `/tmp/opencode/` (not committed): `phase0-memory-harness.js` (40 controller checks) and `phase0-http-smoke.js` (16 HTTP checks) — both use `mongodb-memory-server` (`cd /tmp/opencode && npm install mongodb-memory-server`) and require models/controllers directly from `server/`. Reuse/extend these instead of hitting Atlas.

## Docs drift (trust code over docs)
- `server/possibleRoutes.md` and `server/swagger.yaml` are partially stale. Verify against `server/routes/*.js` before following them.
- Example: README says `GET /api/orders/today`; the mounted route is `/api/orders/orders/today` (mount prefix + `orders/today`), and `today=true` on `GET /api/orders` also works.
- **Root `README.md` is current** (Vite + Knex + `/api/v1`). Frontend `README.md` is Vite-era.

## N foundations + O-part1 (2026-10-06)
- `index.html`: Bootstrap CDN **removed**, decorative Google fonts removed, title `Cafe Management` (brand strings in Navbar still hardcoded until O/settings white-label).
- `LICENSE` (MIT) added at repo root; server package.json still says ISC (align later).
- `server/logs/*` untracked via `git rm --cached`; `.gitignore` covers logs + env.
- `server/.env.example` documents all keys (no secrets).
- PWA `manifest.json` name → Cafe POS / Cafe Management System.

## Tests / verification
- Backend: `cd server && npm test` → Vitest (97 tests). Coverage ~60% on core modules. `npm run test:coverage` needs Docker PG (`DATABASE_URL` → :5433). `npm run lint` → ESLint 8 (0 errors).
- Frontend: `CI=true npx vitest run --coverage` in `cafe-management-sys` — ~68% on utils/services/adapters/hooks. `npm run lint` → 0 errors. `npm run build` → Vite.
- Invoice PDF formats: `a4`, `a5`, `thermal80`, `thermal58` (readability-first type scales).
- **CI (GitHub Actions):** `.github/workflows/ci.yml` on PR/push to main — backend (postgres service, migrate+seed, lint, test) + frontend (lint, test, build, artifact upload). `deploy.yml` on main — packages frontend dist + server tarball as artifacts (SSH deploy stub commented).
- Lint gate: `npx eslint src --ext .js,.jsx` — 0 errors expected.

## Secrets / git
- `.env` files are **not tracked** (untracked 2026-10-06; see root `.gitignore` + `server/.env.example`). Still tracked and sensitive: Firebase service-account JSON (`server/firebase/*.json`), Google OAuth client-secret JSON (`server/mail/*.json`), `server/logs/*.log`. Never echo secrets, never add new credentials, keep `logs/` out of commits unless asked.


