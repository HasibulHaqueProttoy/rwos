import { runSeeds, schema } from '@rwos/db';
import { createTestDatabase } from '@rwos/db/testing';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { IdentityError } from './errors';
import { permissionKeys } from './permissions';
import { defaultRoles } from './roles';
import { rolesAndPermissionsSeed } from './seed';
import { createStaffMember, setRolePermission, setStaffActive, setStaffRole } from './service';

let testDb: Awaited<ReturnType<typeof createTestDatabase>>;
const system = { userId: null };
const seed = () =>
  runSeeds(testDb.db, {
    includeSample: false,
    nodeEnv: 'test',
    logger: { info: () => undefined },
    seeds: { reference: [rolesAndPermissionsSeed], sample: [] },
  });

async function grantsOf(roleKey: string) {
  const rows = await testDb.db
    .select({ key: schema.permissions.key })
    .from(schema.rolePermissions)
    .innerJoin(schema.roles, eq(schema.roles.id, schema.rolePermissions.roleId))
    .innerJoin(schema.permissions, eq(schema.permissions.id, schema.rolePermissions.permissionId))
    .where(eq(schema.roles.key, roleKey));
  return new Set(rows.map((row) => row.key));
}

async function lastAudit(action: string) {
  const rows = await testDb.db
    .select()
    .from(schema.auditLog)
    .where(eq(schema.auditLog.action, action));
  return rows.at(-1);
}

beforeAll(async () => {
  testDb = await createTestDatabase();
  await seed();
});

afterAll(async () => {
  await testDb?.drop();
});

describe('roles and permissions seed', () => {
  it('creates every permission and the six roles with their defaults', async () => {
    const permissions = await testDb.db.select().from(schema.permissions);
    expect(permissions).toHaveLength(permissionKeys.length);
    for (const role of defaultRoles)
      expect(await grantsOf(role.key)).toEqual(new Set(role.permissions));
  });

  it('changes nothing when run again', async () => {
    const before = await testDb.db.select().from(schema.rolePermissions);
    await seed();
    const after = await testDb.db.select().from(schema.rolePermissions);
    expect(after).toHaveLength(before.length);
  });

  it('keeps a permission removed in the admin removed', async () => {
    await setRolePermission(testDb.db, system, {
      roleKey: 'sales',
      permission: 'tickets.read',
      granted: false,
    });
    await seed();
    expect((await grantsOf('sales')).has('tickets.read')).toBe(false);
    await setRolePermission(testDb.db, system, {
      roleKey: 'sales',
      permission: 'tickets.read',
      granted: true,
    });
  });

  it('grants a newly added permission key to the roles whose defaults include it', async () => {
    // Simulate a release that adds kyc.review: remove it, then seed as that release would.
    await testDb.db.delete(schema.permissions).where(eq(schema.permissions.key, 'kyc.review'));
    expect((await grantsOf('operations')).has('kyc.review')).toBe(false);
    await seed();
    expect((await grantsOf('operations')).has('kyc.review')).toBe(true);
    expect((await grantsOf('founder')).has('kyc.review')).toBe(true);
    expect((await grantsOf('sales')).has('kyc.review')).toBe(false);
  });
});

describe('createStaffMember', () => {
  it('creates a staff account with its role, in lower case, and audits it', async () => {
    const { userId } = await createStaffMember(testDb.db, system, {
      email: 'New.Ops@Example.TEST',
      name: 'Sample Operations',
      roleKey: 'operations',
    });
    const [user] = await testDb.db.select().from(schema.users).where(eq(schema.users.id, userId));
    expect(user).toMatchObject({
      email: 'new.ops@example.test',
      isStaff: true,
      twoFactorEnabled: false,
    });
    const entry = await lastAudit('staff.create');
    expect(entry).toMatchObject({ actorUserId: null, subjectId: userId });
    expect(entry?.after).toMatchObject({ email: 'new.ops@example.test', role: 'operations' });
  });

  it('refuses an email that is already staff', async () => {
    await expect(
      createStaffMember(testDb.db, system, {
        email: 'new.ops@example.test',
        name: 'Again',
        roleKey: 'sales',
      }),
    ).rejects.toMatchObject({ code: 'already_staff' });
  });

  it("refuses a customer's email, so a customer account never silently becomes staff", async () => {
    await testDb.db
      .insert(schema.users)
      .values({ email: 'customer@example.test', name: 'Customer' });
    await expect(
      createStaffMember(testDb.db, system, {
        email: 'customer@example.test',
        name: 'Customer',
        roleKey: 'sales',
      }),
    ).rejects.toMatchObject({ code: 'email_in_use_by_customer' });
  });

  it('refuses an unknown role and leaves nothing behind', async () => {
    await expect(
      createStaffMember(testDb.db, system, {
        email: 'ghost@example.test',
        name: 'Ghost',
        roleKey: 'admiral',
      }),
    ).rejects.toBeInstanceOf(IdentityError);
    const rows = await testDb.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, 'ghost@example.test'));
    expect(rows).toHaveLength(0);
  });
});

describe('changing staff', () => {
  it('records a role change with before and after', async () => {
    const { userId } = await createStaffMember(testDb.db, system, {
      email: 'mover@example.test',
      name: 'Mover',
      roleKey: 'support',
    });
    await setStaffRole(testDb.db, system, { userId, roleKey: 'sales' });
    const entry = await lastAudit('staff.role_change');
    expect(entry).toMatchObject({
      before: { role: 'support' },
      after: { role: 'sales' },
      subjectId: userId,
    });
  });

  it('deactivating ends every session at once', async () => {
    const { userId } = await createStaffMember(testDb.db, system, {
      email: 'leaving@example.test',
      name: 'Leaving',
      roleKey: 'finance',
    });
    await testDb.db.insert(schema.sessions).values({
      userId,
      token: `token-${userId}`,
      expiresAt: new Date(Date.now() + 3_600_000),
      audience: 'admin',
    });
    await setStaffActive(testDb.db, system, { userId, active: false });
    expect(
      await testDb.db.select().from(schema.sessions).where(eq(schema.sessions.userId, userId)),
    ).toHaveLength(0);
    expect(await lastAudit('staff.deactivate')).toMatchObject({ subjectId: userId });
  });
});

describe('role permissions', () => {
  it('audits a real change and stays quiet when nothing changes', async () => {
    const countGrants = async () =>
      (
        await testDb.db
          .select()
          .from(schema.auditLog)
          .where(eq(schema.auditLog.action, 'role.permission_grant'))
      ).length;
    const before = await countGrants();
    await setRolePermission(testDb.db, system, {
      roleKey: 'support',
      permission: 'quotes.read',
      granted: true,
    });
    await setRolePermission(testDb.db, system, {
      roleKey: 'support',
      permission: 'quotes.read',
      granted: true,
    });
    expect(await countGrants()).toBe(before + 1);
  });

  it('never lets the founder role lose staff or role management', async () => {
    await expect(
      setRolePermission(testDb.db, system, {
        roleKey: 'founder',
        permission: 'roles.manage',
        granted: false,
      }),
    ).rejects.toMatchObject({ code: 'founder_lockout' });
    expect((await grantsOf('founder')).has('roles.manage')).toBe(true);
  });

  it('refuses a permission key that does not exist', async () => {
    await expect(
      setRolePermission(testDb.db, system, {
        roleKey: 'sales',
        permission: 'ledger.delete_everything',
        granted: true,
      }),
    ).rejects.toThrow(/Unknown permission/);
  });
});
