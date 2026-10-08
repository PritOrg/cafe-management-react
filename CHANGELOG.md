# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Customer storefront: password-less **phone identity**, real **order history**,
  **Reorder**, order **status tracking**, **favourites**, and table/QR ordering (`?table=`).
- Menu item **edit** with image replacement (old Cloudinary asset is deleted).
- Printable GST invoices (A4/A5/thermal PDF + HTML + ESC/POS), inventory/recipes,
  kitchen display, analytics, activity log, white-label branding.
- Material 3-flavoured theme with the self-hosted **Outfit** typeface.
- `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, issue/PR templates.

### Changed
- Image uploads fully migrated to **Cloudinary** (Firebase removed).
- Brand defaults and copy are **vertical-agnostic** (any restaurant/café).
- Top navigation and layout rebuilt; admin shell driven by a single nav config.
- Main bundle ~225 kB (69 kB gzip) via lazy routes, a per-session menu cache, and
  removal of the component barrel.

### Fixed
- Menu/order API wiring (availability toggle, image fields, `/api/v1/health`).
- `db/knexfile.js` now loads `server/.env`, so `db:migrate`/`db:seed` use the right database.
- ESLint clean (0 problems) across both projects.
