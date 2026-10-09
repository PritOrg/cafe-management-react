# Phase N — UI/UX overhaul (mobile-first) · implementation plan

> **Why this is the next phase.** In the plan's execution order the feature
> phases D–M have landed; the next phase is **N (UI/UX)**, and it is by far the
> least complete — **20 of 35** checkboxes still open (see the per-phase table in
> `STATUS.md`). Phase P (tests) runs continuously and Phase O (release prep) is
> gated on N + the manual QA matrix. This document is the concrete work plan to
> close N. Source of truth remains `IMPLEMENTATION_PLAN.md` §N.

## Goal

Every flow is excellent at **360px** first and degrades gracefully up; admin is
usable at speed on a **tablet**; accessibility and touch are enforced, not
aspirational; no fake data or dead UI ships.

## Already done (do not redo)

Mobile customer shell (`Navbar`/`BottomNav`/`Footer`), admin drawer shell, M3
theme + Outfit, shared primitives (`PageHeader`/`EmptyState`/`ErrorState`/
`LoadingState`), real modifier dialog (full-screen on mobile), checkout without
address, Cloudinary responsive images, lazy routes, PWA manifest/theme-color,
contrast-guarded brand token.

## Workstreams

### N1 — Admin on touch (highest value)
- **Orders/Invoices/Customers tables**: render **card lists under `sm`**
  (status band, table #, items, one primary action); real tables at `md+` with
  **sticky headers** and **pagination (25)**.
- **Filter chips** with live counts (status tabs already count — extend to
  Customers/Invoices/Inventory); **bulk status change** for selected orders.
- Enforce **≥44×44px** tap targets on every action row.
- Files: `pages/admin/AdminOrders.jsx`, `AdminInvoices.jsx`, `AdminCustomers.jsx`,
  `AdminInventory.jsx`; add a shared `components/common/ResponsiveTable.jsx`
  (table at `md`, cards under `sm`) to avoid duplicating per page.
- Stretch (not v1): swipe-to-change-status.

### N2 — Dashboard & charts
- Stat cards **2-up on `xs`, 4-up on `md`**.
- Wrap charts in a horizontally-scrollable container so they never overflow the
  viewport. Files: `pages/admin/AdminDashboard.jsx`, `AdminRevenue.jsx`,
  `AdminAnalytics.jsx`.

### N3 — Remove fake data / dead UI (P1 bugs)
- **AdminSettings**: General / Notifications / Security / Payment tabs render
  hardcoded US/USD stubs — **wire to settings or delete them** (Brand/GST/Print/
  Operations/Integrations are real). File: `pages/admin/AdminSettings.jsx`.
- `AdminMenu` price render — replace `item.price.toFixed(2)` with the real
  `sizes[]`/`{medium,large}` shape via `formatMoney`. File: `pages/admin/AdminMenu.jsx`.
- `AdminRevenue`/`AdminAnalytics` — replace hardcoded `$` with `formatMoney` and
  remove hardcoded growth `0`.
- `AdminStaff` Edit `console.log` stub; dead "forgot password" link in
  `LoginRegisterPage.jsx`.
- **`AdminRoute` guard bug**: uses non-existent `useAuth().isLoading` and role
  `manager`, ignores `isPlatformAdmin`; delete dead `ProtectedRoute.jsx`.
  Files: `components/common/AdminRoute.jsx`, `contexts/AuthContext.jsx`.

### N4 — Four states on every page
Audit each admin + customer page for **loading (skeletons where layout known) /
empty / error (with retry) / success (toast)** using the existing primitives.
Produce a one-page checklist in the PR description.

### N5 — Accessibility & thumb-zone
- **Focus-visible rings**, dialogs trap focus + close on `Esc`, `aria-label` on
  icon-only buttons, `prefers-reduced-motion` respected.
- Screen-reader pass on add-to-cart (live region), cart count, status confirms.
- Primary actions in the **bottom thumb zone** on `xs`; every hover affordance has
  a tap equivalent.
- Files: app-wide; touch MUI `Dialog`/`IconButton`/`Fab` usages.

### N6 — Slow-network UX
Surface `services/api.js` timeout + retry as states (not dead spinners); ensure
skeletons on first paint for menu/orders/dashboard.

### N7 — Desktop (considerate, last)
Keyboard shortcuts (order status `1..5`), denser tables, multi-column dashboard —
**only after** `xs`/`sm` acceptance passes. No desktop-only feature without a
mobile path.

### N8 — QA matrix & screenshots (manual)
- Devices: **360px** Android · 390–412px iPhone (Safari + safe-area) · 768px
  portrait tablet · 1024px landscape · 1280px desktop.
- Flows per device: browse → customize → cart → checkout; admin status change;
  invoice print.
- Screenshots per breakpoint → `docs/qa/`. Lighthouse mobile noted via CI.

## Acceptance (from plan §N)

- `grep -rn "bootstrap" src index.html` → 0.
- At **360px** every flow completes with no horizontal scroll
  (`scrollWidth <= innerWidth` on every route), no clipped totals, no hover-only.
- Bottom nav + sticky cart bar on all customer routes; drawer nav on all admin
  routes under `lg`.
- Dine-in checkout requires no address; modifier sheet has zero mock data.
- Lighthouse mobile **Perf ≥ 85, A11y ≥ 90** (currently 78 / 93 — see
  `docs/lighthouse.md`).
- Keyboard-only pass works desktop: login → menu → cart → checkout → admin status.
- QA screenshots for all 5 breakpoints attached to the PR.

## Order & effort

| Order | Workstream | Est. |
|---|---|---|
| 1 | N3 fake data + P1 bugfixes | 0.5–1 day |
| 2 | N1 admin on touch (ResponsiveTable) | 1.5–2 days |
| 3 | N4 four states | 0.5–1 day |
| 4 | N5 a11y + thumb-zone | 1 day |
| 5 | N2 dashboard/charts | 0.5 day |
| 6 | N6 slow-network | 0.5 day |
| 7 | N8 QA matrix + screenshots | 0.5–1 day |
| 8 | N7 desktop extras | 0.5–1 day |
| | **Total** | **~6–8 days** |

## Risks / notes

- Prefer a **shared `ResponsiveTable`** so card/table behavior is tested once.
- Removing AdminSettings stub tabs may drop fields self-hosters expect; if wired
  instead, they must persist to `settings` and `logActivity`.
- Lighthouse **Perf ≥ 85** is LCP/TBT-bound (client-rendered SPA); if N's polish
  can't reach it, the fallback is prerendering public routes (tracked in
  `docs/lighthouse.md`).
