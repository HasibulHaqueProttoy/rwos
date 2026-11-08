import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { findConventionViolations } from './conventions';
import { runMigrations } from './migrate';
import { createTestDatabase } from './testing';

let testDb: Awaited<ReturnType<typeof createTestDatabase>>;

beforeAll(async () => {
  testDb = await createTestDatabase();
});

afterAll(async () => {
  await testDb?.drop();
});

describe('migrations on a fresh database', () => {
  it('create the updated_at trigger functions', async () => {
    const rows = await testDb.sql<{ proname: string }[]>`
      select proname from pg_proc
      where proname in ('set_updated_at', 'ensure_updated_at_triggers')
      order by proname
    `;
    expect(rows.map((row) => row.proname)).toEqual([
      'ensure_updated_at_triggers',
      'set_updated_at',
    ]);
  });

  it('record every migration in the journal', async () => {
    const [row] = await testDb.sql<{ count: string }[]>`
      select count(*)::text as count from drizzle.__drizzle_migrations
    `;
    expect(Number(row?.count)).toBeGreaterThan(0);
  });

  it('can run again with nothing left to do', async () => {
    await expect(runMigrations(testDb.url)).resolves.toEqual({ triggersAttached: 0 });
  });

  it('leave a schema that follows every data model convention', async () => {
    await expect(findConventionViolations(testDb.sql)).resolves.toEqual([]);
  });
});
