# Per-tenant customization (food · convenience · branding)

Each restaurant is a **tenant** resolved from the request Host/subdomain
(`cafe2.app.com` → slug `cafe2`; bare `localhost` → `DEFAULT_TENANT_SLUG`). All
of the following are tenant-scoped — switching subdomain changes the whole
product experience. Source of truth: the settings row (tenant-scoped) plus the
tenant's own menu data; nothing is baked into code.

## Food (menu & catalog)

All rows carry `tenant_id`:

- **Menu items** (`menu_items`): title, subtitle, description, category,
  sizes (flexible), `substract_stock`, per-item GST (`sac_code`,
  `gst_rate_bps`), images (Cloudinary), availability.
- **Categories, modifier groups/options, recipes/BOM, tables, discounts** — all
  per tenant.
- Cart/ordering, favourites, order history are per tenant (phone identity is
  scoped to the tenant's `customers`).

Admin entry points: _Menu Items / Categories / Modifiers / Inventory (recipes)_
under `/admin`.

## Convenience (operations & printing)

`settings` (`GET/PUT /settings`, admin):

- **ops**: `currency`, `timezone` (business day boundaries for analytics),
  `activity_retention_days`, `printer_host`.
- **print**: `default_paper` (`a4|thermal80|thermal58`) — the per-device default
  is remembered per browser (`localStorage.printPaper`).
- **gst**: legal name/address/GSTIN/state code, `hsnSAC`, `invoicePrefix`,
  `fyStartMonth`, `bps`.
- Integrations: **SMTP** (brand-aware emails) and **Storage** (Cloudinary vs
  local disk).

Admin entry point: _Settings_ tabs (Brand / GST / Printing / Operations / SMTP /
Storage).

## Branding (white-label)

Runtime, not hardcoded:

- `settings.brand`: `title`, `logoUrl`, `primaryColor`, `accentColor` → applied
  to `document.title`, `theme-color`, favicon, the PWA manifest, the MUI theme
  (contrast-guarded `brand.primaryText`), email signatures, and invoices/receipts.
- **Invoices freeze a `brand_snapshot`** at issue time — later brand changes
  never rewrite past bills.
- Build-time fallback for first paint: `VITE_DEFAULT_BRAND_NAME` /
  `VITE_DEFAULT_PRIMARY_COLOR` / `VITE_DEFAULT_ACCENT_COLOR`.

Admin entry point: _Settings → Brand_ (with a live preview strip).

## Example

`cafe2.localhost:3000` fetches the API at `cafe2.localhost:4969`; the server
resolves tenant `cafe2`, serving that tenant's menu, settings-driven
convenience/print/email config, and its own branding. Verified by
`services/api.tenant.test.js` (slug → API host) and the per-tenant
`/menu` + `/settings/public` responses.