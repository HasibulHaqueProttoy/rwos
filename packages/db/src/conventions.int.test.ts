import { type DrizzleSnapshotJSON, generateDrizzleJson, generateMigration } from 'drizzle-kit/api';
import { index, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  amountMinor,
  currency,
  currencyCheck,
  id,
  nonNegativeCheck,
  oneOfCheck,
  softDelete,
  timestamps,
  utcTimestamp,
} from './columns';
import { findConventionViolations } from './conventions';
import { createTestDatabase } from './testing';

// Fixture tables built only with the helpers, turned into SQL by drizzle-kit exactly as a
// real migration would be, then checked against the conventions.
const fixtureCustomers = pgTable('fixture_customers', {
  id: id(),
  fullName: text().notNull(),
  ...timestamps(),
  ...softDelete(),
});

const fixtureOrders = pgTable(
  'fixture_orders',
  {
    id: id(),
    fixtureCustomerId: uuid()
      .notNull()
      .references(() => fixtureCustomers.id, { onDelete: 'restrict' }),
    totalMinor: amountMinor(),
    currency: currency(),
    status: text().notNull(),
    paidAt: utcTimestamp(),
    ...timestamps(),
  },
  (table) => [
    index('fixture_orders_fixture_customer_id_idx').on(table.fixtureCustomerId),
    currencyCheck('fixture_orders_currency_check', table.currency),
    nonNegativeCheck('fixture_orders_total_minor_check', table.totalMinor),
    oneOfCheck('fixture_orders_status_check', table.status, ['draft', 'paid']),
  ],
);

/** The SQL drizzle-kit would write to a migration that creates `tables` from nothing. */
async function migrationSql(tables: Record<string, unknown>): Promise<string[]> {
  // drizzle-kit's bundled declaration files do not resolve for typescript-eslint (tsc accepts
  // them), so its return values look untyped to the linter. The shape is DrizzleSnapshotJSON.
  /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
  const empty: DrizzleSnapshotJSON = generateDrizzleJson({}, undefined, undefined, 'snake_case');
  const current: DrizzleSnapshotJSON = generateDrizzleJson(
    tables,
    empty.id,
    undefined,
    'snake_case',
  );
  /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
  return generateMigration(empty, current);
}

let testDb: Awaited<ReturnType<typeof createTestDatabase>>;

beforeAll(async () => {
  testDb = await createTestDatabase();
  for (const statement of await migrationSql({ fixtureCustomers, fixtureOrders })) {
    await testDb.sql.unsafe(statement);
  }
  await testDb.sql`select ensure_updated_at_triggers()`;
});

afterAll(async () => {
  await testDb?.drop();
});

describe('tables built with the column helpers', () => {
  it('follow every convention', async () => {
    await expect(findConventionViolations(testDb.sql)).resolves.toEqual([]);
  });

  it('are stored with snake_case column names', async () => {
    const rows = await testDb.sql<{ column_name: string }[]>`
      select column_name from information_schema.columns
      where table_name = 'fixture_orders' order by ordinal_position
    `;
    expect(rows.map((row) => row.column_name)).toEqual([
      'id',
      'fixture_customer_id',
      'total_minor',
      'currency',
      'status',
      'paid_at',
      'created_at',
      'updated_at',
    ]);
  });

  it('enforce the currency, amount and status checks', async () => {
    const [customer] = await testDb.sql<{ id: string }[]>`
      insert into fixture_customers (full_name) values ('Sample Founder') returning id
    `;
    const insert = (code: string, total: number, status: string) => testDb.sql`
      insert into fixture_orders (fixture_customer_id, total_minor, currency, status)
      values (${customer?.id ?? ''}, ${total}, ${code}, ${status})
    `;
    await expect(insert('USD', 19700, 'paid')).resolves.toBeDefined();
    await expect(insert('usd', 19700, 'paid')).rejects.toThrow(/fixture_orders_currency_check/);
    await expect(insert('USD', -1, 'paid')).rejects.toThrow(/fixture_orders_total_minor_check/);
    await expect(insert('USD', 19700, 'lost')).rejects.toThrow(/fixture_orders_status_check/);
  });

  it('refuse to delete a row another table still points at', async () => {
    await expect(testDb.sql`delete from fixture_customers`).rejects.toThrow(/foreign key/);
  });

  it('keep updated_at current on every update, even if the update tries to set it', async () => {
    // The Drizzle driver returns timestamps as text, so compare them as instants.
    const time = (value: string | Date | undefined) => new Date(value ?? NaN).getTime();
    const [row] = await testDb.sql<{ id: string; created_at: string; updated_at: string }[]>`
      insert into fixture_customers (full_name) values ('Second Founder')
      returning id, created_at, updated_at
    `;
    await testDb.sql`select pg_sleep(0.05)`;
    const [after] = await testDb.sql<{ created_at: string; updated_at: string }[]>`
      update fixture_customers
      set full_name = 'Renamed Founder', updated_at = '2000-01-01T00:00:00Z'
      where id = ${row?.id ?? ''}
      returning created_at, updated_at
    `;
    expect(time(after?.created_at)).toBe(time(row?.created_at));
    expect(time(after?.updated_at)).toBeGreaterThan(time(row?.updated_at));
  });
});

describe('findConventionViolations', () => {
  it('reports each broken rule by table and column', async () => {
    await testDb.sql.unsafe(`
      create table "BadThings" (
        id serial primary key,
        fixture_customer_id uuid references fixture_customers (id),
        price_minor numeric,
        rate double precision,
        currency text,
        happened_at timestamp
      )
    `);
    const violations = await findConventionViolations(testDb.sql);
    await testDb.sql.unsafe('drop table "BadThings"');

    expect(violations).toEqual(
      expect.arrayContaining([
        'BadThings: table name is not snake_case',
        'BadThings: needs an "id uuid" column',
        'BadThings: needs "created_at timestamptz not null"',
        'BadThings: needs "updated_at timestamptz not null"',
        'BadThings.price_minor: money in minor units must be bigint',
        'BadThings.rate: no floating point or money type; use bigint minor units or numeric',
        'BadThings.currency: currency must be char(3)',
        'BadThings.happened_at: use timestamptz (UTC), not timestamp without time zone',
        'BadThings.fixture_customer_id: foreign key needs an index',
      ]),
    );
  });

  it('skips tables listed as exceptions', async () => {
    await testDb.sql.unsafe('create table library_table (key text primary key)');
    const violations = await findConventionViolations(testDb.sql, {
      exceptions: { library_table: 'owned by a library' },
    });
    await testDb.sql.unsafe('drop table library_table');
    expect(violations).toEqual([]);
  });
});
