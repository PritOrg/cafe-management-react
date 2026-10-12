# Testing

> Status: pre-alpha. Coverage is below the plan's 70–80% target; the ratchet is
> tracked in [`STATUS.md`](STATUS.md).

## Backend (`server/`)

- Runner: **Vitest** (`npm test`, single-shot) against a real Postgres — CI runs a
  `postgres:16` service, migrates + seeds, then runs the suite. **31 test files.**
- `server/test/setup.js` sets test env and **refuses a non-local `DATABASE_URL`**
  unless `ALLOW_REMOTE_TEST_DB=true`.
- Coverage: `npm run test:coverage` (v8 provider; thresholds in `vitest.config.js`).
- Throwaway debug scripts (`server/test-*.js`) are not suites.

## Frontend (`cafe-management-sys/`)

- Runner: **Vitest + jsdom** (`npm run test:run`); setup in `vite.config.js`.
  **22 test files** covering utils, adapters, contexts, hooks, and key services.
- Coverage: `npm run test:coverage` (v8; thresholds in `vite.config.js`).

## Coverage ratchet (Phase P)

- Floors are **configured** in `vitest.config.js` / `vite.config.js` but not yet
  enforced as CI fail-gates (the v8 reporter is unreliable on the WSL `D:` mount,
  so a local measurement isn't trustworthy).
- CI runs a **non-blocking `coverage` job** (`.github/workflows/ci.yml`) on native
  Linux: backend (`npm run test:coverage` against the Postgres service) + frontend
  (`npx vitest run --coverage`), prints the v8 table, uploads `coverage/` reports
  as the `coverage-reports` artifact.
- **Baseline (fill from the latest job artifact)**: server Stmts / Branch / Funcs /
  Lines ≈ _%_; frontend ≈ _%. After 2–3 stable runs, enable the thresholds as
  fail-gates (`--coverage.thresholds.*`) and ratchet upward.

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
