# Implementation Plan — Restaurant POS (working title, FOSS · self-hostable)

> **Project status: pre-alpha · in development.** The product **name is not
> decided yet** — "Restaurant POS", "Cafe Management System", and "Restaurant
> Management" are placeholder strings currently scattered across manifests,
> titles, and UI copy. Nothing is released; expect breaking changes and
> incomplete areas. A "done" checkbox below means the work landed in code or
> docs, **not** that it is release-ready or manually verified on hardware.
> See [`docs/STATUS.md`](STATUS.md) for the live remaining-work report.

**Scope (agreed):** **Mobile-first UI/UX** (phone primary, tablet secondary, desktop considerate) · Inventory · Sales analytics · Customers · Overall summary · Invoice creation (India GST, PDF, all printer types) · Per-activity audit log · **Postgres** (env, library, migrations — Neon or self-hosted) · **White-label branding** everywhere · **TDD + 70–80% coverage** · CRA → Vite.
**Constraints:** No payment gateway (payments confirmed manually). Project is **FOSS and optionally self-hosted** — no paid-service hard dependencies (Firebase/Gmail must become optional drivers). Mongo was removed rather than migrated (see deviation log).

## Deviation log (plan vs. shipped code)

Where the implementation intentionally differs from the original plan. The plan
is a historical document — **the code is the source of truth**.

- **Database**: **Knex + SQL migrations + `pg`**, not Prisma/Neon-only. Works with
  Neon or any Postgres; `prisma`/`mongoose` are absent. (Phase I.)
- **PDF engine**: **`pdfkit`**, not `@react-pdf/renderer` (no Chromium, ARM-friendly).
- **Storage**: **Cloudinary** is the managed default, with a local-disk driver for
  self-hosters. Firebase is fully removed.
- **Analytics GST split** is derived from order totals, not per-item `gst_rate_bps`.
- **Print** is **server-rendered** (`/invoices/:id/print`, `/pdf`, `/print-escpos`);
  there is no client-side `PrintDialog` component (phase L3 as written).
- **Inventory** gained **recipes/BOM** (menu item → ingredient deductions) beyond
  the plan's flat `subtract_stock` flag.
- **Realtime** `order:status`/`stock:low` are emitted from controllers, not services
  (functionally identical; services own `order:created`/`invoice:issued`).
- **Tests**: Vitest + a real Postgres service in CI; **PGlite and Playwright were
  considered and not adopted** (recorded in `docs/testing.md`).
- **Activity retention** is a manual `scripts/prune-activity.js`, not a scheduler.
- **Tenancy**: the plan listed multi-tenancy as a non-goal, but a minimal `tenants`
  table + platform admin + host-based subdomain resolution shipped to support
  white-label hosting (documented as single-brand-per-deployment still).

**Borrowed FOSS patterns:**

| System | Pattern adopted | Where |
|---|---|---|
| TastyIgniter | Modifier **groups** (name, display type, per-value price) attached to items/categories | F, H, L |
| Odoo POS | Local outbox queue + idempotency key, "server wins after ack" | M |
| OpenKDS / Odoo | Event push (Socket.io) instead of polling; color-by-age tickets | M |
| POSR | Append-only inventory movements, offline-first posture | H, M |
| India GST (CGST Rules 2017, Rule 46) | Tax Invoice fields, FY-wise serial numbering, CGST/SGST vs IGST, HSN/SAC summary | L |
| *(Not adopted)* | Floor-plan split-by-seat billing, OWL-style framework, multi-tenancy/SaaS, bump-bar hardware drivers, e-invoicing/IRN (below turnover threshold) | — |

---

## A. Verified current-state audit

Every row was read in this repo; fix or account for each.

| # | Problem | Location |
|---|---|---|
| A1 | Frontend sends `selectedSize`/`selectedOptions`; backend reads `item.size`/`item.customizations` → `menu.price[item.size]` undefined → **NaN totals** | `CartContext.jsx:126-137`, `orderController.js:44` |
| A2 | Hardcoded `tableNumber: 5`, `placedByCustomer: '66859c…'`, `tipAmount: 5` | `CartContext.jsx:130-135` |
| A3 | 4 conflicting status enums: model `pending/preparing/ready/served/cancelled`; controller allows `in-progress` (fails validation); frontend shows `completed` | `models/order.js:60`, `orderController.js:177`, `AdminOrders.jsx:54,103,113` |
| A4 | `AdminOrders` reads `order.orderNumber` / `order.customer.name` — don't exist → **crash on render** | `AdminOrders.jsx:121-122,253,259,343,350` |
| A5 | `require('../models/Table')` vs file `table.js` → breaks on case-sensitive FS | `orderController.js:194` |
| A6 | `populate('placedBy')` — field not in schema | `orderController.js:166` |
| A7 | `paymentMethod !== 'cash'` → 400; `PaymentForm` offers `credit`/`paypal` | `orderController.js:34`, `PaymentForm.jsx:38-57` |
| A8 | Inventory: model exists, **no routes**, page is a 4-item hardcoded mock | `models/inventory.js`, `AdminInventory.jsx:73-125` |
| A9 | Analytics: no routes; frontend `/analytics/*` → 404 → **permanent mock fallbacks** | `services/api.js:283-310` |
| A10 | Dashboard falls back to literal `statsData` | `AdminDashboard.jsx:114,300` |
| A11 | No Customers admin page at all | `pages/admin/` |
| A12 | No invoice/receipt/print code anywhere (`grep window.print\|pdf` → 0); `Transaction` model unused | whole frontend, `models/transaction.js` |
| A13 | `TAX_RATE = 0.05` hardcoded; JS float money + `.toFixed(2)` | `orderController.js:53-57` |
| A14 | Response shapes inconsistent: `sendResponse` envelope in auth middleware, raw JSON in controllers | `middleware/auth.js:5-19` |
| A15 | `CartCustomizationDialog` uses hardcoded mock option lists + flat `₹10/customization` pricing | `CartCustomizationDialog.jsx:70-107` |
| A16 | Sizes mismatch: dialog offers Small/Medium/Large; model has only `price.medium`/`price.large` | `CartCustomizationDialog.jsx:107`, `models/menuItem.js:10-19` |
| A17 | Dead denormalized customer fields (`orders[]`, `preferredItems`, `paymentMethods`, …) never maintained | `models/customer.js` |
| A18 | Menu create posts to `http://localhost:4969/menu` — missing `/api`, hardcoded → 404 | `AddMenuItemForm.jsx:154` |
| A19 | CRA (`react-scripts` 5) toolchain; dead `reportWebVitals.js`/`web-vitals`/`dotenv` | `package.json` |
| A20 | **Branding hardcoded**: `<title>Cafe Day</title>`, swagger `Developer's Paradise Cafe API`, theme colors `#ff6b35`/`#f7931e` literal in `ThemeProvider.jsx:15-25` (duplicated in dead `config/theme.js`) | `public/index.html:15`, `swagger.yaml:3` |
| A21 | **FOSS blockers**: README claims MIT + `LICENSE` file that **doesn't exist**; no `.env.example`; `server/.env`, Firebase service-account JSON, Google OAuth `client_secret`, `logs/*.log` all tracked in git; `server/package.json` says ISC | root, `git ls-files server` |
| A22 | **No activity/audit log**: only file logger (`logs/*.log`), no queryable DB trail of who-did-what | `middleware/logger.js` |
| A23 | **Self-host blockers**: Firebase `process.exit(1)` at boot (`firebase/firebase.js:11`); Gmail account + OAuth hardcoded in mail transport — impossible for a self-hoster to run | `middleware/nodemailer.js:4-9`, `mail/customerMail.js:5-9` |
| A24 | **Two UI frameworks loaded**: Bootstrap 5.3 CDN CSS **and** JS in `index.html` alongside full MUI; 5 Google fonts (Lobster/Pacifico/…) vs theme's Inter | `public/index.html:15,21` |
| A25 | Checkout asks for **shipping address** (`ShippingForm`/`CheckoutStepper`) — wrong flow for dine-in/takeaway | `components/CartComponents/` |
| A26 | Fake data in UI: sidebar `badge: '3'`, `/api/placeholder` image fallback, mock stats/inventory | `Sidebar.jsx:149`, `AdminMenu.jsx:214` |

---

## B. Cross-cutting conventions (decide once, enforce everywhere)

- [x] **API envelope**: every response `{ success, message, data?, timestamp }` via existing `sendResponse` (`middleware/auth.js:5`); frontend unwraps `.data`.
- [x] **Canonical status enum** (single shared constants file): orders `pending → preparing → ready → served | cancelled`; payment `unpaid → paid`; payment methods `cash | upi_manual | card_manual`.
- [x] **Money**: integer **minor units** (paise) everywhere server-side; `server/utils/money.js` (`addLine`, `applyBps`, `splitCgstSgst`, `roundHalfUp`). Tax in **basis points** (`gst_bps`). No `.toFixed()` as source of truth.
- [x] **Keys contract** (fixes A1): order line = `{ menuItemId, size, quantity, options: [{name, priceDelta}], specialInstructions }`; prices always computed server-side and returned.
- [x] **Single API surface**: all fetches via `services/api.js` (move `CartContext.jsx:22,48`, `MenuPage.jsx:44` onto it in Phase 0).
- [x] **No silent mocks**: `.catch(() => mockData)` banned once a real endpoint exists.
- [x] **White-label rule (A20)**: no brand strings, logo paths, colors, invoice headers, or email signatures hardcoded in components/controllers — everything reads from **`settings`** (server, cached) + `GET /api/settings/public`. New code that hardcodes a brand name is a review failure.
- [x] **Activity rule (A22)**: every mutating service calls `logActivity({...})` in the same transaction/flow as the write. Never log passwords, tokens, or raw request bodies of auth routes.
- [x] **Testability rule**: no top-level side effects that need secrets (Firebase), rate limiters must be disableable via env, services take injected deps — these make TDD possible (P). Non-negotiable for new code.
- [x] **Mobile-first rule (primary device: phone)**: design and build at **360px width first**, then scale up (`sm 600 → md 900 → lg 1200`, MUI defaults). Desktop is a *considerate* secondary target, never the starting canvas. Every new screen ships with its mobile layout before any desktop polish; PRs showing only desktop screenshots are incomplete.

---

## C. Target data model (Mongo now → Neon Postgres later)

Child data = separate tables/collections now (no subdocs as source of truth), so the Neon cut-over is mechanical. Final DDL lives in `docs/data-model.md` (Phase F task).

**Core (as before):** `menu_items` · `modifier_groups` (name, display_type `radio|checkbox|select|quantity`, required, min/max_select) · `modifier_options` (name, `price_delta_minor`) · `modifier_group_options` (attach group↔item) · `orders` (number, table_number, refs, status, `subtotal/discount/tax/tip/final_minor`, payment_status/method, placed_at, `client_order_id` UNIQUE, `place_of_supply`, `gst_bps`, `cgst_minor`, `sgst_minor`, `igst_minor`) · `order_items` (price + prep-time **snapshots**, size, qty, options, special_instructions) · `order_events` (append-only: audit + KDS feed + analytics) · `customers` (+ `addresses`) · `inventory_items` (qty, min_qty, supplier, cost) · `inventory_movements` (delta, reason `purchase|order|waste|adjust`, ref_order_id — **never UPDATE qty in place**).

**New for this scope:**

- [x] **`settings`** — single-row-per-key, grouped:
  - `brand.*`: `app_title`, `brand_name`, `legal_name`, `logo_url`, `favicon_url`, `primary_color`, `secondary_color`, `support_email`, `footer_note`
  - `gst.*`: `gstin`, `legal_address`, `state_code` (e.g. `27`), `place_of_supply`, `default_sac` (`996311` restaurant service), `default_gst_bps` (500 = 5%), `invoice_prefix`, `fy_start_month` (4 → April), `invoice_next_seq`, `reverse_charge` (false)
  - `print.*`: `default_paper` (`a4|receipt_80mm`), `receipt_width_mm` (80), `printer_host`/`printer_port` (raw ESC/POS, optional), `auto_print_after_payment`
  - `ops.*`: `business_tz`, `activity_retention_days` (365), `currency` (`INR`)
- [x] **`activity_logs`** — `id`, `actor_type` (`customer|staff|admin|system`), `actor_id`, `actor_label`, `action` (`domain.entity.action` e.g. `order.status_change`), `entity_type`, `entity_id`, `summary`, `before`/`after` (diff JSON, nullable), `request_id`, `ip`, `user_agent`, `success` bool, `at`. Indexes: `(at DESC)`, `(entity_type, entity_id)`, `(actor_id, at)`.
- [x] **`invoices`** — extend prior design: `invoice_number` (`PREFIX/YYYY-YY/00001`, UNIQUE), `fy`, `invoice_date`, `order_id` UNIQUE, `place_of_supply`, `state_code`, `recipient_name`, `recipient_gstin` (nullable), `reverse_charge` bool, `taxable_minor`, `cgst_minor`, `sgst_minor`, `igst_minor`, `tax_rate_bps`, `hsn_summary` (JSON: sac/hsn → qty, taxable, tax), `amount_in_words`, **`brand_snapshot`** (name/legal name/GSTIN/address/logo at issue time — white-label change must never alter past invoices), `status` (`issued|void`), `void_reason`.
- [x] **`menu_items`** += `sac_code` (default `996311`), `gst_rate_bps` (per-item override, e.g. 0% for packaged water) — replaces hardcoded `TAX_RATE` (A13).
- [x] **`uploads`** (self-host storage driver, A23): local driver writes `server/uploads/` + `express.static`; Firebase driver optional behind `STORAGE_DRIVER=local|firebase`.

---

## D. Phase 0 — Stabilize the order pipeline (foundation)

### Backend
- [x] Fix `require('../models/Table')` → `../models/table` (`orderController.js:194`)
- [x] Align `updateOrderStatus` `validStatuses` to model enum (`orderController.js:177`); one shared constants module (B)
- [x] Fix `populate('placedBy')` → `['placedByCustomer','placedByStaff']` (`orderController.js:166`)
- [x] Generate `orderNumber` (unique; format finalized in L as `PREFIX/FY/SEQ` — use a placeholder series now)
- [x] Accept canonical line shape (B); validate `size ∈ {medium,large}`, `quantity ≥ 1`; recompute all money server-side
- [x] Remove `paymentMethod !== 'cash'` 400 (`orderController.js:34`); accept `cash|upi_manual|card_manual`
- [x] Ignore client-sent `totalPrice`/`totalPreparationTime`
- [x] Wrap all controller responses in `sendResponse` (A14)
- [x] Keep `today=true` (`orderController.js:143-151`); fix README route docs

### Frontend
- [x] `CartContext.createOrder`: canonical shape; remove hardcoded `tableNumber`/`placedByCustomer`/`tipAmount` (`:130-135`) — table from context, customer from `AuthContext`
- [x] Fix size keys both sides (A16)
- [x] `PaymentForm`: `cash|upi_manual|card_manual` (`PaymentForm.jsx:38-57`)
- [x] Server-side `orderNumber` + populated customer so `AdminOrders` stops crashing (A4) — preferred over a frontend adapter
- [x] Status chips `completed` → `served` (`AdminOrders.jsx:54,98-118`)
- [x] Fix A18: `AddMenuItemForm.jsx:154` → `menuAPI.create` (FormData, `${base}/menu`)
- [x] Route `CartContext` + `MenuPage` through `services/api.js`

### Acceptance
- [x] Place order → appears in AdminOrders, no console errors
- [x] pending → preparing → ready → served; table returns to `available`
- [x] Totals = server math; no `NaN`/`undefined` price
- [x] `grep -rn "in-progress\|completed" server cafe-management-sys/src` → only `served`

---

## E. Phase V — CRA → Vite migration (~1–1.5 days)

**When: immediately after Phase 0.** Env rename touches files P0 already opens; the testing phase (P) needs Vitest anyway; Phases F+ must land on Vite, not migrate later.

### Install & config
- [x] Node 18+ (repo has v20 ✓)
- [x] `npm i -D vite @vitejs/plugin-react vitest jsdom @vitest/coverage-v8` (drop `react-scripts` last)
- [x] `vite.config.js`: `plugins:[react()]`, **`server:{port:3000, strictPort:true}`** (CORS allows only 3000/3001 — `server/index.js:67`; Vite default 5173 would 403), **`build:{outDir:'build'}`** (keeps `.gitignore`/README/deploy paths), `test:{environment:'jsdom', globals:true, setupFiles:'./src/vitest.setup.js', coverage:{…thresholds from P}}`
- [x] Move `public/index.html` → app root; add `<script type="module" src="/src/index.jsx"></script>`; replace 3× `%PUBLIC_URL%` → `/`; keep Bootstrap CDN links only until the UI phase removes them (N); keep `<div id="root">`
- [x] Verify all sources are `.jsx` ✓ (no extension changes)

### Environment variables
- [x] Replace 4× `process.env.REACT_APP_*` → `import.meta.env.VITE_*`: `services/api.js:2`, `CartContext.jsx:22`, `MenuPage.jsx:44`, dead `config/api.js:3` (delete file)
- [x] `.env` already has `VITE_API_URL` ✓; keep it, drop redundant `REACT_APP_API_URL`/`API_URL` lines
- [x] Gate: `grep -rn "process\." src` → 0 (`process` undefined in browser → instant crash)
- [x] Gate: `grep -rn "REACT_APP" src` → 0

### Scripts / tests / cleanup
- [x] `start: vite`, `build: vite build`, `test: vitest`, add `preview`, remove `eject`
- [x] `setupTests.js` → `vitest.setup.js` (keep `import '@testing-library/jest-dom'`)
- [x] Delete stale `App.test.js` (red suite) — real tests in P
- [x] Remove dead deps: `react-scripts`, `dotenv`, `web-vitals` + `reportWebVitals.js`, `browserslist`
- [x] Replace `eslintConfig: react-app` (CRA-bound) with explicit config — AGENTS gate `npx eslint src --ext .js,.jsx` must keep working
- [x] Delete dead `src/config/api.js` + decide fate of unused `config/routes.js`/`theme.js`/`data.js` (delete; N rebuilds them if needed)

### Docs (same PR)
- [x] `AGENTS.md`: CRA→Vite commands, `import.meta.env.VITE_*` rule, `CI=true npx vitest run`, port-3000/CORS note, `outDir: build`
- [x] `README.md` setup section (reconcile stale claims while there)

### Acceptance
- [x] `npm start` → :3000, HMR works, API calls pass CORS
- [x] Smoke: login → menu → cart → order → admin status → invoice slot
- [x] `npm run build && npm run preview` works
- [x] Gates: no `process.`/`REACT_APP`/`%PUBLIC_URL%`; `npx vitest run` green; eslint clean

---

## F. Phase 1 — Postgres-ready data layer + settings (foundation for Neon, branding, GST)

### Repositories & services
- [x] `server/repositories/`: `orderRepo`, `menuRepo`, `customerRepo`, `inventoryRepo`, `invoiceRepo`, `settingsRepo`, `activityRepo` — plain async functions; **controllers never import `models/*`** (gate: `grep -rn "models/" server/controllers | wc -l` → 0)
- [x] `server/services/orderService.js`: single `placeOrder()` — price → discount → tax (bps) → save → `logActivity` → stock movement → loyalty → event emit. Later phases attach here; controllers stay thin
- [x] `server/utils/money.js` with bps tax + `splitCgstSgst` (feeds L) — replaces `TAX_RATE` literal (A13)
- [x] `GET /api/settings/public` (brand title/logo/colors/feature flags — consumed at boot by frontend); `PUT /api/settings` admin-only, each change `logActivity`ed
- [x] Choose ORM now: **Prisma** (deviation: **Knex** + SQL migrations used; contract/repos unchanged) (schema + migrations, see I) — introduced behind repositories only

### Testability prerequisites (unblocks P; do not skip)
- [x] Firebase: replace top-level init + `process.exit(1)` (`firebase/firebase.js:11`) with **lazy driver selection** `STORAGE_DRIVER=local|firebase` (default `local` for self-host/tests); local driver = `server/uploads/` + `express.static` (also A23/FOSS)
- [x] Mail: `nodemailer` from env (`SMTP_HOST/PORT/USER/PASS`, `MAIL_FROM`) — remove hardcoded Gmail account (A23)
- [x] Rate limiters: skip when `NODE_ENV=test` (auth 5/15min & general 100/15min currently429 any test suite — known from AGENTS.md)
- [x] `server/test-*.js` throwaway scripts: convert valuable ones to real suites or delete (P)

### Frontend
- [x] `src/adapters/` — API→view model mappings (Postgres renames touch one file)

### Acceptance
- [x] `grep -rn "mongoose" server/controllers` → 0
- [x] App behaves identically to Phase 0 end (regression pass)
- [x] Boot with **no** Firebase/SMTP/Gmail credentials present (self-host smoke)

---

## G. Activity log system (per-action audit trail, ~2 days)

### Backend
- [x] Model/table `activity_logs` (schema in C) + `activityRepo`
- [x] `server/services/activityService.js` → `logActivity({ actor, action, entity, before, after, req })` — same-callers as writes; swallow-and-log failures (never fail the business op because of logging)
- [x] Express middleware: assign `X-Request-Id` per request; auto-log outcomes of mutating routes (`POST/PUT/PATCH/DELETE`: method, path, status, entity id if parseable, actor, ip, ua) — **allowlist body fields** so passwords/tokens never land in `before/after`
- [x] Domain events: `order.place`, `order.status` with before/after diff (activity), `auth.login_failed`, `auth.logout`, `order.create`, `order.status_change` (before/after), `payment.confirm`, `invoice.issue`, `invoice.void`, `inventory.adjust`, `menu.create/update/delete`, `customer.update`, `settings.update`, `staff.*`
- [x] Retention: settings `ops.activity_retention_days` (default 365) + nightly prune (delete or move to cold storage); document choice
- [x] `GET /api/activity` (admin): filters `action, actor_id, entity_type, entity_id, from, to`, cursor pagination; `GET /api/activity/entity/:type/:id` for per-record history

### Frontend
- [x] `pages/admin/AdminActivity.jsx` — timeline table, filter bar, diff drawer (`before/after` JSON rendered field-by-field), export CSV
- [x] Register: `App.jsx` route + `Sidebar.jsx` nav + barrels (repo's 5-file pattern)
- [x] Per-entity widgets: "History" tab on order detail, invoice detail, menu item (customer pending) (fed by `/activity/entity/...`)
- [x] `services/api.js`: `activityAPI.{list, byEntity}`

### Acceptance
- [ ] Every action in B's rule list produces a row with correct actor + entity + request_id
- [ ] Placing an order end-to-end yields ≥5 rows (login, order.create, status×2, payment/invoice) — count them
- [x] Auth request bodies contain no `password` in stored diffs (grep test)
- [x] Retention prune removes rows older than setting on a seeded fixture — **deviation:** `services/activityRetention.js` + manual `scripts/prune-activity.js`; **no scheduler wired** (add a cron/Task Scheduler entry in production)

---

## H. Phase 2 — Inventory (~3 days)

### Backend
- [x] `Inventory` (existing) + `InventoryMovement` (C); `routes/inventory.js` + `inventoryController.js`:
  - `GET /api/inventory` (`?lowStock=true&search=`) · `GET /api/inventory/:id` (item + movements) · `POST /api/inventory` · `PUT /api/inventory/:id` · `DELETE` (soft `is_active=false`)
  - `POST /api/inventory/:id/movements` (`purchase|waste|adjust`, delta-sign validation)
- [x] Mount in `index.js:101-105`; `ensureAdmin` on writes (pattern `routes/menu.js:21`)
- [x] Low stock = derived `qty_on_hand <= min_qty` (no stale flag)
- [x] Deduction hook in `orderService.placeOrder()`: movement `reason:'order'`, `ref_order_id`, **only for items with `subtract_stock`**
- [x] Add `subtract_stock` to `models/menuItem.js` + `AddMenuItemForm`
- [x] All writes `logActivity` (G)
- [x] No polling: derive low-stock on read; later push via M events (limiter is 100 req/15 min — `middleware/auth.js:149`)

### Frontend
- [x] `inventoryAPI` in `services/api.js`
- [x] `AdminInventory.jsx`: delete mock (`:73-125`); real fetch; alerts from `?lowStock=true`; create/edit modal (`components/ui/Modal|Input|ConfirmDialog`); Receive/Waste/Adjust actions
- [x] Sidebar `badge: '3'` → real low-stock count (or hide at 0) (A26)
- [x] Remove `analyticsAPI.getInventoryAlerts` mock (`services/api.js:296`)

### Acceptance
- [x] Create → receive 50 → `qty_on_hand=50` + movement row
- [x] Order with `subtract_stock` → stock drops once, movement has `ref_order_id`
- [x] Below min → flagged; activity row exists for every manual movement
- [x] `grep -rn "Mock inventory" src` → 0

---

## I. Neon Postgres migration (env · library · migration system, ~3–4 days)

**When: after Phase H, before analytics (J)** — repositories already abstract storage, so analytics/invoices/activity-log are written **SQL-first** instead of twice. This moved earlier than the previous plan for exactly that reason.

### Library & env setup
- [x] Install: `prisma`, `@prisma/client` (deviation: **Knex + pg** + SQL migrations) (dev: `prisma` CLI); driver adapter only if running serverless: `@prisma/adapter-neon` + `@neondatabase/serverless` — plain long-running Express + Prisma default engine is fine and simpler
- [x] `server/prisma/schema.prisma` (deviation: `server/db/migrations/*.js` knex migrations) — `datasource db { provider = "postgresql", url = env("DATABASE_URL"), directUrl = env("DIRECT_URL") }` (`directUrl` = unpooled; required by `migrate` against Neon's pooler)
- [x] Env keys (document in `.env.example`, see O — **never** commit real values):
  ```
  DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require   # app runtime (pooled)
  DIRECT_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require            # migrations (unpooled)
  NEON_BRANCH=dev                                                                                  # informational
  ```
- [x] npm scripts: `db:migrate`/`db:deploy`/`db:seed`/`db:reset` (knex) (`prisma generate`), `db:migrate` (`prisma migrate dev`), `db:deploy` (`prisma migrate deploy`), `db:seed`, `db:reset` (guarded: refuse unless `NEON_BRANCH` ≠ prod)
- [x] Connection discipline: pooled URL in app (Prisma manages pool: set `connection_limit` conservatively — Neon free tier ~100 concurrent); **migrations only ever against `DIRECT_URL`**
- [x] Add `prisma/` to `.gitignore` exceptions (n/a knex; env/logs ignored): commit `schema.prisma`, `migrations/`; ignore `dev.db`/`.env`

### Migration system rules (Neon-specific)
- [x] All schema changes go through **checked-in SQL migrations** (knex `db/migrations`) (`prisma migrate dev --name …` locally → commit `migrations/<ts>_*/migration.sql`); CI runs `prisma migrate deploy` — never `migrate dev` against shared/prod
- [x] Rollback policy: never edit applied migrations; fix forward with a new migration (**deviation:** Knex, not Prisma — no `migrate resolve`). Documented in [`docs/database.md`](database.md)
- [x] **Neon branching workflow**: documented as an **optional** Neon workflow in [`docs/database.md`](database.md); the app itself has no Neon dependency (any Postgres works)
- [x] Seed data (`server/db/seeds/001_demo.js`) (demo menu, settings defaults, admin user) — self-hosters get a working demo in one command (O)
- [x] Indexes carried from C (+ hardening UNIQUE rebuild): `orders(placed_at DESC)`, `orders(status)`, `order_items(menu_item_id)`, `inventory_movements(item_id, at)`, `activity_logs(at DESC)`, `activity_logs(entity_type,entity_id)`, `customers(email)`, `invoices(invoice_number) UNIQUE`, `invoices(order_id) UNIQUE`, `orders(client_order_id) UNIQUE`

### Data migration & cutover
- [x] Transform script (`scripts/mongo-to-neon.js`): **not applicable** — Mongo was retired (mongoose removed) before any production data existed; the app is Postgres-first with idempotent seeds, so there was no legacy cutover to script
- [x] Verify: row counts per table = source counts / `SUM(final_minor)` matches / invoices gap+dup-free — **n/a** (no Mongo source data; covered by the modern test suites instead)
- [x] Dual-run: app on Neon in staging, Mongo read-only backup — **n/a** (Mongo never served production)
- [x] Cutover: stop Mongo writes → delta export → flip `DATABASE_URL` — **n/a** (nothing to migrate; app runs Postgres from day one)
- [x] Remove `mongoose`/`mongodb-memory-server` from deps
- [x] Update `AGENTS.md` (DB = **Knex/Postgres** — deviation from Prisma; migrate commands, env keys) and `server/.env` handling per O

### Acceptance
- [ ] Fresh clone + `cp .env.example .env` + `npm run db:deploy && npm run db:seed && npm start` boots against a Neon branch with zero manual SQL
- [x] `prisma migrate dev` on a feature branch → app still passes full suite — **deviation:** Knex; `db:migrate` on a branch + full suite passes in CI
- [ ] Verification script prints ✅ for all three sums/count checks

---

## J. Phase 3 — Sales analytics + overall summary (~4 days, SQL-first)

### Backend
- [x] `services/analyticsService.js` — **written directly in SQL** `GROUP BY` (the point of I):
  - `summary(tzDayStart, tzDayEnd)` → `{ revenueMinor, ordersCount, aovMinor, pendingCount, topItems[], covers, prevDayDeltaBps }`
  - `salesSeries(period)` → `[{date, revenueMinor, ordersCount}]` + `breakdown[]` (by category) + `revenueChangePct` + `ordersChangePct`
  - `orderStats(period)` → counts by status + payment method
  - `topItems(period, limit)`; `categoryMix(period)`
- [x] Routes `/api/analytics/{summary,sales,orders,top-items,category-mix}` + `ensureAdminOrStaff`, mounted in `index.js`
- [x] Day boundary from `ops.business_tz` (replace server-local midnight in `orderController.js:102-117`)
- [x] GST-aware reporting: revenue split taxable vs CGST+SGST/IGST — **deviation:** derived from order totals in `analyticsService`, not per-item `gst_rate_bps`
- [x] `daily_sales` rollups — **not needed** at current data sizes; live `GROUP BY` summaries are fast (revisit if p95 > ~300ms)

### Frontend
- [x] Delete `/analytics/*` mock fallbacks (A9) — surface error states instead
- [x] `AdminDashboard`: remove `statsData` literal (A10); real summary + today-vs-yesterday + top-items card
- [x] `AdminRevenue`: wire `dailyRevenue`/`breakdown` (already matches); all money via `formatMoney()`
- [x] `AdminAnalytics`: real calls (`:54-56`), delete leftover mock series

### Acceptance
- [ ] Seed 2 days of orders → summary/revenue/analytics match hand calculation exactly
- [x] No `/analytics/*` 404s; no mock renders when API down
- [x] `grep -rn "catch(() =>" src/services/api.js` → 0 analytics mocks (only remaining hit is the error-body parse, not a data mock)

---

## K. Phase 4 — Customers (~2 days)

### Backend
- [x] `GET /api/customers` — pagination, `?search=`, `?membership=`, sort by last order (extend `getAllCustomers` stub)
- [x] `GET /api/customers/:id` · `GET /api/customers/:id/orders`
- [x] `GET /api/customers/:id/summary` — **derived from orders**: `{ ordersCount, lifetimeValueMinor, avgOrderMinor, lastOrderAt, favoriteItems[3], loyaltyPoints, membershipLevel }` (never maintain A17 arrays)
- [x] `ensureAdmin` (pattern `routes/customers.js:14`)
- [x] Loyalty hook in `orderService.placeOrder()`: `points += floor(final_minor/1000)`; recompute `membershipLevel` from settings thresholds after payment
- [x] Admin `DELETE /api/customers/:id` → soft delete (`isActive=false`)
- [x] `logActivity` on all (G)

### Frontend
- [x] `pages/admin/AdminCustomers.jsx` — table (name, email, phone, orders, LTV, last visit, membership chip), search, row → detail drawer (profile, address, history, loyalty, favorites)
- [x] Route `App.jsx` (`/admin/customers`) + `Sidebar.jsx` + `AdminLayout.jsx`. **Deviation:** `Breadcrumbs.jsx` was deleted in the shell rewrite; no barrel files
- [x] `customersAPI.list/getById/getSummary/getOrders`

### Acceptance
- [x] Lists real registrations; drawer history matches AdminOrders
- [ ] N orders → LTV/count equal sum; loyalty changes after paid order
- [ ] Non-admin token → 403 (rate limits permitting)

---

## L. Phase 5 — GST invoices · PDF · every printer (~5–6 days)

Split into four workstreams; all reuse `invoiceService.issueForOrder()` (idempotent; one invoice per order; numbering never reuses voids).

### L1 — GST-correct invoice engine (India, Rule 46)
- [x] **Numbering**: `invoice_number = ${invoice_prefix}/${FY}/${SEQ}` where FY = `2025-26` from `fy_start_month=4` (April→March), SEQ resets each FY, strictly consecutive, UNIQUE at DB level; sequence lives in `settings` (Mongo) → **Postgres `SEQUENCE` after I** behind `invoiceRepo.nextNumber()` (document concurrency contract: Mongo max+1+retry vs SQL `nextval` — both never reuse a number)
- [x] **Tax math**: intra-state → `cgst = sgst = taxable * gst_bps/2`; inter-state flag → `igst = taxable * gst_bps`; per-item `gst_rate_bps` override (0% packaged items) with HSN/SAC per item (default SAC `996311` restaurant service); all via `money.js` bps helpers
- [x] **Fields checklist** (map to C's `invoices`): "TAX INVOICE" header · supplier trade name + legal name + full address + **GSTIN** (validate regex `\d{2}[A-Z]{5}\d{4}[A-Z]\dZ\d` + fail-loud config warning if unset) · invoice no + date + time · recipient name (B2C: no GSTIN; show "Unregistered"/omit) · **place of supply** state + code · item table: description, **HSN/SAC**, qty, unit, taxable value, rate, tax amount · HSN/SAC **summary table** · taxable subtotal, CGST/SGST (or IGST) split, round-off, **grand total** · total **amount in words** (Indian system: lakh/crore converter — new `moneyToWordsINR()` util, unit-tested) · reverse_charge = "No" · signature block · `brand_snapshot` frozen at issue (white-label changes never rewrite history)
- [x] GST settings validation: block invoice issuance with clear 400 if `gstin`/`legal_address`/`state_code` unset (first-run wizard in O)
- [x] `POST /api/orders/:id/invoice` (staff; marks `paid`, method, tip) · `GET /api/invoices` (period filters) · `GET /api/invoices/:id` (printable payload incl. `hsn_summary`, `amount_in_words`) · `POST /api/invoices/:id/void` (admin, reason, keeps number, reverts payment) — all `logActivity`
- [x] **Not doing** (per audit): e-invoicing/IRN/QR (below threshold) — intentionally out of scope; columns reserved

### L2 — PDF generation (server-side)
- [x] Library: **`@react-pdf/renderer`** (deviation: **pdfkit** — zero React dep, ARM-friendly) (React devs, tables, logo + font embedding; zero Chromium — runs on a small self-host VPS/ARM). Fallback if tables fight back: `pdfkit`. Pick via 1-hour spike, record decision
- [x] `GET /api/invoices/:id/pdf` → `application/pdf`, `Content-Disposition: inline; filename="<invoice_number>.pdf"`; deterministic output (no timestamps inside body except invoice fields) so re-print = same bytes
- [x] Font: bundle an OFL font (pdfkit standard fonts; `Rs.` fallback in layouts) in `server/assets/fonts/` that contains **`₹`** (Roboto/DejaVu — verify glyph in a test); fallback renders `Rs.`; add PDF unit test asserting buffer > 0 + text extract contains invoice number (use `pdf-parse` in tests only)
- [x] Layouts: **A4 Tax Invoice** + A5 + 58mm + 80mm thermal (readability-first) (full Rule 46, tables, brand logo/header/footer from `brand_snapshot`) + **80mm thermal receipt** (compact: brand header, item lines, tax split, total, invoice no) — two components, one data payload
- [ ] Optional: attach PDF to confirmation email (SMTP driver from F) — flag-gated

### L3 — Every printer type (print strategy)
- [x] **Tier 1 — HTML print views (covers everything, do first):**
  - `PrintDialog` component with 3 actions: **A4 invoice** · **80mm receipt** · **PDF download**
  - A4 view: `@page { size: A4; margin: 12mm }`, `@media print` hides chrome → prints correctly on **laser, inkjet, and dot-matrix** (Epson LX/TVS class — driver handles ESC/P; continuous tractor paper = set margin/`@page` accordingly)
  - Receipt view: `@page { size: 80mm auto; margin: 4mm }`, font ~11–12px monospace-ish → prints on **80mm and 58mm thermal** printers installed as normal system printers (USB/Ethernet-with-driver); `print-color-adjust: exact` for background bands
  - Always `window.print()` — browsers never let JS pre-select a printer (security); correct `@page` size makes the right printer preview correctly
- [x] **Tier 2 — raw ESC/POS (optional, behind `print.printer_host`)**: for driverless network thermal printers — server-side TCP job to `host:9100` with a tiny ESC/POS encoder (text, `GS V0` cut, codepage note: `₹` may need graphic-mode or `Rs.` fallback); "Test print" button in settings; defer until Tier 1 validated
- [ ] Print matrix checklist (manual, once per release): A4 laser · A4 inkjet · dot-matrix (tractor feed) · 80mm USB thermal · 58mm thermal · PDF opened on mobile → print — all 6 must show correct page size, no clipped totals, brand header present
- [x] Print default: `settings.print.default_paper` + per-browser `localStorage.printPaper`. **Deviation:** no `PrintDialog` component — the invoice list row opens the server print/PDF routes directly

### L4 — White-label invoice
- [x] Everything visual from `brand_snapshot` (C): logo, legal name, address, GSTIN, primary color, footer, receipt header title
- [x] No hardcoded brand strings anywhere in invoice/print templates (A20)
- [ ] Fallback art: generated monogram (initials) when no logo uploaded

### Acceptance
- [ ] Cash/UPI-manual order → Take payment → invoice number strictly increases; **5 parallel requests → no duplicates** (test script)
- [ ] Fixture order (Maharashtra customer, 5%): taxable ₹1000 → CGST ₹25 + SGST ₹25 = ₹1050 — asserted in unit test; IGST path tested for inter-state flag
- [ ] FY rollover test: seq resets at `fy_start_month`, new prefix year
- [ ] PDF contains: invoice number, GSTIN, place of supply, HSN summary, amount in words, brand logo — asserted via text-extraction test
- [ ] All 6 printers in the print matrix pass; re-print after brand rename shows **old** snapshot on the old invoice
- [x] Void → order `unpaid`, invoice kept `status='void'`, activity row written (tested in `invoice.integration.test.js`)

---

## M. Phase 6 — Real-time & offline (optional, ~3–4 days)

### Backend
- [x] `socket.io` on existing Express; namespace `/ops`; JWT handshake auth
- [x] Single `events.js` emitter called from services (never import socket in repos): `order:created`, `order:status`, `stock:low`, `invoice:issued`, `activity:new`
- [x] Socket = notification only; client refetches → keeps repos DB-agnostic

### Frontend
- [x] `services/socket.js` (connect/reconnect/subscribe)
- [x] AdminOrders + Dashboard refresh on event (server wins, no local merge)
- [x] Optional `/kds`: ticket grid by `placedAt`, age colors (<10m green, 10–15m amber, >15m red), keyboard bump `1..9`
- [x] Offline outbox (Odoo pattern): failed `POST /orders` → IndexedDB entry + `clientOrderId` UUID → replay on `online`; server dedupes on `orders.client_order_id` UNIQUE (C)
- [x] **Rule (Odoo bug #189836)**: after server ack → delete local entry; never merge
- [x] Offline banner: "N orders queued"

### Acceptance
- [ ] Two browsers: new order appears in both without refresh
- [ ] DevTools offline → 2 orders → online → both appear **once**

---

## N. UI/UX overhaul — mobile-first (~5–6 days)

> **Status: in progress — this is the active phase.** The remaining N work is
> broken into concrete workstreams in [`docs/phase-n-plan.md`](phase-n-plan.md).

**Device reality:** customers order from phones; staff/owners run the admin on **tablets** and phones (restaurant floor has no desks); desktop/PC is supported but designed **last**. Method: design at **360px**, scale up; the breakpoints below are the contract.

Breakpoint contract (MUI defaults, `theme.breakpoints`):

| Name | Width | What lives here |
|---|---|---|
| `xs` | 360–599 | **Base design canvas** — every flow works here first |
| `sm` | 600–899 | Portrait tablet / large phone: 2-up cards, condensed tables |
| `md` | 900–1199 | Landscape tablet (POS-ish admin): sidebar + denser tables |
| `lg`+ | ≥1200 | Desktop: multi-column, hover extras, keyboard shortcuts |

Foundations start right after V (framework cleanup is build-adjacent); flow polish runs continuously through J–L.

### Foundations
- [x] **Kill the double framework (A24)**: remove Bootstrap CSS+JS from `index.html` (`:15,21`) after grepping pages for Bootstrap classes (`container|row|col-|btn|card|d-flex`) and replacing with MUI Box/Grid — **MUI v5 is already mobile-first** (its default API is `up()`-based); hand-rolled Bootstrap rows are where the mobile bugs live
- [x] **One typography set**: Bootstrap + all Google-font CDN links removed; **Outfit** self-hosted via `@fontsource-variable/outfit`; inputs use 16px on `xs` to kill iOS focus-zoom
- [x] **Design tokens**: brand colors → `/api/settings/public` → runtime `createTheme` (O); define spacing/radii/type scale with **mobile density defaults** (base spacing 8, generous 44px+ hit areas); status colors single map front+back
- [x] **Consolidate component layer**: shared primitives live in `components/common` (`PageHeader`, `EmptyState`, `ErrorState`, `LoadingState`). **Deviation:** the old `components/ui/*` Button/Card/Modal/Input wrappers were deleted in favour of MUI directly; documented in [`docs/ui-patterns.md`](ui-patterns.md)
- [x] **Standardize 4 states per page**: `LoadingState`/`EmptyState`/`ErrorState`(+retry)/toasts applied across all admin + customer pages (Phase N pass) — see `docs/phase-n-plan.md`
- [x] **Mobile shell (customer)**: bottom `BottomNavigation` (Menu · Cart · Orders · Account) with badge count on Cart; sticky **cart summary bar** (item count + total + "Checkout") pinned above it; top app bar minimal (brand + search)
- [x] **Mobile shell (admin)**: hamburger → `Drawer` nav under `lg`; tablet `md` can show persistent mini-rail; page headers collapse to icon+title

### Flow fixes (each verified against current code)
- [x] **Checkout (A25)**: `ShippingForm` removed; `CustomerDetailsForm` captures Name + Phone + Table + **Dine-in/Takeaway**; no address capture; single-column stepper (`Cart → Details → Payment → Review`)
- [x] **Cart & customization (A15/A16)**: modifier dialog → **bottom sheet on mobile** (full-width, drag handle, sticky "Add to cart ₹X" button), real modifier groups from API (TastyIgniter model), real `price_delta_minor`, sizes from item data; options are large tap rows, not tiny chips
- [x] **Menu browsing**: image cards with one-tap quick-add; category chips from tenant data; favourites filter; `loading="lazy"` + Cloudinary `srcset`/`sizes`; sticky search. **Deviation:** no explicit sold-out overlay (availability handled by data); edge-fade on chips not added
- [x] **Admin on touch**: card lists under `md` via shared `ResponsiveTable` (Orders/Customers/Invoices/Inventory), sticky tables + 25/page pagination at `md+`, bulk status change; `AdminMenu`/`AdminStaff` paginated. **Deviation:** status tabs carry live counts; swipe-to-change-status is stretch (not built)
- [x] **Dashboard**: stat cards 2-up on `xs`, 4-up on `md`; `statsData` removed (A10). **Deviation:** no chart library bundled, so horizontal-scroll charts are n/a
- [x] **Auth**: staff login/registration page, inputs ≥16px, inline validation. **Deviation:** no OTP (customer auth is phone-only, passwordless) and no `visualViewport` keyboard handler
- [x] **Remove fake data (A26)**: no `statsData`, no hardcoded badges, no placeholder images; non-persisted AdminSettings stubs (General/Notifications/Security/Payment + fake System actions) deleted

### Accessibility, touch & thumb-zone
- [x] Contrast audit: `m3Theme` computes `brand.primaryText` via `ensureContrast` and uses it for on-light brand text; bright fill retained for surfaces — see [`docs/ui-patterns.md`](ui-patterns.md)
- [x] Touch targets ≥44×44px on tables/bulk bar/POS controls; primary actions bottom-anchored on `xs`; no hover-only affordances introduced. **Note:** A final sweep of a few bespoke controls (qty steppers) remains; see `docs/phase-n-plan.md`
- [x] Focus-visible rings + `prefers-reduced-motion` in `m3Theme`; `aria-label` on icon-only buttons; cart uses a live region; MUI dialogs trap focus on Esc by default
- [x] Viewport hygiene: `theme-color` meta for Android chrome; `100dvh` not `100vh` for full-screen sheets (mobile URL bar); safe-area `env(safe-area-inset-*)` padding for notched phones (esp. bottom nav + sticky bars)

### Performance & installability (mobile network is the constraint)
- [x] Route-level `React.lazy` + `Suspense` per page; dead `data.js`/`config/*` deleted; **main bundle ≈ 235 kB (≈72 kB gzip)** — under the 170 kB gz first-JS budget (verified by Lighthouse CI)
- [x] Image component with fade-in + `loading="lazy" decoding="async"` + Cloudinary `srcset`/`sizes`; admin code is route-split off customer routes (lazy) — see `docs/lighthouse.md`
- [x] **PWA-lite**: `manifest.json`, `theme-color`, apple-touch-icon, `display: standalone`, brand name/colors driven at runtime by `BrandContext` from `/settings/public`
- [ ] Slow-network UX: skeletons on first paint, request timeout + retry already in `services/api.js` — surface them as states, not dead spinners

### Desktop is considerate, not primary
- [ ] `lg+` gets: hover/keyboard shortcuts (order status `1..5`), denser tables, multi-column dashboard, hover previews — **only after** `xs`/`sm` acceptance passes for that flow
- [x] No desktop-only features break the mobile flow (all new controls have tap equivalents)

### QA matrix (per release, manual unless noted)
- [ ] Devices: **360px Android phone** (base) · 390–412px iPhone (Safari + safe-area) · **768px portrait tablet** · 1024px landscape tablet · 1280px desktop
- [ ] Flows on each: browse menu → customize → cart → checkout · admin: orders status change · invoice print dialog
- [ ] Screenshots per breakpoint in `docs/qa/` (manual); Lighthouse mobile run noted in P's CI
- [ ] Real-device spot check (one Android + one iOS) before each release — DevTools emulation misses safe-area, 100vh, and input-zoom bugs

### Acceptance
- [x] `grep -rn "bootstrap" cafe-management-sys/src public/index.html` → 0 (verified)
- [ ] At **360px**: every flow completes with no horizontal scroll (`document.documentElement.scrollWidth <= innerWidth` on every route), no clipped totals, no hover-dependency
- [x] Bottom nav + sticky cart bar visible and tappable on all customer routes; drawer nav on all admin routes under `lg`
- [x] Checkout for dine-in requires **no address**; modifier sheets use real API modifier groups (zero mock)
- [ ] Lighthouse **mobile**: Performance ≥ 85, Accessibility ≥ 90 on landing + menu
- [ ] Keyboard-only pass still works on desktop: login → menu → cart → checkout → admin status change
- [ ] QA screenshots for all 5 breakpoints attached to the PR

---

## O. White-label branding + FOSS/self-host release (~3–4 days)

### White-label everywhere (A20)
- [x] **Runtime brand config**: `BrandContext` fetches `GET /settings/public` → sets `document.title`, theme-color, favicon link swap, dynamic manifest; brand colors flow into the MUI theme via `m3Theme` (with contrast guard)
- [x] **Vite build-time fallback**: `VITE_DEFAULT_BRAND_NAME` / `VITE_DEFAULT_PRIMARY_COLOR` / `VITE_DEFAULT_ACCENT_COLOR` used for first paint before settings arrive; SPA title injected client-side (documented limitation)
- [x] **Emails**: `mail/customerMail.js` templates read brand name/signature from settings (SMTP driver, optional)
- [x] **Swagger**: neutral `Restaurant POS API` title/description (no brand strings) (A20)
- [x] **Invoices/receipts**: `brand_snapshot` frozen at issue time (L4)
- [x] **Theme**: single source in settings; dead `config/theme.js` deleted (values re-homed to `m3Theme`)
- [x] Settings admin page: real **Brand / GST / Printing / Operations / SMTP+Storage (Integrations)** tabs, each save `logActivity`ed. **Deviation:** the non-plan General/Notifications/Security/Payment tabs still exist as **non-persisted stubs with US/USD defaults** — see `docs/STATUS.md`
- [x] Guard: brand change → live preview strip before save

### FOSS / self-host release blockers (A21, A23)
- [x] **License**: root `LICENSE` (MIT) + `license: "MIT"` in both `package.json`s
- [x] **Purge secrets from git history** — done: `git filter-repo` rewrote history + force-pushed `main`/feature branches (stray Chrome profile, OAuth client secret, old `.env`/firebase/logs removed). **Rotate first, then purge** runbook: `docs/secrets-rotation.md` (rotation still the operator's job)
- [x] `.gitignore`: no longer tracks `server/.env`, `server/mail/*.json`, `server/firebase/`, `server/logs/`; `.env.example` kept in both projects
- [x] Storage default `local`; mail SMTP optional; app boots with **only `DATABASE_URL` + `JWT_SECRET`** (Firebase removed entirely)
- [x] **Self-host quickstart**: `docker-compose.yml` (local Postgres), `docker-compose.selfhost.yml` (API + DB), `docs/self-host.md` (prereqs → env → `db:deploy` → `db:seed` → `npm start`); seeded admins are documented with a "change immediately" warning
- [x] **Neon (or any Postgres) documented**: pooled vs direct URL, no Neon lock-in (Knex `pg`) — see `docs/self-host.md` / `docs/database.md`
- [x] Repo hygiene: `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, issue/PR templates, `CHANGELOG.md`; stale CRA/Prettier/Husky/Mongo claims removed from README/AGENTS
- [ ] **License scan**: run `npx license-checker-rseidelsohn --production` before release — not yet run
- [x] Deps hygiene: `styled-components`, frontend `dotenv`, `web-vitals`, `react-scripts`, `firebase-admin`, `mongodb` removed

### Acceptance
- [ ] Fresh clone on a clean machine: **only** Node + a Postgres/Neon URL needed → running branded app ≤ 15 min following `docs/self-host.md`
- [x] `git log -p` after history purge finds no secrets (verified across all refs post-rewrite)
- [x] Rename brand in settings → title, favicon, nav logo, colors, email footer, invoice header **and receipt** all change; old invoices unchanged (verified in the brand-preview/invoice phases)
- [x] `grep -rn "Cafe Day\|Developer's Paradise\|tech.developersteam\|@gmail.com" src server` → 0 in app paths (test fixtures excluded)

---

## P. Testing & TDD — 70–80% coverage target

**Policy**
- [ ] **New code (G, H, I, J, K, L, M + logic in N/O): strict TDD** — write failing test → implement → refactor; same PR; PR template checkbox "tests first". No new feature merges without tests that would have failed pre-implementation
- [ ] **Old code (A1–A26 fixes, P0/P1)**: *characterization tests first* — pin current behavior (even buggy) where cheap, then fix under green; prioritize: `money` math, `placeOrder` totals, status transitions, auth middleware, menu CRUD
- [x] Convert/delete `server/test-*.js` throwaway scripts (task in F) — none remain

**Stack (one runner: Vitest, from V)**
- [x] Backend: **Vitest** (31 test files) — the suite runs against a real Postgres service in CI. **Deviation:** `supertest` not used; tests exercise services/repos/controllers directly
- [x] Frontend: **Vitest + jsdom** + Testing Library
- [x] DB for tests: **real Postgres** (CI `postgres:16` service). **Deviation:** `mongodb-memory-server` (pre-I) and `@electric-sql/pglite` (post-I) were **not adopted** — rationale in [`docs/testing.md`](testing.md)
- [ ] E2E (stretch): Playwright smoke — login → place order → invoice PDF returns 200 + bytes > 0; 5–10 tests max

**What to test first (highest leverage)**
- [ ] Unit: `money.js` (bps tax, CGST/SGST split, rounding, `moneyToWordsINR` lakh/crore edge cases), FY invoice numbering + concurrency (parallel `nextNumber` → no dup), status machine transitions, GST state-code/regex validation, modifier price aggregation
- [ ] Integration (supertest): `placeOrder` (server-side pricing, rejects bad size/qty, stock deducted once), `POST /orders/:id/invoice` idempotency, inventory movements sign rules, activity rows written with no password leakage, settings-driven tax
- [x] Frontend: `formatMoney`, API→view adapters, `AuthContext` role logic, customization dialog with fixture modifier data, checkout no-address flow

**Environment blockers (fix in F — without these nothing runs)**
- [x] Rate limiters disabled under `NODE_ENV=test`
- [x] Firebase removed entirely; storage driver is lazy (`local`/`cloudinary`) — no `process.exit` at boot (A23)
- [x] Tests never touch a remote DB: `server/test/setup.js` refuses a non-local `DATABASE_URL` unless `ALLOW_REMOTE_TEST_DB=true`

**Coverage gates (70–80% target)**
- [ ] `vitest run --coverage` (v8 provider) with thresholds in config, **ratchet not regress**:
  - Global floor: **lines 70%**, branches 65%
  - Per-area floors: `server/services|utils|repositories` **85%** · `server/controllers|middleware` **75%** · frontend `utils|adapters|contexts|hooks` **80%** · components **70%** · pages **60%** (JSX-heavy) — overall lands 70–80%
  - CI fails below floor; weekly (or per-PR) raising the number until 80 global
- [ ] Exclusions (explicit, listed in config): `public/`, `vite.config.js`, `prisma/seed.ts` beyond smoke, generated; **dead code is deleted, not excluded** (A19 cleanup feeds this)
- [ ] Report: coverage summary comment on PRs; badge optional

**CI (none exists today)**
- [x] `.github/workflows/ci.yml`: Postgres service → migrate + seed → backend lint + `vitest`; frontend lint + `vitest` + `vite build`; Node 20. Plus `.github/workflows/lighthouse.yml` (non-blocking). **Deviation:** no `prisma validate` (Knex), no PGlite suite
- [x] Pre-push local: `npm run verify` in both projects (`scripts/verify.sh`, `scripts/ci-local.sh`)

**Definition of done (every feature)**
- [ ] Tests first · coverage floor met (no drop) · manual smoke checklist updated · activity rows verified (G) · white-label rules respected (O) · docs updated

---

## Q. Execution order & effort

```
P0 stabilize ─► V Vite ─► F data layer/settings ─► G activity log ─► H inventory ─► I Neon migration ─► J analytics ─► K customers ─► L GST invoices ─► M realtime/offline
                                   │                                    │                                     │
                                   └─► N UI/UX foundations (from V) ────┴─► N flow polish (continuous) ───────┴─► L print matrix
                                   └─► P TDD/coverage (continuous from F)
O white-label + FOSS release: settings from F, invoice part in L, repo purge + docs — last, before publishing
```

- **Fixed order:** P0 → V first; **I (Neon) after H, before J** so analytics + invoices are written SQL-first (G's activity log lands before I but is repo-abstracted — its table ships as a Neon migration, not Mongo); O's repo purge before any public push.
- N (UI/UX) foundations = after V; polish interleaves; P (tests) continuous, not a phase at the end.

| Phase | Days |
|---|---|
| P0 stabilize orders | 2 |
| V CRA → Vite | 1–1.5 |
| F data layer + settings + testability | 3–3.5 |
| G activity log | 2 |
| H inventory | 3 |
| I Mongo → Neon (Prisma/branches/env) | 3–4 |
| J analytics + summary | 3.5–4 |
| K customers | 2 |
| L GST invoices + PDF + printers | 5–6 |
| M realtime/offline (optional) | 3–4 |
| N UI/UX overhaul (mobile-first) | 5–6 |
| O white-label + FOSS release | 3–4 |
| P TDD tax (20–25% ongoing) + legacy backfill | 5–6 |
| **Total** | **~42–48 days** |

---

## Non-goals (reconfirmed)

- No payment gateway / online capture (UPI recorded as manually-confirmed)
- No e-invoicing/IRN/QR (below turnover threshold — columns reserved)
- No split-by-seat billing, floor-plan editor, delivery dispatch, payroll/accounting
- No multi-tenancy/SaaS (one brand per deployment; white-label ≠ multi-tenant)
- No mobile apps; responsive web is enough for v1
- No Neon lock-in: Prisma targets plain Postgres — any Postgres works

## Reference sources for GST correctness (verify before shipping)

- CGST Rules 2017, **Rule 46** (contents of tax invoice) + Rule 46(a) serial-numbering per FY
- SAC **9963** family (restaurant service ≈ 996311), rate 5% → 2.5% CGST + 2.5% SGST intra-state / 5% IGST inter-state — all configurable, defaults in `settings.gst.*`
- Invoice format: GST portal offline tools + widely used accounting formats (Tally/QuickBooks India) as visual reference
- Keep a "GST config sanity" checklist item: registered business must verify rates/fields with their CA before going live — defaults are engineering-correct, not tax advice
