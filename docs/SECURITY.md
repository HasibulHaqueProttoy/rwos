# Security

Target: OWASP ASVS level 2, and SOC 2 ready (controls designed in from day one).

## Access

- Staff: email + two-factor (TOTP or passkey) required; sessions expire after 12 hours of inactivity.
- Customers: passwordless email code or Google; optional two-factor.
- Every server action and route checks a named permission (`packages/auth`), never a role name.
- Row-level security on all customer tables; the app connects with a role that cannot bypass it.
- Partner users see only cases assigned to them.
- Quarterly access review screen; offboarding disables a user in one action and reassigns their tasks.

## Data

- TLS everywhere; encryption at rest for the database, backups and files.
- Field-level encryption (AES-256-GCM, key from the secret store) for ID numbers, tax IDs and integration keys.
- Files are private; access only by signed URLs valid for 5 minutes; every KYC view logged.
- Retention: KYC and filing records kept 5 years after the relationship ends in a locked archive, then deleted; billing records 6 years; see the spec's data protection section.
- No personal data in URLs, logs, analytics or error reports (scrub before sending to Sentry).

## Application

- Zod validation on every input; parameterised queries only (Drizzle).
- CSRF protection on mutations; strict Content Security Policy; secure, httpOnly, sameSite cookies.
- Rate limits on login, checkout, public forms and webhook routes.
- File uploads: type and size allow-lists, virus scan hook, never served from the app domain.
- Webhooks: signature verification, idempotency, replay protection.

## Engineering

- Secrets only in the hosting secret store and local `.env.local` (git-ignored). `.env.example` lists every secret and provider key by name only, with no value. The one exception is throwaway local defaults that only work against the developer's own Docker containers (localhost URLs, the local Postgres and MinIO logins in `docker-compose.yml`); these are not secrets and are prefilled so `cp .env.example .env.local` works.
- Dependency and secret scanning on every pull request; no merge with high-severity findings. Dependencies: `pnpm audit --audit-level high` in CI plus weekly Dependabot updates. Secrets: Gitleaks over the full git history in CI; reviewed false positives go in `.gitleaksignore` by fingerprint. CI actions are pinned to commit SHAs and the workflow token is read-only (see `docs/decisions/0003-ci.md`).
- Two human reviewers for changes to auth, payments, documents, permissions, encryption.
- No real customer data outside production; staging uses generated data.
- Daily backups, point-in-time restore, monthly restore test recorded in `RUNBOOK.md`.
- Outside penetration test before public launch; written incident response plan in `RUNBOOK.md`.
