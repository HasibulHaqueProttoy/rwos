# Build plan

One release, built in five milestones behind feature flags. Finish and test each task before the next. Tick `[x]` when the task meets the definition of done in `CLAUDE.md`.

## Milestone 1: Foundations (weeks 1 to 4)

- [x] 1.1 Monorepo scaffold: pnpm workspaces, Turborepo, `apps/web`, `apps/admin`, `apps/worker`, `packages/*` from `ARCHITECTURE.md`; shared tsconfig (strict), ESLint, Prettier, Vitest; `pnpm lint`, `pnpm typecheck`, `pnpm test` work from the root
- [x] 1.2 Local infrastructure: `docker-compose.yml` with Postgres 16, Redis, MinIO and Mailpit; `.env.example`; `pnpm dev` starts everything; steps written in `RUNBOOK.md`
- [x] 1.3 GitHub Actions CI: install, lint, typecheck, test, build, migration check on a fresh Postgres; dependency and secret scanning
- [ ] 1.4 `packages/db`: Drizzle setup, conventions helpers (id, timestamps, money columns), `updated_at` trigger, migration and seed scripts
- [ ] 1.5 `packages/ui`: design tokens as CSS variables (light and dark), Tailwind preset, shadcn/ui base components themed from tokens (Button, Input, Select, Badge, Card, Dialog, Sheet, Table, Tabs, Toast), the logo
- [ ] 1.6 Identity schema and Better Auth: users, staff, roles, permissions, role_permissions, approval_rules, approvals, audit_log; staff two-factor; customer passwordless email code
- [ ] 1.7 Permission checks in `packages/auth` with tests; seed roles (founder, sales, operations, finance, support, partner)
- [ ] 1.8 Workspaces, memberships, invitations, companies, people, company_roles, addresses, company_tax_ids (encrypted); row-level security policies with tests proving cross-workspace access fails
- [ ] 1.9 Integrations package: all interfaces from `INTEGRATIONS.md` with test providers; FileStorage on MinIO; EmailSender to Mailpit; JobQueue on BullMQ; outbox table and worker loop
- [ ] 1.10 Catalog and Price Book schema: products, variants, prices, government_fees, bd_fee_slabs, plans, promo_codes, payment_channels, legal_entities; seed with current prices (US LLC $197 + state fee, UK A $299, UK B $469, IFZA 0 to 4+ visas, BD service fee BDT 25,000)
- [ ] 1.11 Admin shell: sign-in, sidebar, global search placeholder, account menu, Price Book list and edit screens with audit logging
- [ ] 1.12 Customer shell: PWA manifest, sign-in, sidebar and mobile tab bar, empty dashboard, light and dark themes

## Milestone 2: Run the business (weeks 5 to 10)

Leads and quotes, discounts with approval tiers, orders with price snapshots, cases, task tracker with automatic priority, partners and partner prices, invoices, payments (test provider), receipts, credit notes, ledger with two entities, partner payouts, monthly inputs, reconciliation, saved views and CSV export. Team starts using the admin internally.

## Milestone 3: Customer journey (weeks 11 to 16)

Checkout for US, UK, UAE (consult first), Bangladesh (quote builder) and the US-resident track; onboarding forms from pack schemas; KYC with co-owner invites; signature step; order tracker and timeline; document vault; support tickets; notifications (email, in-app, Slack, WhatsApp links); abandoned checkout to lead.

## Milestone 4: Compliance, renewals and metrics (weeks 17 to 22)

Compliance rules engine with sources, overrides and verification tasks; events per company; renewals with co-terming, reminder ladder and collections board; wallet auto-pay; refunds with policy checks; metrics dashboard and cohorts.

## Milestone 5: Business OS and launch (weeks 23 to 30)

Add-on modules (email, domain, Business Line, invoicing, Accounting Connect, Pack), rewards and affiliate income, wallet, promo codes, refer and earn, mail log, name rejection flow, retention and offboarding, migration of about 600 customers, security test, launch.
