# Architecture

A modular monolith in one monorepo: two Next.js apps share one database and one set of domain modules. Every outside service is behind an interface, so hosting and providers can change without touching business logic.

## Repository layout

```
rwos/
  apps/
    web/            customer PWA (app.rocketwave.co)
    admin/          staff admin (admin.rocketwave.co)
    worker/         background job runner (reminders, webhooks, exports)
  packages/
    db/             Drizzle schema, migrations, seed, RLS policies
    core/           domain modules (business logic, no UI, no provider SDKs)
    integrations/   interfaces + test providers + real adapters
    ui/             design tokens, Tailwind preset, shared components
    auth/           Better Auth setup, roles and permission checks
    config/         eslint, tsconfig, vitest presets
  docs/             product, architecture, data model, decisions
  docker-compose.yml  local Postgres, Redis, MinIO, Mailpit
```

## Domain modules (`packages/core/src/`)

| Module | Owns |
| --- | --- |
| identity | users, staff, roles, permissions, approvals |
| workspace | workspaces, memberships, invitations |
| company | companies, people (directors, members, shareholders, PSCs, UBOs), addresses, residency flag |
| kyc | identity documents, review, expiry, co-owner invites |
| catalog | products, variants, prices, plans, government fees, BD fee slabs, promo codes |
| jurisdiction | packs, versions, form schemas, workflow steps, document templates |
| sales | leads, pipeline, quotes, discounts |
| orders | orders, order lines with price snapshots, cases |
| tasks | tasks, templates, priority, assignment, SLA |
| documents | vault, document types, signatures |
| compliance | rules, overrides, generated events, verification |
| billing | invoices, payments, receipts, credit notes, refunds, renewals, collections |
| ledger | entities, accounts, entries, payouts, monthly inputs, reconciliation, month close |
| rewards | wallet, referrals, partner rewards, affiliate income |
| support | tickets, messages, help articles |
| notifications | templates, outbox, preferences, delivery log |
| mail | mail log for addresses |
| addons | email, domain, phone, invoicing, accounting connect entitlements |
| metrics | metric definitions and snapshots |
| retention | offboarding, exports, archive, deletion |

Rules: a module exposes a service API; other modules call that API, never its tables directly. Cross-module side effects go through domain events written to the outbox.

## Plug-in points (`packages/integrations/`)

Each interface has `test` and real implementations, chosen per environment by config. See `INTEGRATIONS.md`.

`PaymentProvider` (Stripe, Mollie, SSLCommerz) · `EmailSender` · `SmsSender` · `WhatsAppLinkBuilder` · `TeamNotifier` (Slack webhooks) · `FileStorage` (S3-compatible) · `JobQueue` · `KycProvider` (manual review first) · `PhoneNumberProvider` · `DomainProvider` · `MailboxProvider` · `AccountingConnector` · `FxRateProvider`

## Request flow

UI (Server Components and Server Actions) calls a core service; the service checks the permission, validates with Zod, writes inside one transaction (business rows + audit log + outbox event), and returns. The worker reads the outbox and delivers notifications, Slack posts and follow-up jobs.

## Environments

local (Docker) → staging (no real data) → production. Hosting is decided at deploy time; the build must run on both Vercel + Supabase and a Hostinger VPS with Docker.
