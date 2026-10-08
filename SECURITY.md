# Security Policy

## Supported versions

This project is under active development on `main`. Security fixes land on `main`
and are released from there.

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Report privately by emailing the maintainers or using GitHub's
"Report a vulnerability" (Security → Advisories) on the repository. Include:

- a description and impact,
- steps to reproduce (proof of concept if possible),
- affected version/commit,
- any suggested fix.

We aim to acknowledge within a few days and will coordinate a fix and disclosure
timeline with you.

## Secrets & configuration

- Never commit credentials. `.env` files, `server/logs/`, and `server/mail/*.json`
  are untracked; keep them that way.
- Cloudinary credentials live only in `server/.env`
  (`CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`).
- If you believe a secret was committed, rotate it immediately and treat the
  value as compromised — history rewrites alone are not sufficient.

## Hardening notes for self-hosters

- Set a strong, unique `JWT_SECRET`.
- Run behind TLS and set `CORS_ORIGINS` / `PUBLIC_DOMAIN` for your deployment.
- Keep `NODE_ENV=production` in production (enables stricter rate limits and errors).
- Restrict database network access to the application.
