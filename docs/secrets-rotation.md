# Secret purge & rotation runbook

The git history previously contained credentials. **Rotate first, then purge** —
a history rewrite without rotation leaves the leaked value valid.

> **Current state:** secrets have been **untracked from the working tree** and
> `.gitignore`d, but the **history has not been rewritten**. Treat every value
> below as compromised until step 2 is done and step 4 is pushed.

## 1. Inventory

Known sensitive material in history / previously tracked files:

- `.env` files (Atlas/Postgres password, `JWT_SECRET`, old Mongo URI)
- `server/mail/client_secret_*.json` — Google OAuth client secret (**untracked now; still in history**)
- `server/firebase/*.json` — Firebase service-account keys (removed; still in history)
- `server/logs/*.log` — may contain request data (removed; still in history)
- a stray Lighthouse/Chrome profile directory written at repo root on WSL
  (`C:\Users\…\lighthouse.*`, containing cookies/`Login Data`) — untracked + ignored now

## 2. Rotate everything (do this first)

1. Database password → update `DATABASE_URL` everywhere.
2. `JWT_SECRET` → `openssl rand -hex 32`; existing sessions/tokens are invalidated.
3. Google OAuth client secret → regenerate in Google Cloud Console; replace the JSON.
4. SMTP app password / Cloudinary API secret → regenerate.
5. Old Mongo Atlas password → rotate or delete the cluster (the app no longer uses Mongo).

## 3. Stop tracking secrets (keeping local copies)

```bash
# Already applied for the current tree:
git rm --cached server/mail/client_secret_*.json
git rm -r --cached 'C:\Users\*\AppData\Local\lighthouse.*' 2>/dev/null || true
git rm -r --cached server/logs 2>/dev/null || true

# .env is already gitignored; confirm nothing sensitive is tracked:
git check-ignore server/.env cafe-management-sys/.env server/mail/client_secret_*.json
git ls-files | grep -iE '\.env$|client_secret|serviceaccount|firebase|mail/.*json|logs/.*log' # → empty
```

`.gitignore` covers `server/mail/*.json`, `server/firebase/`, `server/logs/`,
`.env`/`.env.*`, and stray `lighthouse.*`/`C:*` profile dumps.

## 4. Purge from history

Use `git filter-repo` (preferred) or BFG. **Coordinate with all collaborators**
— this rewrites commit hashes.

```bash
# install: pip install git-filter-repo
git filter-repo --invert-paths \
  --path server/mail/client_secret_281215278806-cf0avpp4kamislc6cms5g43e8jmgvpp8.apps.googleusercontent.com.json \
  --path server/firebase \
  --path server/logs \
  --path server/.env \
  --path cafe-management-sys/.env

git push --force --all
git push --force --tags
```

Then everyone must re-clone (or `git fetch && git reset --hard origin/main`).

## 5. Verify

```bash
# No secrets should appear in the rewritten history:
git log -p | grep -iE "GOCSPX-|mongodb\+srv|password|clientSecret" | head
grep -rn "GOCSPX-\|tech.developersteam" server --include=*.js   # → 0
```

## 6. Prevent recurrence

- Pre-commit hook or CI secret scan (e.g. `gitleaks`) on PRs.
- Keep `.env.example` (names only) as the committed template.
- Never commit `server/mail/*.json`; load OAuth secrets from env.
