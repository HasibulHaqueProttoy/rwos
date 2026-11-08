# 0005: Database layer conventions

Date: 2026-11-08 · Status: accepted

## Decisions

- **Driver: `postgres` (postgres.js)** with `drizzle-orm/postgres-js`. Pure JavaScript, works the same locally, in CI and on the VPS, and has no native build step.
- **snake_case in the database, camelCase in TypeScript,** converted by Drizzle's `casing: 'snake_case'` in both the client and drizzle-kit, so column names never need repeating.
- **Money read as JavaScript numbers** (`bigint` with `mode: 'number'`). Exact up to 9,007,199,254,740,991 minor units (about 90 trillion dollars), far above any amount Rocket Wave handles, and it keeps money arithmetic and JSON simple. Native `BigInt` was rejected because it does not serialise to JSON.
- **`updated_at` by a database trigger,** so it stays correct even for raw SQL updates. `pnpm db:migrate` calls `ensure_updated_at_triggers()` after applying migrations, which attaches the trigger to any new table, so no migration has to remember it. Migrations must be applied with `pnpm db:migrate` (not drizzle-kit's own migrate command).
- **Conventions checked by a test, not by review alone:** `findConventionViolations()` inspects the migrated database on every pull request and fails CI on any broken rule from DATA_MODEL.md.
- **Two kinds of seed data:** reference data (needed in production, idempotent upserts) and generated sample data (refused in production).
- **Integration tests use a throwaway database per test file** (`createTestDatabase()`), so tests never share state and can run in parallel.

## Why

The project's hard rules (UTC, integer money, indexed foreign keys, audit-friendly timestamps) are easy to break by accident. Enforcing them in code and in CI keeps the schema clean as AI-written tables are added in every later task.
