# Project status & remaining work

> **Status: pre-alpha · in development · product name undecided.**
> This is the live companion to [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md).
> The plan is a historical document; **this file reflects what is actually in the
> repo**. A checked plan box means the work landed — not that it is verified on
> real hardware or ready to ship.

## Where we are

The full feature surface described by the plan exists in code and passes the
automated gates: **backend 31 Vitest files**, **frontend 22 Vitest files**, both
projects lint clean, `vite build` succeeds, and CI (Postgres + migrate + seed +
lint + tests + build + Lighthouse) is green on `main`.

Implemented end-to-end:

- **Order pipeline** — canonical line contract, server-side pricing, status
  machine (`pending → preparing → ready → served | cancelled`), phone-based
  customer identity, offline outbox with idempotent replay.
- **Menu & modifiers** — categories, sizes, real modifier groups, favourites,
  Cloudinary images, per-item GST (`sac_code` / `gst_rate_bps`), `subtract_stock`.
- **Inventory** — items, movements (append-only), recipes/BOM deductions,
  low-stock derivation + realtime `stock:low`.
- **GST invoicing** — Rule 46 engine, FY-wise numbering, CGST/SGST/IGST,
  HSN/SAC summary, amount in words, `brand_snapshot`; **PDF** (A4/A5/80mm/58mm)
  via `pdfkit`; HTML print views; optional ESC/POS.
- **Analytics** — summary / sales / orders / top-items / category-mix (SQL).
- **Customers** — list, derived summary (LTV, favourites), loyalty, soft delete.
- **Activity log** — per-action audit trail, filters, per-entity history, CSV.
- **Realtime** — Socket.IO `/ops` (JWT, per-tenant rooms), KDS board.
- **White-label** — runtime brand/colors/title/favicon/manifest; settings tabs.
- **Multi-tenant** — host-based subdomain resolution, platform admin, `/admin/tenants`.
- **Self-host** — Docker Compose, `docs/self-host.md`, Knex migrations + seed.

## Remaining before a first release (prioritized)

### P0 — must do
0. **Clear dependency security alerts.** **51 open** Dependabot alerts
   (1 critical, 27 high) — mostly fixable by bumping `nodemailer`, `multer`,
   `sharp`, `bcrypt`/`tar`, `react-router-dom`, `sweetalert2`. Full breakdown +
   commands: [`dependency-audit.md`](dependency-audit.md).
1. **Rotate + purge leaked secrets.** See [`secrets-rotation.md`](secrets-rotation.md).
   The Google OAuth `client_secret_*.json` was tracked (now `git rm --cached`) and
   old commits still contain `.env`, Firebase service-account keys, and logs.
   **Rotate every credential, then rewrite history and force-push.** Until then,
   treat all of them as compromised.
2. **Manual verification on real hardware / devices** (nothing here is
   machine-tested):
   - Print matrix — all 6 rows in [`print-matrix.md`](print-matrix.md).
   - Two-browser realtime (new order appears in both without refresh).
   - Offline → queue 2 orders → online → both appear exactly once.
   - Fresh-clone self-host walkthrough (`docs/self-host.md`) on a clean machine.
3. **Decide the product name.** Currently inconsistent: `README` says
   "Cafe Management System", the app title says "Restaurant Management", the API
   says "Restaurant POS API", and the frontend package is `cafe-management-sys`.
   Pick one and update: `README`, `LICENSE`, both `package.json`s, `index.html`,
   `manifest.json`, `swagger.yaml`, `docs/*`, `.env.example` defaults.

### P1 — should do before beta
> The next full phase is planned in [`phase-n-plan.md`](phase-n-plan.md)
> (mobile-first UI/UX: admin-on-touch tables, four states, a11y, QA matrix).
> The UI items below are folded into that plan.

4. **AdminSettings fake tabs** — General / Notifications / Security / Payment
   render hardcoded US/USD defaults and never persist. Either wire them to
   settings or remove them. (Their `America/New_York` / `USD` / `+1 (555)…`
   placeholders are misleading for an India-GST product.)
5. **AdminRoute guard bug** — reads `useAuth().isLoading` (the context exposes
   `loading`), checks role `manager` (backend only has `staff`/`admin`), and
   ignores `isPlatformAdmin`. `ProtectedRoute.jsx` is dead code.
6. **`AdminMenu` price render** — calls `item.price.toFixed(2)` while the API
   returns a `{medium,large}` / `sizes[]` object; verify/fix the display.
7. **Currency strings** — `$` is hardcoded in `AdminRevenue` / `AdminAnalytics`
   and growth fields are hardcoded `0`; route everything through `formatMoney()`.
8. **Dead/stub UI** — `AdminStaff` Edit is a `console.log`; the login
   "forgot password" link is dead.
9. **Activity retention** — wire `scripts/prune-activity.js` to a scheduler.
10. **License scan** — run `npx license-checker-rseidelsohn --production`.

### P2 — polish / later
11. **Activity log acceptance** — assert an end-to-end order produces ≥5 rows,
    and that no auth request body stores a password.
12. **Coverage ratchet** — per-area floors (services/utils/repos 85%, etc.) and
    the global 70–80% target are configured but not all met yet.
13. **Component states** — standardize loading/empty/error/success on every
    admin + customer page (primitives exist; not uniformly applied).
14. **QA screenshots** per breakpoint (360 / 390 / 768 / 1024 / 1280) in `docs/qa/`.
15. **Optional**: attach invoice PDF to confirmation email (flag-gated); raw
    ESC/POS "test print" button; `daily_sales` rollups only if summaries slow.
16. **Lighthouse** — Perf is LCP/TBT-bound (~78 mobile). Prerender the public
    routes / trim the initial MUI surface to approach ≥ 85 (see `docs/lighthouse.md`).

## Explicitly out of scope (reconfirmed)

No payment gateway, no e-invoicing/IRN/QR, no split-by-seat billing, no
floor-plan editor, no delivery dispatch, no payroll/accounting, no native mobile
apps. One brand per deployment (white-label ≠ multi-tenant SaaS).

## How status is tracked

- **Code is the source of truth** over this file and the plan.
- Update this file in the same PR as any work that changes the above.
- Anything requiring a human on real hardware stays here until someone ticks it.
