# Contributing

Thanks for helping improve the Cafe/Restaurant Management System! This repo is
free and open source (MIT) and self-hostable.

## Repo layout

Two independent npm projects (no workspace tooling):

- `cafe-management-sys/` — React 18 + Vite 8 frontend (MUI v5, React Router v6)
- `server/` — Express 4 + Knex/Postgres API

The root `package.json` is intentionally empty.

## Getting set up

Backend:

```bash
cd server
cp .env.example .env      # fill DATABASE_URL + JWT_SECRET (Cloudinary/SMTP optional)
npm install
npm run db:migrate && npm run db:seed
npm run dev               # http://localhost:4969
```

Frontend:

```bash
cd cafe-management-sys
cp .env.example .env      # VITE_API_URL=http://localhost:4969/api/v1
npm install
npm start                 # http://localhost:3000
```

## Before you open a PR

Run the same gates CI runs:

```bash
# Frontend
cd cafe-management-sys && npm run lint && npm run test:run && npm run build

# Backend
cd server && npm run lint && npm test   # tests need a local Postgres
```

Both projects must report **0 ESLint problems**.

## Guidance

- **Tests first** for new behavior: write a failing test, implement, refactor — in the same PR.
- Keep the backend vertical-agnostic: no café-only assumptions; categories/branding come from tenant settings.
- Money is minor units (`server/utils/money.js`); never do float math on currency in the UI.
- Import MUI icons as deep paths (`@mui/icons-material/Menu`), never the barrel.
- Frontend env vars must be `VITE_*` via `import.meta.env` (`process.env` is banned in `src/`).
- Prefer the shared primitives (`PageHeader`, `EmptyState`) over bespoke headers.
- Don't commit secrets. `.env` files, `server/logs/`, and `server/mail/*.json` are untracked.

## Commit style

Short imperative subject, e.g. `fix(orders): reject zero-quantity lines`.
Scope in parentheses where helpful (`feat`, `fix`, `chore`, `docs`, `test`, `refactor`).

## Reporting bugs / requesting features

Use the GitHub issue templates. For security issues, see [`SECURITY.md`](SECURITY.md).
