# QA matrix (per release, manual)

Run before a release. Device emulation misses safe-area, `100vh`, and input-zoom
bugs — do at least one **real Android + one real iOS** spot check.

## Devices / breakpoints

| # | Width | Device | Notes |
|---|---|---|---|
| 1 | 360px | small Android (base canvas) | every flow must work here first |
| 2 | 390–412px | iPhone (Safari) | safe-area insets, input zoom |
| 3 | 768px | portrait tablet | 2-up grids, condensed tables |
| 4 | 1024px | landscape tablet | admin sidebar rail |
| 5 | 1280px | desktop | multi-column, hover/keyboard |

## Flows (per device)

- **Customer**: browse menu → search/category/favourites → customize → cart →
  details (name/phone/table, dine-in/takeaway) → payment → review → place order
  → confirmation; My Orders → expand bill → reorder.
- **Staff POS**: take order on a table → place; kitchen board status bump.
- **Admin**: orders list (card on phone / table md+) → bulk status; menu item
  create/edit with image; inventory movement; invoice print + PDF.
- **Print**: [`print-matrix.md`](print-matrix.md) (all 6 rows).

## Assertions

- [ ] At **360px** every route: `document.documentElement.scrollWidth <= window.innerWidth` (no horizontal scroll).
- [ ] Bottom nav + sticky cart bar visible/tappable on all customer routes.
- [ ] Admin drawer nav on all admin routes under `lg`; card lists (not shrunken tables) under `md`.
- [ ] Tap targets ≥44×44px; primary actions in the bottom thumb zone.
- [ ] No hover-only affordance (every hover action has a tap equivalent).
- [ ] Four states present: loading (skeleton), empty, error (+retry), success (toast).
- [ ] Light + dark theme both legible; brand contrast (AA) holds.
- [ ] Keyboard-only desktop pass: login → menu → cart → checkout → admin status.
- [ ] Checkout for dine-in requires **no address**; modifier sheet has no mock data.

## Screenshots

Capture per breakpoint into `docs/qa/` and attach to the release PR:
`/` · `/menu` (grid + list) · `/cart` (each step) · `/orders` · `/admin` ·
`/admin/orders` · `/admin/inventory` · an invoice. Include light + dark for `/menu`.

## Lighthouse

Mobile budgets + baseline live in [`lighthouse.md`](lighthouse.md); CI job
`.github/workflows/lighthouse.yml` (non-blocking until ramped).
