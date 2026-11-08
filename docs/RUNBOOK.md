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
- `pnpm db:migrate` applies new migrations (safe to run any time; it does nothing when the database is up to date).
- `pnpm db:seed` loads reference data plus generated sample data (never real customers; refused in production). `pnpm db:seed:reference` loads reference data only (roles, prices) and is the one to use in production.
- `pnpm test:integration` runs the database tests; each test file creates and deletes its own throwaway database on your local Postgres.
- Changing the schema: edit the tables in `packages/db/src/schema/`, run `pnpm db:generate`, review the new SQL file in `packages/db/migrations/`, then `pnpm db:migrate`. See `packages/db/README.md`.

### Design system

- `pnpm --filter @rwos/ui tokens:build` regenerates the token CSS and logo paths after a change in `packages/ui/tokens/`.
- http://localhost:3001/design-system shows every shared component in both themes (development only).

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

`pnpm services:reset` deletes all local data (`docker compose down -v`) and starts the services again. Then run `pnpm db:migrate` and `pnpm db:seed` again.

### Troubleshooting

- **The worker exits with "Invalid or missing environment variables"**: `.env.local` is missing or incomplete. Compare it with `.env.example`.
- **"port is already allocated"**: another program uses that port. Stop it, or change the host port as described above.
- **`docker: command not found`**: Docker Desktop is not installed, or its command-line tools are not on your `PATH`. In Docker Desktop, open Settings, Advanced, and choose to install the CLI tools for the system, or add `export PATH="$PATH:/Applications/Docker.app/Contents/Resources/bin"` to `~/.zshrc`.
- **`pnpm: command not found`** after installing to `~/.local/bin`: add `export PATH="$HOME/.local/bin:$PATH"` to `~/.zshrc` and open a new terminal.

## Continuous integration (GitHub Actions)

`.github/workflows/ci.yml` runs on every pull request and every push to `main`. All four jobs must pass before merging.

| Job | What it checks | Run it locally |
| --- | --- | --- |
| Lint, typecheck, test, build | `pnpm lint`, `typecheck`, `test`, `build`, `format:check` on Node 22 | the same commands |
| Migrations and database tests | `docker-compose.yml` is valid; every schema change has a migration; `pnpm db:migrate`, `pnpm db:seed`, then `pnpm db:migrate` again (must change nothing) on an empty Postgres 16; `pnpm test:integration`, including the data model convention check | `pnpm services:reset`, then the same commands |
| Dependency audit | No high or critical advisories in any dependency | `pnpm audit --audit-level high` |
| Secret scan | Gitleaks over the full git history | see below |

Secret scan locally (needs Docker):

```
docker run --rm -v "$PWD:/repo" -w /repo --entrypoint sh ghcr.io/gitleaks/gitleaks:v8.30.1 -c 'git config --global --add safe.directory /repo && gitleaks git . --redact --verbose'
```

When a job fails:

- **Format check**: run `pnpm format` and commit.
- **Dependency audit**: update the package (or wait for the Dependabot pull request). If no fix exists yet, record the risk and the plan in `docs/decisions/` before merging; never silence the check.
- **Secret scan**: if the finding is a real secret, rotate it first (it is already in git history), then remove it. If it is a false positive, add its fingerprint (printed by Gitleaks) to `.gitleaksignore` with a one-line reason.

Dependabot (`.github/dependabot.yml`) opens weekly update pull requests for npm packages, GitHub Actions and the Docker images in `docker-compose.yml`. Workflow actions are pinned to commit SHAs; Dependabot updates the SHA and the version comment together.

Recommended repository setting (once, by an admin): Settings, Branches, add a rule for `main` that requires the four CI checks to pass and at least one review before merging.

## Environments and going live

Build, test and preview locally and on GitHub; production is a Hostinger VPS (decision 0004). There is no staging server.

- **Local:** Docker services plus `pnpm dev`, generated data only.
- **GitHub Actions:** every pull request runs the CI checks against a fresh database.
- **Release rehearsal (before each production deploy):** build the production Docker images and run them locally against generated data (task 1.13 adds this).

**Production, Hostinger VPS (set up in Milestone 5):** Docker Compose stack (web, admin, worker, Postgres, Redis) behind Caddy with automatic TLS; files on Cloudflare R2 or S3, not the VPS disk; WAL archiving and nightly dumps to off-server storage, with a monthly restore test; firewall, SSH keys only, automatic security updates; GitHub Actions builds the images and deploys over SSH. On a VPS the team owns operating system updates, intrusion blocking, disk encryption, certificate renewal and recovery from a failed server, and keeps the evidence for SOC 2.

## Recurring operations

- Monthly: restore the latest backup into a scratch database and record the result here.
- Quarterly: access review; compliance rule verification per jurisdiction.

## Incident response (summary)

Contain (rotate keys, disable access), assess what data was affected, notify per law (UK GDPR: regulator within 72 hours where required), fix, write a post-incident record in `docs/decisions/`.
