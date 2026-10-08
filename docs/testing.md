# Testing

## Backend (`server/`)

- Runner: **Vitest** (`npm test`, single-shot) against a real Postgres — CI runs a
  `postgres:16` service, migrates + seeds, then runs the suite.
- `server/test/setup.js` sets test env and **refuses a non-local `DATABASE_URL`**
  unless `ALLOW_REMOTE_TEST_DB=true`.
- Coverage: `npm run test:coverage` (v8 provider; thresholds in `vitest.config.js`).
- Throwaway debug scripts (`server/test-*.js`) are not suites.

## Frontend (`cafe-management-sys/`)

- Runner: **Vitest + jsdom** (`npm run test:run`); setup in `vite.config.js`.
- Coverage: `npm run test:coverage` (v8; thresholds in `vite.config.js`).

## CI

`.github/workflows/ci.yml` runs both suites (plus lint + `vite build`) on every PR.
Both projects must report **0 ESLint problems**.

## Not (currently) adopted

- **PGlite in-process DB** — CI already provides a Postgres service; swapping the
  test DB to PGlite would require a Knex/PGlite adapter and rewrite of the DB-backed
  integration tests. Revisit only if Postgres-in-CI becomes a bottleneck.
- **Playwright E2E** — an optional smoke (login → place order) is valuable but needs
  a running API + DB + browsers in CI. Add as a separate, non-blocking job if/when
  we accept the flake/maintenance cost.

## Writing tests

- New behavior: failing test → implement → refactor, in the same PR.
- Prefer testing pure helpers (money math, mappers, parse/format utils) and hooks
  over brittle component snapshots.
