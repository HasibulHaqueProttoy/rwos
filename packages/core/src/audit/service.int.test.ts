import { schema } from '@rwos/db';
import { createTestDatabase } from '@rwos/db/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { recordAudit } from './service';

let testDb: Awaited<ReturnType<typeof createTestDatabase>>;
let userId: string;

beforeAll(async () => {
  testDb = await createTestDatabase();
  const [user] = await testDb.db
    .insert(schema.users)
    .values({ email: 'staff.sample@example.test', name: 'Sample Staff' })
    .returning({ id: schema.users.id });
  userId = user?.id ?? '';
});

afterAll(async () => {
  await testDb?.drop();
});

describe('recordAudit', () => {
  it('writes an entry', async () => {
    await recordAudit(testDb.db, {
      actorUserId: userId,
      action: 'auth.sign_in',
      subjectType: 'user',
      subjectId: userId,
      ip: '203.0.113.7',
      userAgent: 'vitest',
    });
    const rows = await testDb.db.select().from(schema.auditLog);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      action: 'auth.sign_in',
      actorUserId: userId,
      ip: '203.0.113.7',
    });
  });

  it('is saved or rolled back together with the change it records', async () => {
    await expect(
      testDb.db.transaction(async (tx) => {
        await recordAudit(tx, { actorUserId: userId, action: 'test.rolled_back' });
        throw new Error('the change failed');
      }),
    ).rejects.toThrow('the change failed');
    const rows = await testDb.sql`select 1 from audit_log where action = 'test.rolled_back'`;
    expect(rows).toHaveLength(0);
  });
});

describe('audit_log is append-only', () => {
  it.each([
    ['UPDATE', `update audit_log set action = 'tampered.action'`],
    ['DELETE', 'delete from audit_log'],
    ['TRUNCATE', 'truncate audit_log'],
  ])('rejects %s', async (operation, statement) => {
    await expect(testDb.sql.unsafe(statement)).rejects.toThrow(
      `audit_log is append-only: ${operation}`,
    );
  });
});
