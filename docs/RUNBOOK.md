# Runbook

## Local development

Requirements: Node.js 22 LTS, pnpm 9, Docker Desktop, Git.

1. `cp .env.example .env.local` and fill local values (no real keys needed; test providers run by default).
2. `docker compose up -d` starts Postgres 16 (5432), Redis (6379), MinIO (9000, console 9001) and Mailpit (inbox at http://localhost:8025).
3. `pnpm install`
4. `pnpm db:migrate` then `pnpm db:seed` (generated sample data only)
5. `pnpm dev` runs web on http://localhost:3000, admin on http://localhost:3001, and the worker.

Reset everything: `docker compose down -v`, then steps 2 to 4.

## Going live (later; hosting decided at deploy)

**Option A, Vercel + Supabase (Singapore):** create staging and production Supabase projects; run migrations against each; connect GitHub to Vercel for `apps/web` and `apps/admin`; set environment variables; run the worker on a small container host.

**Option B, Hostinger VPS:** Docker Compose stack (web, admin, worker, Postgres, Redis) behind Caddy with automatic TLS; files on Cloudflare R2 or S3, not the VPS disk; WAL archiving and nightly dumps to off-server storage; firewall, SSH keys only, automatic security updates; GitHub Actions builds images and deploys over SSH; a second smaller VPS for staging.

## Recurring operations

- Monthly: restore the latest backup into a scratch database and record the result here.
- Quarterly: access review; compliance rule verification per jurisdiction.

## Incident response (summary)

Contain (rotate keys, disable access), assess what data was affected, notify per law (UK GDPR: regulator within 72 hours where required), fix, write a post-incident record in `docs/decisions/`.
