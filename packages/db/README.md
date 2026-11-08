# @rwos/db

The database layer: Drizzle schema, migrations, seed data, and the helpers that keep every table following `docs/DATA_MODEL.md`. Server-side only.

## Commands (from the repository root)

| Command | What it does |
| --- | --- |
| `pnpm db:generate` | Writes a new migration in `migrations/` from changes in `src/schema/` |
| `pnpm db:migrate` | Applies pending migrations, then attaches the `updated_at` trigger to any new table. Safe to repeat |
| `pnpm db:seed` | Reference data plus generated sample data. Refused when `NODE_ENV=production` |
| `pnpm db:seed:reference` | Reference data only (roles, products, prices). Safe in every environment |
| `pnpm test:integration` | Database tests; each file gets its own throwaway database |

All of them read `DATABASE_URL` from the root `.env.local` (or the environment, which wins). The URL is never printed.

## Adding a table

1. Create `src/schema/<module>.ts` and export it from `src/schema/index.ts`.
2. Build the table with the helpers from `src/columns.ts`; name keys in camelCase (they are stored as snake_case):

   ```ts
   export const invoices = pgTable(
     'invoices',
     {
       id: id(),
       workspaceId: uuid().notNull().references(() => workspaces.id, { onDelete: 'restrict' }),
       totalMinor: amountMinor(),
       currency: currency(),
       status: text().notNull(),
       dueOn: date().notNull(),
       ...timestamps(),
     },
     (table) => [
       index('invoices_workspace_id_idx').on(table.workspaceId),
       currencyCheck('invoices_currency_check', table.currency),
       nonNegativeCheck('invoices_total_minor_check', table.totalMinor),
       oneOfCheck('invoices_status_check', table.status, ['draft', 'issued', 'paid', 'void']),
     ],
   );
   ```

3. `pnpm db:generate`, read the generated SQL, then `pnpm db:migrate`.
4. Update `docs/DATA_MODEL.md` in the same pull request.
5. `pnpm test:integration`: the convention check fails if the table breaks a rule (missing index on a foreign key, a float column, a timestamp without time zone, and so on).

Never edit a migration that has been merged; write a new one. CI fails if the schema and the migrations disagree (`migrations:check`).

## Helpers

| Helper | Column |
| --- | --- |
| `id()` | `uuid primary key default gen_random_uuid()` |
| `timestamps()` | `created_at`, `updated_at`: `timestamptz not null default now()`; `updated_at` kept current by a trigger |
| `softDelete()` | `deleted_at timestamptz`, only where DATA_MODEL marks soft delete |
| `utcTimestamp()` | any other moment, `timestamptz` |
| `amountMinor()` | money in minor units, `bigint not null` (read as a number, exact up to 9,007,199,254,740,991) |
| `currency()` | `char(3) not null`; pair with `currencyCheck()` |
| `currencyCheck()`, `nonNegativeCheck()`, `oneOfCheck()` | check constraints for currency codes, amounts and status values |

## Seeds

This package provides the seed runner (`runSeeds`). The seeds themselves live with their modules and are listed in `packages/core/src/seeds.ts`: `referenceSeeds` (needed everywhere, including production) and `sampleSeeds` (generated data for local development and CI). Each seed runs in its own transaction and must be idempotent (upsert on a natural key), because seeds run again on every deploy and every `pnpm db:seed`.

## Tests

- Unit tests (`*.test.ts`) run with `pnpm test` and need no database.
- Integration tests (`*.int.test.ts`) run with `pnpm test:integration` against the Postgres in `DATABASE_URL`. Use `createTestDatabase()` from `@rwos/db/testing`: it creates a fresh, migrated database and `drop()` removes it. Later modules use the same helper (for example the row-level security tests in task 1.8).
