# Cafe Management System — Frontend

React 18 SPA (MUI v5, React Router v6) for the cafe POS. Backend lives in `../server` (Express, port **4969**).

## Setup

```bash
npm install
```

`.env` (committed in this repo) must contain:

```
VITE_API_URL=http://localhost:4969/api
```

Only `VITE_*` variables are exposed to the browser (`import.meta.env.VITE_*`). Never use `process.env` in `src/`.

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Vite dev server on **http://localhost:3000** (strictPort — backend CORS only allows 3000/3001) |
| `npm run build` | Production build to `build/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Vitest watch mode |
| `npm run test:run` | Single Vitest run (CI) |

## Lint

```bash
npx eslint src --ext .js,.jsx
```

Config lives in `package.json` → `eslintConfig` (ESLint 8, eslintrc format).

## Notes

- API responses use the `{ success, message, data?, timestamp }` envelope — unwrap with `unwrap()` from `src/services/api.js`.
- All HTTP calls go through `src/services/api.js` (injects the Bearer token from `sessionStorage`).
- This project was migrated from Create React App to Vite (see `docs/IMPLEMENTATION_PLAN.md`, Phase V).
