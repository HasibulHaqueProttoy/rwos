import { getTableConfig, pgTable } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';
import {
  amountMinor,
  currency,
  id,
  oneOfCheck,
  softDelete,
  timestamps,
  utcTimestamp,
} from './columns';

const example = pgTable('examples', {
  id: id(),
  totalMinor: amountMinor(),
  currency: currency(),
  paidAt: utcTimestamp(),
  ...timestamps(),
  ...softDelete(),
});

const columns = Object.fromEntries(getTableConfig(example).columns.map((col) => [col.name, col]));

/** Timestamp columns carry `withTimezone`; the base column type does not declare it. */
function timestampColumn(name: string) {
  return columns[name] as unknown as
    { withTimezone: boolean; notNull: boolean; hasDefault: boolean } | undefined;
}

describe('column helpers', () => {
  it('id is a uuid primary key with a database default', () => {
    expect(columns.id?.columnType).toBe('PgUUID');
    expect(columns.id?.primary).toBe(true);
    expect(columns.id?.hasDefault).toBe(true);
  });

  it('timestamps are timestamptz, not null, defaulting to now', () => {
    for (const name of ['createdAt', 'updatedAt']) {
      const col = timestampColumn(name);
      expect(col?.withTimezone).toBe(true);
      expect(col?.notNull).toBe(true);
      expect(col?.hasDefault).toBe(true);
    }
  });

  it('optional timestamps are timestamptz and nullable', () => {
    for (const name of ['paidAt', 'deletedAt']) {
      const col = timestampColumn(name);
      expect(col?.withTimezone).toBe(true);
      expect(col?.notNull).toBe(false);
    }
  });

  it('money is a not-null bigint and currency a not-null char(3)', () => {
    expect(columns.totalMinor?.columnType).toBe('PgBigInt53');
    expect(columns.totalMinor?.notNull).toBe(true);
    expect(columns.currency?.columnType).toBe('PgChar');
    expect(columns.currency?.getSQLType()).toBe('char(3)');
    expect(columns.currency?.notNull).toBe(true);
  });

  it('each call returns new builders, so tables never share a column', () => {
    expect(timestamps().createdAt).not.toBe(timestamps().createdAt);
    expect(id()).not.toBe(id());
  });
});

describe('oneOfCheck', () => {
  it('accepts only snake_case status values', () => {
    expect(() => oneOfCheck('c', example.currency, ['draft', 'paid'])).not.toThrow();
    expect(() => oneOfCheck('c', example.currency, ["paid'); drop table x; --"])).toThrow(
      /not a snake_case status value/,
    );
    expect(() => oneOfCheck('c', example.currency, ['Paid'])).toThrow();
    expect(() => oneOfCheck('c', example.currency, [])).toThrow(/at least one/);
  });
});
