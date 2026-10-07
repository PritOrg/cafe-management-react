#!/usr/bin/env bash
# Local verify = lint + tests + build (coverage-aware where configured)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
export DATABASE_URL="${DATABASE_URL:-postgresql://cafe:cafe@127.0.0.1:5433/cafe}"
export JWT_SECRET="${JWT_SECRET:-verify-secret}"
export STORAGE_DRIVER="${STORAGE_DRIVER:-local}"

echo "==> Backend lint + test"
cd "$ROOT/server"
npm run lint
npm test

echo "==> Frontend lint + test + build"
cd "$ROOT/cafe-management-sys"
npm run lint
npm run test:run
CI=true npm run build

echo ""
echo "verify passed ✓"
