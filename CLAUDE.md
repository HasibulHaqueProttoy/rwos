# Rocket Wave OS (rwos): rules for every session

Rocket Wave is a Global Business OS: company formation and compliance for the US (all 50 states + DC), UK, UAE Free Zone and Bangladesh, plus paid add-on modules. Contracting entity: Rocket Wave Inc. It is a SaaS platform, not a law firm or tax firm. Filings are done manually by the operations team and partners; the software tracks, guides and records everything.

Read these before writing code, in this order:

1. `docs/PRD.md`: what we are building and for whom
2. `docs/ARCHITECTURE.md`: structure, modules, plug-in points
3. `docs/DATA_MODEL.md`: every table and the database rules
4. `docs/SECURITY.md`: non-negotiable security rules
5. `docs/DESIGN_SYSTEM.md`: tokens and UI rules
6. `docs/BUILD_PLAN.md`: the current milestone and its task order

## Stack (do not change without a decision record)

- TypeScript (strict) everywhere; pnpm workspaces + Turborepo monorepo
- `apps/web`: customer PWA, Next.js App Router (app.rocketwave.co)
- `apps/admin`: staff admin, Next.js App Router (admin.rocketwave.co)
- PostgreSQL 16 + Drizzle ORM; migrations only through drizzle-kit
- Better Auth for login (inside the app, provider-independent)
- Tailwind CSS + shadcn/ui components, themed only from design tokens
- Zod for every input boundary
- Background jobs behind the `JobQueue` interface (BullMQ + Redis locally)
- File storage behind the `FileStorage` interface (S3-compatible; MinIO locally)
- Tests: Vitest (unit, integration), Playwright (end to end)
- Hosting is undecided (Vercel + Supabase, or a Hostinger VPS). Never use a feature that only works on one of them.

## How to work

1. Work on the current milestone in `docs/BUILD_PLAN.md`, one task at a time, in order.
2. Before coding a task, restate the plan in a few lines: files, tables, tests.
3. Database first: schema, migration, seed, then domain logic, then API, then UI, then tests.
4. Keep every change small enough to review. One task = one branch = one pull request.
5. When a requirement is unclear or the docs disagree, stop and ask. Never guess business rules (prices, fees, deadlines, refund rules, permissions).

## Definition of done (every task)

- `pnpm lint`, `pnpm typecheck`, `pnpm test` all pass; migrations apply on a fresh database and the seed runs
- New logic touching money, dates, permissions or compliance has unit tests
- Docs updated in the same change: `DATA_MODEL.md` for schema, `INTEGRATIONS.md` for plug-ins, module README for behaviour, a decision record for any architecture choice
- No secret, real customer data, passport or ID in code, tests, seeds, logs or commits
- `BUILD_PLAN.md` task ticked

## Hard rules

- **Config, not code:** prices, government fees, jurisdiction steps, compliance rules, payment channels, reminder timings and permissions live in database tables edited from the admin. Never hard-code them.
- **Money:** integers in minor units (cents, poisha) plus a currency column. Never floats. Every order stores a price snapshot.
- **Ledger:** append-only. Never update or delete a ledger entry; reverse it with a new entry.
- **Time:** store UTC (`timestamptz`); display in the viewer's time zone; compliance deadlines are calculated in the authority's time zone.
- **Tenancy:** every customer-owned row carries `workspace_id`; every query is scoped by it, and row-level security enforces it.
- **External services:** only through the interfaces in `packages/integrations`. Each has a test provider that works without keys. Never call a provider SDK from app code.
- **Webhooks:** verify the signature, store the raw event, ignore duplicates, process in a background job.
- **Audit:** every change to money, permissions, KYC documents, prices or compliance rules writes an `audit_log` row.
- **Sensitive data:** ID and tax numbers encrypted at field level; documents only through short-lived signed URLs; never put personal data in URLs or logs.
- **UI:** only design tokens (no raw hex, no magic spacing); sentence case; one primary action per screen; every status badge has text, never colour alone; WCAG 2.2 AA.
- **Copy:** no fabricated numbers; social proof is "550+ founders"; no exclamation marks; no em-dashes; show "Rocket Wave is a business operating system and not a law firm" wherever legal or tax information appears.

## Naming

- Database: snake_case, plural tables, `id uuid` primary key, `<table>_id` foreign keys, `created_at` / `updated_at` on every table
- TypeScript: camelCase variables, PascalCase types and components, kebab-case file names
- Modules: `packages/core/src/<module>/` with `schema.ts`, `service.ts`, `service.test.ts`, `README.md`

## Commits and pull requests

Conventional commits (`feat(orders): ...`, `fix(ledger): ...`). Every pull request lists what changed, how it was tested, and which docs were updated. Login, payments, documents and permissions changes need two human reviewers.
