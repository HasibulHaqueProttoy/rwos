import { sql } from 'drizzle-orm';
import { type AnyPgColumn, bigint, char, check, timestamp, uuid } from 'drizzle-orm/pg-core';

/*
 * Column helpers for the conventions in docs/DATA_MODEL.md. Column names come from the
 * TypeScript keys (camelCase) and are stored in snake_case, because the client and
 * drizzle-kit both use `casing: 'snake_case'`.
 *
 * Each helper returns new builders on every call, so tables never share a column object.
 */

/** `id uuid primary key default gen_random_uuid()` */
export function id() {
  return uuid().primaryKey().defaultRandom();
}

/** `created_at` and `updated_at`, both `timestamptz not null default now()`.
 * `updated_at` is kept current by the `set_updated_at` trigger (attached by `pnpm db:migrate`). */
export function timestamps() {
  return {
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  };
}

/** `deleted_at timestamptz`, only on tables marked soft-delete in DATA_MODEL.md. */
export function softDelete() {
  return { deletedAt: timestamp({ withTimezone: true }) };
}

/** A UTC moment, `timestamptz`. Never use a timestamp without time zone. */
export function utcTimestamp() {
  return timestamp({ withTimezone: true });
}

/** A money amount in minor units (cents, poisha): `bigint not null`. Never a float.
 * Read as a JavaScript number; values stay exact up to 9,007,199,254,740,991 minor units. */
export function amountMinor() {
  return bigint({ mode: 'number' }).notNull();
}

/** An ISO 4217 currency code, `char(3) not null` (USD, BDT, GBP, AED). */
export function currency() {
  return char({ length: 3 }).notNull();
}

/** Check constraint: the column holds three upper-case letters. */
export function currencyCheck(name: string, column: AnyPgColumn) {
  return check(name, sql`${column} ~ '^[A-Z]{3}$'`);
}

/** Check constraint: the amount is zero or more. */
export function nonNegativeCheck(name: string, column: AnyPgColumn) {
  return check(name, sql`${column} >= 0`);
}

const STATUS_VALUE = /^[a-z][a-z0-9_]*$/;

/** Check constraint: the column holds one of `values` (for status columns stored as text).
 * Values are written into the table definition (constraints cannot take parameters), so only
 * snake_case words are accepted. */
export function oneOfCheck(name: string, column: AnyPgColumn, values: readonly string[]) {
  if (values.length === 0) throw new Error(`${name}: needs at least one allowed value`);
  for (const value of values) {
    if (!STATUS_VALUE.test(value)) {
      throw new Error(`${name}: "${value}" is not a snake_case status value`);
    }
  }
  const list = sql.raw(values.map((value) => `'${value}'`).join(', '));
  return check(name, sql`${column} in (${list})`);
}
