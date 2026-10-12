# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Project status: pre-alpha → first beta candidate.** The product **name is
> undecided** ("Restaurant POS" is the working title). This changelog doubles as
> **release notes** for the planned `0.1.0` beta. Remaining pre-release work is
> tracked in [`docs/STATUS.md`](docs/STATUS.md).

## [Unreleased]
- No planned changes beyond the beta candidate contents below.

## [0.1.0] - 2026-10-12 — first beta candidate

### Added
- **Customer storefront**: password-less phone identity, menu browsing (search,
  categories, favourites filter, quick-add), **card/list view toggle**,
  category-grouped sections with a scrollable rail, infinite scroll, cart &
  checkout (Cart → Details → Payment → Review), **promo/discount codes**,
  order history with status tracking, expandable bill + share, reorder, and
  table/QR ordering (`?table=`).
- **Waiter POS** (`/admin/order`) and a **kitchen display** (KDS) with age
  colours, keyboard bump, new-order chime, and column-based tickets.
- **GST invoicing** (India, Rule 46): FY-wise numbering, CGST/SGST/IGST,
  HSN/SAC summary, amount in words, frozen `brand_snapshot`, **monogram
  fallback** when no logo is uploaded; PDF (A4/A5/80mm/58mm via `pdfkit`), HTML
  print views, in-app **print dialog** with paper selector, authenticated
  new-tab print/PDF links, real `download` attachments, and optional raw ESC/POS.
- **Inventory**: append-only movements, recipes/BOM deductions, low-stock +
  reorder alerts with **reorder suggestions**, cost/valuation, supplier,
  per-tenant **on/off toggle** (plus toggles for loyalty and auto-invoicing).
- **Analytics** (summary/sales/orders/top-items/category-mix) with **CSV
  exports**; **customers** (derived LTV/favourites/loyalty); per-action
  **activity log** with **scheduled retention pruning**.
- **Realtime** (Socket.IO `/ops`) and an **offline outbox** with idempotent replay.
- **Admin**: responsive tables (cards on touch, sticky + paginated on desktop)
  with **filters and click-to-sort** on every list, **bulk order status change**.
- **Self-service password change** (profile menu) and admin staff editing.
- **PWA offline app shell** (service worker) for "Add to Home Screen" staff usage.
- **White-label** runtime branding + **multi-tenant** host resolution;
  Material-3 theme with the self-hosted **Outfit** typeface.
- Self-host tooling (Docker Compose, `docs/self-host.md`, `docs/database.md`);
  community files (`CONTRIBUTING`/`SECURITY`/`CODE_OF_CONDUCT`, issue/PR templates);
  plan-driven docs (`STATUS.md`, `phase-n-plan.md`, `dependency-audit.md`,
  `qa-matrix.md`, `per-tenant-customization.md`).

### Changed
- Storage moved to **Knex + Postgres** (Neon or any Postgres); Cloudinary
  uploads; Firebase removed entirely.
- Brand defaults and copy are **vertical-agnostic**.
- Route-split bundle ≈ 235 kB (72 kB gzip); responsive + sorting/filtering UI.
- Dependency baselines raised (`nodemailer` 10, `multer` 2, `bcrypt` 6,
  `react-router-dom` 7).

### Removed
- Unused deps: `sharp`, `swagger-jsdoc`, `google-auth-library`, `yamljs`,
  `firebase-admin`, `mongodb`; dead UI stubs (non-persisted Settings tabs,
  `ProtectedRoute`); fake analytics/`$` hardcodes.

### Fixed
- Cart-page crash (`theme.palette.neutral[300]`), stale cart items at checkout,
  print/PDF 404s (frontend-origin links), missing `401` auth on new-tab links.
- ESLint clean (0 problems) across both projects; every merged PR green on CI.

### Security
- All **51 open Dependabot alerts cleared** (`npm audit` 0/0 on both projects).
- **Git history purged** of secrets (`git filter-repo` + force-push) — rotate any
  live credentials per [`docs/secrets-rotation.md`](docs/secrets-rotation.md).
- CI enforces **coverage floors** (server 64/48/64/66, frontend 54/56/57/56,
  non-blocking) and Lighthouse budgets.

### Known limits (beta)
- Gifted checkout is **phone-only** — invoice-PDF-by-email is deferred (no email
  capture yet); payments are manually confirmed (no gateway).
- Print matrix + device QA are manual release gates (`docs/qa-matrix.md`).
- Product name and logo assets remain undecided/demo.