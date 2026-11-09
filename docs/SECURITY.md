# Security

Target: OWASP ASVS level 2, and SOC 2 ready (controls designed in from day one).

## Access

- Staff: email + two-factor (TOTP or passkey) required; sessions expire after 12 hours of inactivity.
- Customers: passwordless email code or Google; optional two-factor.
- How it is built (`packages/auth`, decision 0007): nobody has a password. Everyone signs in with a 6-digit code emailed to them (valid 5 minutes, 3 tries, stored hashed). Staff must then enter an authenticator-app code (TOTP); until they set one up, the admin allows nothing but two-factor setup. Staff cannot turn two-factor off or "trust a device". Staff accounts are created by an admin, never by signing in, and the admin never emails a code to, or reveals, an address that is not active staff. Passkeys arrive with the admin sign-in screen (task 1.11).
- Every session is stamped with the app that made it (admin or customer); a session from one app is refused by the other, even with the cookie renamed.
- Customer sessions end after 7 days of inactivity.
- Sign-in rate limits per IP address: 3 code requests, 5 code checks and 5 two-factor checks a minute. Requests from other websites are refused (origin check).
- Two-factor secrets, backup codes and OAuth tokens are encrypted with `AUTH_SECRET` (one value shared by both apps, kept in the secret store).
- Every server action and route checks a named permission (`packages/auth`), never a role name. `authorize(auth, db, headers, ...permissions)` is the gate: it requires a fully signed-in staff member (two-factor done) whose role holds every permission asked for, reads permissions fresh on each request (a change in the admin applies at once), and refuses with a reason (signed out, two-factor setup needed, or the missing permission). `can()` only hides controls.
- The permission catalogue and the default role table are in `packages/core/src/identity`; the role table follows the PRD and decision 0008 (operations see only assigned cases; sales see invoice status read-only; founders and operations edit compliance rules; support and founders may view as a customer). Only founders approve refunds, discounts above the limit, payout recipients and prices, and manage staff and roles.
- Deactivating a staff member ends all their sessions at once.
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
- No real customer data outside production; local development, CI and release rehearsals use generated data only.
- Daily backups, point-in-time restore, monthly restore test recorded in `RUNBOOK.md`.
- Outside penetration test before public launch; written incident response plan in `RUNBOOK.md`.
