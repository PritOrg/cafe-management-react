# Lighthouse / performance

Mobile-first budgets for the **production build** (not the dev server).

## Budgets (mobile)

| Metric | Budget |
|---|---|
| Performance | ≥ 85 |
| Accessibility | ≥ 90 |
| LCP | < 2.5 s |
| CLS | < 0.1 |
| TBT | < 200 ms |
| Main bundle | ≤ 235 kB (~72 kB gzip) — ratchet down, never up |

CI assertions live in `cafe-management-sys/lighthouserc.cjs` and start as
**`warn`** (non-blocking). Tighten to `error` once the baseline is stable.

## How to run

```bash
cd cafe-management-sys
npm run build
npx --yes @lhci/cli@0.14 autorun        # mobile preset, 3 runs, against vite preview
```

`/menu` only scores real content when the API is running (`VITE_API_URL`).
Admin routes need auth — audit those manually with a saved session.

CI: `.github/workflows/lighthouse.yml` (Postgres service → migrate/seed → API →
build → `lhci autorun`), non-blocking until ramped.

## Applied optimizations

- **Bundle**: route-level `lazy()` for every page; **no component barrel**; deep
  icon imports (no `@mui/icons-material` barrel); `socket.io-client` **lazy-imported**
  (its own chunk, not initial); `@fontsource-variable/outfit` self-hosted.
  *Note:* a blanket `manualChunks` split was tried and **reverted** — it merged
  admin-only MUI/icon code into the initial chunk (234 kB → ~727 kB).
- **Images**: Cloudinary URLs are transformed per-viewport via `utils/cloudinary.js`
  (`f_auto,q_auto,w_…`, `srcset`/`sizes` on menu cards; small sizes for cart thumbs;
  `loading="lazy" decoding="async"`; fade-in on load). Card media boxes reserve
  aspect ratio (`pt:62%`) so images don't shift layout (CLS).
- **Network**: `preconnect`/`dns-prefetch` to `res.cloudinary.com` in `index.html`.
- **First paint**: brand fallback via `VITE_DEFAULT_BRAND_*` so the title/colors
  don't flash before `/settings/public` resolves.
- **PWA-lite**: dynamic manifest + `theme-color` from tenant settings.

## Prioritized backlog (next)

1. Confirm all primary-on-white text uses the readable `theme.brand.primaryText`
   token (WCAG AA) — run the axe/contrast checks.
2. Add `width`/`height` (or aspect-ratio) to any remaining bare `<img>`.
3. Consider `<link rel="preload">` for the Outfit variable font.
4. Re-measure and ratchet budgets; then flip CI assertions to `error`.
5. Optional: Playwright + `@axe-core` for automated a11y on landing/menu/cart.

## Baseline

Latest run — **landing `/`**, production build, Lighthouse 12 default
(mobile emulation + throttling):

| Category / metric | First run | Latest |
|---|---|---|
| Performance | 78 | **81** |
| Accessibility | 93 | **93** |
| FCP | 2.6 s | — |
| LCP | 3.3 s | 3.4 s |
| CLS | **0** | **0** |
| TBT | 420 ms | 350 ms |
| Main bundle | 235 kB (72 kB gzip) | 235 kB (72 kB gzip) |

**Read:** CLS is perfect; A11y clears the bar. Perf is LCP/TBT-bound, which is
inherent to a client-rendered SPA whose first view is JS-rendered and whose JS
ships all of MUI. To push Perf ≥ 85 we need one of (in rough priority):

1. **Reduce main-thread work** — audit the initial MUI surface used on `/`
   (landing is simple: Box/Container/Typography/Stack/Button/Chip/Card); consider
   not mounting providers the landing doesn't need.
2. **Pre-render the landing** (prerender/SSG of the public routes) — biggest LCP
   win for a Vite SPA; larger effort.
3. **Trim the brand fetch** off the critical path (it already has an env fallback).
4. Re-run with `numberOfRuns: 3` and a warmer cache for a steadier number before
   ratcheting the CI assertion to `error`.

