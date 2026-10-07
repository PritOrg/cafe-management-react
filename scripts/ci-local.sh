#!/usr/bin/env bash
# Local CI: lint + test + build for backend and frontend (mirrors .github/workflows/ci.yml)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

export DATABASE_URL="${DATABASE_URL:-postgresql://cafe:cafe@127.0.0.1:5433/cafe}"
export JWT_SECRET="${JWT_SECRET:-ci-local-secret}"
export STORAGE_DRIVER="${STORAGE_DRIVER:-local}"
export DEFAULT_TENANT_SLUG="${DEFAULT_TENANT_SLUG:-cafe1}"

echo "==> Backend lint"
cd "$ROOT/server"
npm run lint

echo "==> Backend migrate + seed"
npm run db:migrate
npm run db:seed

echo "==> Backend tests"
npm test

echo "==> Frontend lint"
cd "$ROOT/cafe-management-sys"
npm run lint

echo "==> Frontend tests"
npm run test:run

echo "==> Frontend build"
CI=true npm run build

echo ""
echo "All CI checks passed ✓"
