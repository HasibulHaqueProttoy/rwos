import {
  createStaffMember,
  defaultRoles,
  rolesAndPermissionsSeed,
  setRolePermission,
  setStaffActive,
} from '@rwos/core';
import { runSeeds, schema } from '@rwos/db';
import { createTestDatabase } from '@rwos/db/testing';
import { TestEmailSender } from '@rwos/integrations';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Auth } from './create-auth';
import { AuthorizationError, authorize, can, loadStaffPermissions } from './permissions';
import { cookiesFrom, enableTotp, makeAuth, signInWithEmailCode, totpCode } from './test/harness';

let testDb: Awaited<ReturnType<typeof createTestDatabase>>;
const email = new TestEmailSender();
let adminAuth: Auth;
const system = { userId: null };

beforeAll(async () => {
  testDb = await createTestDatabase();
  adminAuth = makeAuth('admin', testDb.db, email);
  await runSeeds(testDb.db, {
    includeSample: false,
    nodeEnv: 'test',
    logger: { info: () => undefined },
    seeds: { reference: [rolesAndPermissionsSeed], sample: [] },
  });
});

afterAll(async () => {
  await testDb?.drop();
});

const headersWith = (cookie: string) => new Headers({ cookie });

/** Creates staff with a role, signs them in and completes two-factor; returns their admin cookie. */
async function signedInStaff(address: string, roleKey: string) {
  const { userId } = await createStaffMember(testDb.db, system, {
    email: address,
    name: 'Sample Staff',
    roleKey,
  });
  const first = await signInWithEmailCode(adminAuth, email, address);
  const totpURI = await enableTotp(adminAuth, headersWith(first.cookie));
  const { headers } = await adminAuth.api.verifyTOTP({
    body: { code: await totpCode(totpURI) },
    headers: headersWith(first.cookie),
    returnHeaders: true,
  });
  return { userId, cookie: cookiesFrom(headers, first.cookie) };
}

describe('loadStaffPermissions', () => {
  it.each(defaultRoles.map((role) => [role.key, role] as const))(
    'gives %s exactly its permissions',
    async (key, role) => {
      const { userId } = await createStaffMember(testDb.db, system, {
        email: `load.${key}@example.test`,
        name: 'Sample Staff',
        roleKey: key,
      });
      expect(await loadStaffPermissions(testDb.db, userId)).toEqual(new Set(role.permissions));
    },
  );

  it('gives a customer nothing', async () => {
    const [customer] = await testDb.db
      .insert(schema.users)
      .values({ email: 'plain.customer@example.test', name: 'Customer' })
      .returning({ id: schema.users.id });
    expect((await loadStaffPermissions(testDb.db, customer?.id ?? '')).size).toBe(0);
  });
});

describe('authorize', () => {
  it('lets finance read the ledger and refuses sales, naming the missing permission', async () => {
    const finance = await signedInStaff('auth.finance@example.test', 'finance');
    const allowed = await authorize(
      adminAuth,
      testDb.db,
      headersWith(finance.cookie),
      'ledger.read',
    );
    expect(allowed.user.id).toBe(finance.userId);
    expect(can(allowed.permissions, 'ledger.read', 'ledger.manage')).toBe(true);
    expect(can(allowed.permissions, 'prices.manage')).toBe(false);

    const sales = await signedInStaff('auth.sales@example.test', 'sales');
    await expect(
      authorize(adminAuth, testDb.db, headersWith(sales.cookie), 'ledger.read'),
    ).rejects.toMatchObject({
      reason: 'forbidden',
      permission: 'ledger.read',
    });
  });

  it('needs every permission asked for', async () => {
    const support = await signedInStaff('auth.support@example.test', 'support');
    await expect(
      authorize(adminAuth, testDb.db, headersWith(support.cookie), 'tickets.read', 'kyc.read'),
    ).rejects.toMatchObject({ reason: 'forbidden', permission: 'kyc.read' });
  });

  it('refuses someone who is not signed in', async () => {
    await expect(
      authorize(adminAuth, testDb.db, new Headers(), 'tickets.read'),
    ).rejects.toMatchObject({
      reason: 'signed_out',
    });
  });

  it('refuses staff who have not set up two-factor yet', async () => {
    await createStaffMember(testDb.db, system, {
      email: 'auth.new@example.test',
      name: 'New',
      roleKey: 'founder',
    });
    const { cookie } = await signInWithEmailCode(adminAuth, email, 'auth.new@example.test');
    const refusal = authorize(adminAuth, testDb.db, headersWith(cookie), 'staff.read');
    await expect(refusal).rejects.toBeInstanceOf(AuthorizationError);
    await expect(refusal).rejects.toMatchObject({ reason: 'two_factor_setup_required' });
  });

  it('applies a permission removed in the admin on the very next request', async () => {
    const ops = await signedInStaff('auth.ops@example.test', 'operations');
    await expect(
      authorize(adminAuth, testDb.db, headersWith(ops.cookie), 'kyc.review'),
    ).resolves.toBeDefined();
    await setRolePermission(testDb.db, system, {
      roleKey: 'operations',
      permission: 'kyc.review',
      granted: false,
    });
    await expect(
      authorize(adminAuth, testDb.db, headersWith(ops.cookie), 'kyc.review'),
    ).rejects.toMatchObject({
      reason: 'forbidden',
    });
    await setRolePermission(testDb.db, system, {
      roleKey: 'operations',
      permission: 'kyc.review',
      granted: true,
    });
  });

  it('shuts out deactivated staff at once', async () => {
    const leaver = await signedInStaff('auth.leaver@example.test', 'finance');
    await setStaffActive(testDb.db, system, { userId: leaver.userId, active: false });
    await expect(
      authorize(adminAuth, testDb.db, headersWith(leaver.cookie), 'ledger.read'),
    ).rejects.toMatchObject({
      reason: 'signed_out',
    });
  });
});
