# Dependency audit

Snapshot of open security alerts on the default branch. Two sources:
**GitHub Dependabot** (authoritative count: **51 open**) and local
`npm audit` (the directly-resolved subset: **14** = 9 server + 5 frontend — npm
collapses some advisories Dependabot lists individually).

> Severity mix (Dependabot): **1 critical · 27 high · 20 medium · 3 low**.

## Findings by package

| Package | Manifest | Alerts | Worst | Type | Fix version | Recommended action |
|---|---|--:|---|---|---|---|
| `nodemailer` | server | 15 | high | **direct** (`^6.9.14`) | ≥ 9.1.0 / 10.0.6 | upgrade to `^7.0.11` (or latest) — 6.x is EOL for security |
| `multer` | server | 11 | high | **direct** (`^1.4.5-lts.1`) | ≥ 2.3.0 | upgrade to `^2.3.0` (1.x is end-of-line) |
| `tar` | server | 12 | **critical** | transitive (`bcrypt@5` → `@mapbox/node-pre-gyp@1` → `tar@6.2.1`) | ≥ 7.5.21 | upgrade `bcrypt@^6` **or** `overrides.tar=^7.5.21`; build-time only |
| `sharp` | server | 3 | high | **direct** (`^0.33.4`) | ≥ 0.35.5 | upgrade to `^0.35.5` (native rebuild) |
| `react-router` | frontend | 4 | medium | **direct** (`^6.23.1`) | ≥ 6.30.4 / 7.18.0 | upgrade `react-router-dom@^6.30.4`; one advisory needs v7 |
| `@remix-run/router` | frontend | 2 | high | transitive (via react-router) | ≥ 1.23.3 | resolved by the react-router upgrade |
| `sprintf-js` | server | 1 | medium | transitive (`swagger-jsdoc` → `argparse`) | **none** | drop `swagger-jsdoc` for the static `swagger.yaml`, or accept |
| `uuid` | server | 1 | medium | transitive | ≥ 11.1.1 | `overrides.uuid=^11.1.1` or accept (buf-bounds only) |
| `@babel/runtime` | frontend | 1 | medium | transitive | ≥ 7.26.10 | `npm audit fix` (within `^7`) |
| `sweetalert2` | frontend | 1 | low | **direct** (`^11.11.1`) | ≥ 11.22.4 | upgrade to `^11.22.4` |

Counts: 15 + 11 + 12 + 3 + 4 + 2 + 1 + 1 + 1 + 1 = **51**.

## Impact notes

- **High/critical on direct deps** (`nodemailer`, `multer`, `sharp`) are real
  runtime surface: email rendering, multipart uploads, and image processing.
  These are the priority.
- **`tar`** is pulled by `bcrypt`'s installer (`@mapbox/node-pre-gyp`) and is used
  only at install/build time, not in the request path — lower real-world risk, but
  still flagged and worth clearing.
- **`sprintf-js`** has no patched release; it arrives via `swagger-jsdoc`. Since
  the repo already ships a static `server/swagger.yaml`, generating docs from JSDoc
  is optional — removing `swagger-jsdoc` eliminates the dependency entirely.
- **`uuid`** is only vulnerable when a caller passes a `buf` to v3/v5/v6; not
  exercised by this codebase. Low priority; clear via override when convenient.

## Remediation commands (proposed)

```bash
cd server
npm i nodemailer@^7.0.11 multer@^2.3.0 sharp@^0.35.5 bcrypt@^6
# if tar/uuid remain, add to server/package.json:
#   "overrides": { "tar": "^7.5.21", "uuid": "^11.1.1" }
npm audit

cd ../cafe-management-sys
npm i react-router-dom@^6.30.4 sweetalert2@^11.22.4
npm audit fix
```

**Verify after upgrading:** send a test email (Settings → Integrations → Test),
upload a menu image (multipart), and process an image thumbnail — the three major
bumps (`nodemailer` 7, `multer` 2, `sharp` 0.35) can change behavior. `bcrypt` and
`sharp` are native: rebuild under WSL (see `AGENTS.md`).

## Remaining after remediation

- `react-router` advisory **GHSA-wrjc-x8rr-h8h6** is only fixed in **v7** — track
  a v7 migration separately; the other three are fixed by `^6.30.4`.
- `sprintf-js` stays until `swagger-jsdoc` is removed or a patch appears.

_Regenerate this snapshot with `gh api repos/PritOrg/cafe-management-react/dependabot/alerts?state=open`._
