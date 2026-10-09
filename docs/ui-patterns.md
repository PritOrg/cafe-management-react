# UI patterns

Mobile-first (design at **360px**, scale up). MUI v5 is the component library —
use it directly. The old `components/ui/*` Button/Card/Modal/Input wrappers were
**deleted**; only the providers remain there.

## Shared primitives (`src/components/common/`)

| Component | Use it for |
|---|---|
| `PageHeader` | Every page title: `icon`, `title`, `subtitle`, `actions` |
| `EmptyState` | Zero-data screens: tonal icon disc + message + optional action |
| `ErrorState` | Fetch failures; always offer a **Retry** |
| `LoadingState` | Full/section loading (skeletons where layout is known) |
| `ErrorBoundary` | Wrap subtrees that can throw during render |
| `CustomerSignInDialog` | Lazy-loaded phone capture (customer identity) |

Prefer these over bespoke headers/empties so pages stay consistent.

## Providers (`src/components/ui/`)

`ToastProvider` (`useToast`), `LoadingProvider` (`GlobalLoading`),
`ConfirmProvider` (`useConfirm`). These are the only exports left in `ui/`.

## Theming & brand

- `utils/m3Theme.js` — `buildTheme(mode, primarySeed, accentSeed)` produces a
  Material-3-flavoured theme (tonal surfaces, filled buttons, pill list items,
  nav-bar active indicator). The typeface is **Outfit** (self-hosted).
- Brand tokens: `theme.brand = { primary, onPrimary, primaryText, accent }`.
  Use **`brand.primaryText`** for brand-colored text on light surfaces (contrast
  guarded by `ensureContrast`); use the bright fill for solid surfaces.
- Dark mode: `contexts/ThemeContext` → `{ mode, isDarkMode, toggleMode, setThemeMode }`,
  persisted to `localStorage.themeMode`, follows the system until set.

## Rules

- **Icons**: import deep paths only — `import MenuIcon from '@mui/icons-material/Menu'`.
  Never `import { Menu } from '@mui/icons-material'` (pulls the whole barrel).
- **No `process.env` / `REACT_APP_*`** in `src/` — use `import.meta.env.VITE_*`.
- **Money**: display via `utils/formatMoney.js`; never float math on currency in the UI.
- **No component barrel** — import components by path.
- **States**: every data page should handle loading, empty, error (with retry),
  and success (toast). Use the primitives above.
- **Counts** (cart, low-stock, status tabs) come from live context/API — no
  hardcoded badges.
