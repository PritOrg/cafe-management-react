# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Project status: pre-alpha · in development · name undecided.** There is no
> tagged release yet — everything below is unreleased. See
> [`docs/STATUS.md`](docs/STATUS.md) for remaining work.

## [Unreleased]

### Added
- **Customer storefront**: password-less phone identity, menu browsing with
  search/categories/quick-add, favourites, cart & checkout (dine-in/takeaway),
  order history with status tracking, reorder, and table/QR ordering (`?table=`).
- **Waiter POS** (`/admin/order`) and a **kitchen display** (KDS) with age
  colours, keyboard bump, and new-order chime.
- **GST invoicing** (India, Rule 46): FY-wise numbering, CGST/SGST/IGST,
  HSN/SAC summary, amount in words, frozen `brand_snapshot`; **PDF** (A4/A5/80mm/
  58mm via `pdfkit`), HTML print views, and optional raw ESC/POS.
- **Inventory** with append-only movements and **recipes/BOM** deductions.
- **Analytics** (summary/sales/orders/top-items/category-mix), **customers**
  (derived LTV/favourites/loyalty), and a per-action **activity log**.
- **Realtime** (Socket.IO `/ops`) and an **offline outbox** with idempotent replay.
- **White-label** runtime branding and **multi-tenant** host resolution.
- Material-3-flavoured theme with the self-hosted **Outfit** typeface.
- Self-host tooling: Docker Compose, `docs/self-host.md`, `docs/database.md`.
- `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, issue/PR templates.

### Changed
- Data layer moved to **Knex + Postgres** (works with Neon or any Postgres).
- Image uploads migrated to **Cloudinary**; Firebase removed entirely.
- Brand defaults and copy are **vertical-agnostic** (any restaurant/café).
- Navigation/layout rebuilt; admin shell driven by a single nav config.
- Route-split bundle; main JS ≈ 235 kB (≈ 72 kB gzip).

### Fixed
- ESLint clean (0 problems) across both projects.
- Removed tracked secrets from the working tree and added `.gitignore` rules
  (`server/mail/*.json`, `server/firebase/`, stray browser profiles).

### Security
- The Google OAuth `client_secret_*.json` was previously tracked; it is now
  untracked and ignored. **Git history has not been purged** — rotate and purge
  per [`docs/secrets-rotation.md`](docs/secrets-rotation.md).
