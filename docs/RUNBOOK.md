# Runbook

## Local development

Requirements: Node.js 22 LTS or newer (`.nvmrc` says 22), pnpm 9 (pinned in `package.json`), Docker Desktop, Git.

### First time

1. Install pnpm 9 with Corepack: `corepack enable pnpm`. If that fails with a permission error on `/usr/local/bin`, use a folder in your home directory instead: `corepack enable --install-directory ~/.local/bin pnpm` (make sure `~/.local/bin` is on your `PATH`).
2. Install Docker Desktop and open it once so the engine is running.
3. `cp .env.example .env.local`. The values are local throwaway defaults that match `docker-compose.yml`; no real keys are needed because test providers run by default.
4. `pnpm install`

### Every day

- `pnpm dev` starts the Docker services (and waits until they are healthy), creates the local file bucket, then runs web on http://localhost:3000, admin on http://localhost:3001 and the worker.
- `pnpm services:up` starts only the Docker services; `pnpm services:down` stops them and keeps the data.
- `pnpm db:migrate` and `pnpm db:seed` (generated sample data only) arrive with task 1.4.

### Checks (same as CI)

`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm format:check` (`pnpm format` fixes formatting).

### Local services

| Service | Address on your machine | Login |
| --- | --- | --- |
| Postgres 16 | `localhost:5433`, database `rwos` | `rwos` / `rwos_local_only` |
| Redis | `localhost:6379` | none |
| MinIO (S3 API) | http://localhost:9000, bucket `rwos-local` (private) | `rwos_local` / `rwos_local_only` |
| MinIO console | http://localhost:9001 | same as above |
| Mailpit SMTP | `localhost:1025` | any |
| Mailpit inbox | http://localhost:8025 | none |

These logins only work against your own containers. Never reuse them anywhere else.

Postgres uses host port 5433, not 5432, so it does not clash with a Postgres already installed on the machine (for example Postgres.app). To use another port, set `POSTGRES_HOST_PORT` in your shell or a root `.env` file (Docker Compose reads `.env`, not `.env.local`) and change the port in `DATABASE_URL` in `.env.local` to match. The other ports can be changed the same way: `REDIS_HOST_PORT`, `MINIO_API_HOST_PORT`, `MINIO_CONSOLE_HOST_PORT`, `SMTP_HOST_PORT`, `MAILPIT_UI_HOST_PORT`.

### Reset everything

`pnpm services:reset` deletes all local data (`docker compose down -v`) and starts the services again. Then run the migrations and seed again (from task 1.4).

### Troubleshooting

- **The worker exits with "Invalid or missing environment variables"**: `.env.local` is missing or incomplete. Compare it with `.env.example`.
- **"port is already allocated"**: another program uses that port. Stop it, or change the host port as described above.
- **`docker: command not found`**: Docker Desktop is not installed, or its command-line tools are not on your `PATH`. In Docker Desktop, open Settings, Advanced, and choose to install the CLI tools for the system, or add `export PATH="$PATH:/Applications/Docker.app/Contents/Resources/bin"` to `~/.zshrc`.
- **`pnpm: command not found`** after installing to `~/.local/bin`: add `export PATH="$HOME/.local/bin:$PATH"` to `~/.zshrc` and open a new terminal.

## Going live (later; hosting decided at deploy)

**Option A, Vercel + Supabase (Singapore):** create staging and production Supabase projects; run migrations against each; connect GitHub to Vercel for `apps/web` and `apps/admin`; set environment variables; run the worker on a small container host.

**Option B, Hostinger VPS:** Docker Compose stack (web, admin, worker, Postgres, Redis) behind Caddy with automatic TLS; files on Cloudflare R2 or S3, not the VPS disk; WAL archiving and nightly dumps to off-server storage; firewall, SSH keys only, automatic security updates; GitHub Actions builds images and deploys over SSH; a second smaller VPS for staging.

## Recurring operations

- Monthly: restore the latest backup into a scratch database and record the result here.
- Quarterly: access review; compliance rule verification per jurisdiction.

## Incident response (summary)

Contain (rotate keys, disable access), assess what data was affected, notify per law (UK GDPR: regulator within 72 hours where required), fix, write a post-incident record in `docs/decisions/`.
