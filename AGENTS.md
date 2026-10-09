# AGENTS.md

> **Status: pre-alpha, in development, product name undecided.** "Restaurant
> POS" / "Cafe Management System" / "Restaurant Management" are placeholder
> strings that differ across manifests and UI. Live remaining-work report:
> [`docs/STATUS.md`](docs/STATUS.md). Full plan + deviation log:
> [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md).

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
- Frontend `.env`: `VITE_API_URL=http://localhost:4969/api/v1`. Server will not boot without Postgres; Cloudinary/SMTP optional (`STORAGE_DRIVER`, `SMTP_HOST`). Uploads: **`STORAGE_DRIVER=cloudinary`** (default when `CLOUDINARY_CLOUD_NAME` is set) or `STORAGE_DRIVER=local` serves `/uploads`.

## Env
- `server/.env` and `cafe-management-sys/.env` are **local-only (untracked since 2026-10-06)** — root `.gitignore` covers `.env`/`.env.*`. Template: `server/.env.example` (key names only). Don't recreate tracked env files; don't print their contents.
- Frontend `.env`: `VITE_API_URL` + optional first-paint brand `VITE_DEFAULT_BRAND_NAME`/`VITE_DEFAULT_PRIMARY_COLOR`/`VITE_DEFAULT_ACCENT_COLOR` (template `cafe-management-sys/.env.example`). Vite exposes **only `VITE_*`** via `import.meta.env`. **`process.env` and `REACT_APP_*` are banned in `src/`** — gate: `grep -rn "process\.\|REACT_APP" src` → 0.
- **DB (Phase I, live):** Knex + Postgres. `DATABASE_URL` (runtime pool) and optional `DIRECT_DATABASE_URL` (migrations in prod). Falls back to `DB_URI` then localhost Docker (`docker-compose.yml`, port **5433**, user/pass/db `cafe`). **Mongoose/mongodb deps removed**; `server/models/` deleted. Neon: same `DATABASE_URL` pointing at `postgres://…neon.tech`; `NEON_BRANCH` used by `db:reset` guard (refuses `prod`).

## Database (Knex / Phase I)
- Config: `server/db/knexfile.js` (env `development|test|production`), pool singleton `server/db/pool.js` → `getDb()`. **knexfile loads `server/.env` itself** (explicit path), so `npm run db:migrate`/`db:seed` work without exporting env first.
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
- Lazy drivers: `STORAGE_DRIVER=local|cloudinary` (Cloudinary used when configured); mail only if `SMTP_HOST` set. Rate limiters no-op when `NODE_ENV=test`. Backend tests refuse to run against a non-local DB host unless `ALLOW_REMOTE_TEST_DB=true` (`server/test/setup.js`).
- Bcrypt hashing: `services/authService.js` (called explicitly from staffRepo.create / login — no pre-save hook).

## Native modules / WSL
- `node_modules` is shared with Windows (repo lives on `D:`). Native `.node` binaries are PE32+ Windows DLLs → `invalid ELF header` / `ERR_DLOPEN_FAILED` when running Node from WSL. `bcrypt` is the one loaded at server boot (via `authController` → `staffAndAdmin` model).
- Fix: `cd server && rm -rf node_modules/bcrypt && npm install bcrypt@5.1.1` under WSL (node-pre-gyp fetches the Linux binding). `npm rebuild bcrypt` alone may NOT replace the existing Windows binary. Audit other native deps the same way if boot fails on a different `.node` file.

## Vite on WSL / `D:` (dev-server stability)
- Symptom: `[vite] server connection lost`, `ERR_EMPTY_RESPONSE` on deps, blank white page after a few minutes.
- Causes: (1) the dep optimizer **writing into the Windows mount** hangs, leaving `node_modules/.vite/deps_temp_*` with no `deps/`; (2) bundling the **`@mui/icons-material` barrel** (thousands of icons) also stalls it.
- Fix (in `vite.config.js`): `cacheDir: '/tmp/cafe-vite-cache'` (Linux-native fs), `optimizeDeps.include` for core/MUI/prop-types, and `server.watch.ignored` for `node_modules`/`build`/`coverage`. **Discovery stays ON.**
- **Do NOT set `optimizeDeps.noDiscovery: true`.** MUI v5 deep modules are CommonJS on disk (`@mui/system/colorManipulator.js`, `@mui/icons-material/Add.js` have no `exports` map). Skipping pre-bundling serves raw CJS → `does not provide an export named 'darken'/'default'`. All CJS deps must go through the optimizer (VM installed; Vite/Rolldown 8).
- **Import icons as deep paths, never the barrel:** `import MenuIcon from '@mui/icons-material/Menu'` (one file each). `import { Menu } from '@mui/icons-material'` pulls the whole barrel and hangs the optimizer. Gate: `grep -rn "from '@mui/icons-material'" src` → 0.
- **Icon subpaths are aliased to MUI's ESM build** (`resolve.alias` in `vite.config.js`): `@mui/icons-material/<Icon>` → `@mui/icons-material/esm/<Icon>`. Reason: the package root `Add.js` is CommonJS and rolldown's interop emits `export default require_Add()` (the *namespace* `{ __esModule, default }`) → `import Home from '@mui/icons-material/Home'` is an **object** → React `Element type is invalid ... got: object`. `esm/Home.js` is real ESM (`export default createSvgIcon(...)`) and resolves correctly. `@mui/material` deep paths are already ESM, so they need no alias.
- Scripts: `npm run dev:clean` (clear cache + start), `npm run clean` (cache + build + `.vite`).
- If deps get inconsistent: `npm run clean && npm start`, then wait once for the optimizer to finish before relying on HMR. Cached starts are ~2s; a first/cold optimize is ~3-10s.

## Graceful shutdown
- Backend `node index.js` handles `SIGINT`/`SIGTERM`: closes the HTTP server then `destroyDb()` (Knex pool) via `middleware/errorHandler.gracefulShutdown` (8s force-exit safety net). Kill with a single Ctrl+C; a second Ctrl+C forces exit.


## Frontend API layer
- Real client: `src/services/api.js` (fetch, injects `Bearer` token from `sessionStorage.token` + **`X-Request-Id`**). Base URL: **`/api/v1`** (`VITE_API_URL=http://localhost:4969/api/v1`). Exports `unwrap(body)` → `body.data` when envelope present. Analytics endpoints are real (`/analytics/summary|sales|orders|top-items|category-mix`) — no silent mocks. `src/utils/formatMoney.js` for INR display. `src/adapters/` for API→view models.
- `components/CartContext.jsx` and `pages/customer/MenuPage.jsx` go through `services/api.js` (no direct axios/fetch for menu/orders).
- Backend responses are wrapped: `{ success, message, data?, timestamp }`. Handle that shape, not raw payloads. Orders, menu, staff, and customers controllers all use `sendResponse` from `middleware/auth.js`.
- Frontend calls some endpoints that don't exist on the server (`/analytics/*`, `/health` under `/api`) — they have `.catch()` mock fallbacks. Adding analytics routes is real work, not a wiring mistake.
- Dead code deleted in Phase V: `src/config/` (api/routes/theme), `src/data.js`, `src/reportWebVitals.js`, `src/App.test.js`, `web-vitals`, `dotenv`. Don't reintroduce them.

## Navigation & layout (frontend)
- **Single source of truth: `src/constants/navigation.js`** — `CUSTOMER_NAV` (Home `/`, Menu `/menu`, My Orders `/orders`, Cart `/cart`), `ADMIN_NAV`, `adminNavItems(isPlatformAdmin)`, `isAdminNavActive(item,path)`, `matchAdminNav(path)`. Add links here, not inline. (`src/config/` still off-limits; `constants/` is the home for this.)
- Customer shell: `components/navigation/Navbar.jsx` (top bar: brand, desktop links, working search, live `CartContext` badge, account menu, dark-mode toggle), `BottomNav.jsx` (mobile, `CUSTOMER_BOTTOM_NAV`), `Footer.jsx`. `components/layout/Layout.jsx` is the shell and uses **CSS breakpoints** (`sx.display`) — no `useMediaQuery`.
- Search: navbar submits → `/menu?q=…`; `MenuPage` reads `useSearchParams` and filters via memo. Menu data is fetched once per session through `hooks/useMenuData.js` (`prefetchMenu()` on nav hover). Call `clearMenuCache()` after menu mutations.
- Admin shell: `AdminLayout.jsx` (title/breadcrumbs from `matchAdminNav`), `Sidebar.jsx` (config-driven, low-stock badge), `Header.jsx` (real `useThemeContext` toggle). No fake notification/search widgets.
- Theme: `contexts/ThemeContext.jsx` exposes `{ mode, isDarkMode, toggleMode, setThemeMode }` (persisted to `localStorage.themeMode`, follows system until set); `common/ThemeProvider.jsx` builds the theme via `utils/m3Theme.js` (**Material 3** flavour: tonal surfaces, Outfit, filled buttons, pill list items, nav-bar active indicator). Both contexts memoize their value. **Typeface is Outfit**, self-hosted via `@fontsource-variable/outfit` (imported in `index.jsx`; no Google CDN).
- Shared primitives: `components/common/PageHeader.jsx` (M3 page title/subtitle/icon/actions) and `components/common/EmptyState.jsx` (tonal icon disc + action). Prefer these over bespoke headers. `components/ui/*` now only exports the providers (Toast/Loading/Confirm); the old unused Button/Card/Modal/Input/Badge/Tooltip/LoadingSpinner/EmptyState primitives were deleted — use MUI directly.
- Perf baseline: route-level `lazy()` for every page (incl. `CartPage`), `React.memo` on shell components, module-scope styled components/nav arrays, no barrel icon imports. **No `components/index.js` barrel** — import components directly (the barrel pulled every component into the initial bundle). Main bundle ~225 kB (~69 kB gzip).

## Customer storefront (ordering)
- **Phone-based identity**: `contexts/CustomerContext.jsx` (`useCustomer`) stores `{ phone, name, tableNumber }` in `localStorage` — no password. `common/CustomerSignInDialog.jsx` (lazy-loaded from the Navbar) captures just a phone. Orders are linked by `phone` + `customerName` (`CartContext.createOrder` → `POST /orders`), so `GET /orders/history?phone=` works end-to-end.
- **Checkout**: 4 steps Cart → **Details (name/phone/table)** → Payment → Review. `CartComponents/CustomerDetailsForm.jsx` (+ `useCheckoutFlow`) replaced the bogus shipping form. Placing an order persists the customer.
- **Fast add-to-cart**: `CartContext.addToCart(itemOrId, options, size)` uses the item object / session menu cache (`findMenuItem`) — **no per-add `/menu/:id` round-trip**. Items with no choices get a one-tap Add; others open the customization dialog.
- **Favourites**: `utils/favouritesStore.js` (localStorage, `useSyncExternalStore`) + `hooks/useFavourites.js`; heart on `MenuItemCard`, "Favourites" filter chip on `MenuPage`.
- **Table / QR ordering**: `?table=N` anywhere is captured by the Navbar and shown as a chip; prefills checkout.
- **My Orders** (`pages/customer/OrderHistoryPage.jsx`): phone lookup, **status tracking**, and **Reorder** (re-adds via the menu cache).
- **Menus are vertical-agnostic** (any restaurant/café): categories are derived from the tenant's own data (MenuPage + AdminMenu). Demo items in `server/db/seeds/001_demo.js` are seeded idempotently by title.
- **API host follows the tenant subdomain** (`services/api.js`): on `cafe2.localhost:3000` the API is called at `cafe2.localhost:4969` so the server resolves tenant `cafe2`. No-op for `localhost`/IPs/`www`; prod keeps true subdomains.

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
- Rate limits are aggressive: auth endpoints 5 req/15 min per IP, all `/api` 100 req/15 min. Scripted/manual API testing trips 429s fast; under `NODE_ENV=test` the limiters are disabled.

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
- `LICENSE` (MIT) at repo root; both `package.json`s declare `"license": "MIT"`. Repo hygiene: `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `CHANGELOG.md`, `.github/` PR + issue templates.
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
- `.env` files are **not tracked** (untracked 2026-10-06; see root `.gitignore` + `server/.env.example`). Still tracked and sensitive: Google OAuth client-secret JSON (`server/mail/*.json`) and `server/logs/*.log`. Cloudinary credentials live only in `server/.env` (`CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET`). Never echo secrets, never add new credentials, keep `logs/` out of commits unless asked.


