import { schema } from '@rwos/db';
import { createTestDatabase } from '@rwos/db/testing';
import { TestEmailSender } from '@rwos/integrations';
import { and, eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Auth } from './create-auth';
import { policies } from './policy';
import { getCustomerSession, getStaffSession } from './sessions';
import {
  ADMIN_URL,
  codeFromEmail,
  cookiesFrom,
  createStaff,
  enableTotp,
  makeAuth,
  signInWithEmailCode,
  totpCode,
} from './test/harness';

let testDb: Awaited<ReturnType<typeof createTestDatabase>>;
const email = new TestEmailSender();
let customerAuth: Auth;
let adminAuth: Auth;

beforeAll(async () => {
  testDb = await createTestDatabase();
  customerAuth = makeAuth('customer', testDb.db, email);
  adminAuth = makeAuth('admin', testDb.db, email);
});

afterAll(async () => {
  await testDb?.drop();
});

beforeEach(() => {
  email.clear();
});

const headersWith = (cookie: string) => new Headers({ cookie });

async function auditActions(userId: string) {
  const rows = await testDb.db
    .select({ action: schema.auditLog.action, after: schema.auditLog.after })
    .from(schema.auditLog)
    .where(eq(schema.auditLog.actorUserId, userId))
    .orderBy(schema.auditLog.createdAt);
  return rows;
}

/** Signs a staff member in and sets up their authenticator; returns the totpURI. */
async function enrolStaff(address: string) {
  const { cookie } = await signInWithEmailCode(adminAuth, email, address);
  const totpURI = await enableTotp(adminAuth, headersWith(cookie));
  await adminAuth.api.verifyTOTP({
    body: { code: await totpCode(totpURI) },
    headers: headersWith(cookie),
  });
  return { cookie, totpURI };
}

describe('customer sign-in with an emailed code', () => {
  it('emails a 6-digit code and signs a new customer in', async () => {
    const address = 'new.founder@example.test';
    const { cookie } = await signInWithEmailCode(customerAuth, email, address);

    const message = email.lastTo(address);
    expect(message?.subject).toBe('Your Rocket Wave sign-in code');
    expect(message?.subject).not.toMatch(/\d{6}/);
    expect(message?.text).not.toContain('!');

    const result = await getCustomerSession(customerAuth, testDb.db, headersWith(cookie));
    expect(result.status).toBe('active');
    const [user] = await testDb.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, address));
    expect(user).toMatchObject({ emailVerified: true, isStaff: false });
  });

  it('stores the email in lower case', async () => {
    await signInWithEmailCode(customerAuth, email, 'Mixed.Case@Example.TEST');
    const rows = await testDb.db
      .select({ email: schema.users.email })
      .from(schema.users)
      .where(eq(schema.users.email, 'mixed.case@example.test'));
    expect(rows).toHaveLength(1);
  });

  it('never lets a sign-up make someone staff', async () => {
    const address = 'sneaky@example.test';
    await customerAuth.api.sendVerificationOTP({ body: { email: address, type: 'sign-in' } });
    const otp = codeFromEmail(email, address);
    await customerAuth.api
      .signInEmailOTP({ body: { email: address, otp, isStaff: true } as never })
      .catch(() => undefined);
    const [user] = await testDb.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, address));
    expect(user?.isStaff ?? false).toBe(false);
  });

  it('refuses the right code after three wrong ones', async () => {
    const address = 'typo@example.test';
    await customerAuth.api.sendVerificationOTP({ body: { email: address, type: 'sign-in' } });
    const otp = codeFromEmail(email, address);
    const wrong = otp === '000000' ? '111111' : '000000';
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await expect(
        customerAuth.api.signInEmailOTP({ body: { email: address, otp: wrong } }),
      ).rejects.toThrow();
    }
    await expect(
      customerAuth.api.signInEmailOTP({ body: { email: address, otp } }),
    ).rejects.toThrow();
  });

  it('records the sign-in in the audit log', async () => {
    const address = 'audited@example.test';
    await signInWithEmailCode(customerAuth, email, address);
    const [user] = await testDb.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, address));
    const actions = await auditActions(user?.id ?? '');
    expect(actions).toEqual([
      { action: 'auth.sign_in', after: { audience: 'customer', method: 'email_code' } },
    ]);
  });

  it('refuses a deleted user', async () => {
    const address = 'gone@example.test';
    await signInWithEmailCode(customerAuth, email, address);
    await testDb.db
      .update(schema.users)
      .set({ deletedAt: new Date() })
      .where(eq(schema.users.email, address));
    await expect(signInWithEmailCode(customerAuth, email, address)).rejects.toThrow();
  });

  it('lets a customer turn two-factor on, then asks for it at sign-in, and lets them turn it off', async () => {
    const address = 'careful@example.test';
    const { cookie } = await signInWithEmailCode(customerAuth, email, address);
    const totpURI = await enableTotp(customerAuth, headersWith(cookie));
    await customerAuth.api.verifyTOTP({
      body: { code: await totpCode(totpURI) },
      headers: headersWith(cookie),
    });

    const second = await signInWithEmailCode(customerAuth, email, address);
    expect(second.response.twoFactorRedirect).toBe(true);
    expect(
      (await getCustomerSession(customerAuth, testDb.db, headersWith(second.cookie))).status,
    ).toBe('signed_out');

    const { headers } = await customerAuth.api.verifyTOTP({
      body: { code: await totpCode(totpURI) },
      headers: headersWith(second.cookie),
      returnHeaders: true,
    });
    const signedIn = cookiesFrom(headers, second.cookie);
    expect((await getCustomerSession(customerAuth, testDb.db, headersWith(signedIn))).status).toBe(
      'active',
    );

    await expect(
      customerAuth.api.disableTwoFactor({ body: {}, headers: headersWith(signedIn) }),
    ).resolves.toBeDefined();
  });
});

describe('staff sign-in', () => {
  it('sends no code to an unknown email, and replies the same as for staff', async () => {
    const reply = await adminAuth.api.sendVerificationOTP({
      body: { email: 'stranger@example.test', type: 'sign-in' },
    });
    expect(reply).toEqual({ success: true });
    expect(email.sent).toHaveLength(0);
  });

  it('sends no code to a customer who is not staff', async () => {
    await signInWithEmailCode(customerAuth, email, 'customer.only@example.test');
    email.clear();
    const reply = await adminAuth.api.sendVerificationOTP({
      body: { email: 'customer.only@example.test', type: 'sign-in' },
    });
    expect(reply).toEqual({ success: true });
    expect(email.sent).toHaveLength(0);
  });

  it('cannot create accounts', async () => {
    await expect(
      adminAuth.api.signInEmailOTP({ body: { email: 'self.signup@example.test', otp: '123456' } }),
    ).rejects.toThrow();
    const rows = await testDb.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, 'self.signup@example.test'));
    expect(rows).toHaveLength(0);
  });

  it('must set up two-factor before using the admin', async () => {
    const address = 'new.staff@example.test';
    await createStaff(testDb.db, address);
    const { cookie } = await signInWithEmailCode(adminAuth, email, address);
    expect(email.lastTo(address)?.subject).toBe('Your Rocket Wave admin sign-in code');
    const result = await getStaffSession(adminAuth, testDb.db, headersWith(cookie));
    expect(result.status).toBe('two_factor_setup_required');
  });

  it('after setup, the emailed code alone is not enough: the authenticator code completes sign-in', async () => {
    const address = 'ops.staff@example.test';
    const userId = await createStaff(testDb.db, address);
    const { totpURI } = await enrolStaff(address);
    expect((await auditActions(userId)).map((row) => row.action)).toContain(
      'auth.two_factor_enabled',
    );

    const first = await signInWithEmailCode(adminAuth, email, address);
    expect(first.response.twoFactorRedirect).toBe(true);
    expect((await getStaffSession(adminAuth, testDb.db, headersWith(first.cookie))).status).toBe(
      'signed_out',
    );

    const { headers } = await adminAuth.api.verifyTOTP({
      body: { code: await totpCode(totpURI) },
      headers: headersWith(first.cookie),
      returnHeaders: true,
    });
    const signedIn = cookiesFrom(headers, first.cookie);
    const result = await getStaffSession(adminAuth, testDb.db, headersWith(signedIn));
    expect(result.status).toBe('active');

    // The emailed-code step waiting for two-factor is not recorded as a sign-in; the completed one is.
    const signIns = (await auditActions(userId)).filter((row) => row.action === 'auth.sign_in');
    expect(signIns.map((row) => row.after)).toEqual([
      { audience: 'admin', method: 'email_code' },
      { audience: 'admin', method: 'email_code_and_totp' },
    ]);
  });

  it('rejects a wrong authenticator code', async () => {
    const address = 'finance.staff@example.test';
    await createStaff(testDb.db, address);
    await enrolStaff(address);
    const first = await signInWithEmailCode(adminAuth, email, address);
    await expect(
      adminAuth.api.verifyTOTP({ body: { code: '000000' }, headers: headersWith(first.cookie) }),
    ).rejects.toThrow();
  });

  it('cannot turn two-factor off', async () => {
    const address = 'no.off@example.test';
    await createStaff(testDb.db, address);
    const { cookie } = await enrolStaff(address);
    await expect(
      adminAuth.api.disableTwoFactor({ body: {}, headers: headersWith(cookie) }),
    ).rejects.toThrow(/required for staff/);
  });

  it('cannot skip two-factor on a trusted device', async () => {
    const address = 'no.trust@example.test';
    await createStaff(testDb.db, address);
    const { totpURI } = await enrolStaff(address);
    const first = await signInWithEmailCode(adminAuth, email, address);
    await expect(
      adminAuth.api.verifyTOTP({
        body: { code: await totpCode(totpURI), trustDevice: true },
        headers: headersWith(first.cookie),
      }),
    ).rejects.toThrow(/trusted device/);
  });

  it('loses access when deactivated', async () => {
    const address = 'leaver@example.test';
    const userId = await createStaff(testDb.db, address);
    const { cookie } = await enrolStaff(address);
    await testDb.db
      .update(schema.staffMembers)
      .set({ active: false })
      .where(eq(schema.staffMembers.userId, userId));
    expect((await getStaffSession(adminAuth, testDb.db, headersWith(cookie))).status).toBe(
      'signed_out',
    );
    email.clear();
    await adminAuth.api.sendVerificationOTP({ body: { email: address, type: 'sign-in' } });
    expect(email.sent).toHaveLength(0);
  });

  it('expires after 12 hours without activity', async () => {
    const address = 'session.length@example.test';
    await createStaff(testDb.db, address);
    const { cookie } = await signInWithEmailCode(adminAuth, email, address);
    const result = await adminAuth.api.getSession({ headers: headersWith(cookie) });
    const lifetime = (new Date(result?.session.expiresAt ?? 0).getTime() - Date.now()) / 1000;
    expect(lifetime).toBeGreaterThan(policies.admin.sessionSeconds - 60);
    expect(lifetime).toBeLessThanOrEqual(policies.admin.sessionSeconds);
  });
});

describe('the two apps keep their sessions apart', () => {
  it('a customer session does not open the admin, and a staff session does not open the customer app', async () => {
    const customer = await signInWithEmailCode(customerAuth, email, 'apart.customer@example.test');
    expect((await getStaffSession(adminAuth, testDb.db, headersWith(customer.cookie))).status).toBe(
      'signed_out',
    );

    const address = 'apart.staff@example.test';
    await createStaff(testDb.db, address);
    const { cookie } = await enrolStaff(address);
    expect((await getCustomerSession(customerAuth, testDb.db, headersWith(cookie))).status).toBe(
      'signed_out',
    );
  });

  it('stamps every session with its app', async () => {
    const rows = await testDb.db
      .select({ audience: schema.sessions.audience })
      .from(schema.sessions);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) expect(['admin', 'customer']).toContain(row.audience);
  });

  it('even a stolen customer session token, sent with the admin cookie name, is refused', async () => {
    const customer = await signInWithEmailCode(customerAuth, email, 'token.swap@example.test');
    const swapped = customer.cookie.replaceAll('rw.session_token', 'rw-admin.session_token');
    expect((await getStaffSession(adminAuth, testDb.db, headersWith(swapped))).status).toBe(
      'signed_out',
    );
  });
});

describe('rate limiting', () => {
  it('refuses a fourth code request within a minute from the same address', async () => {
    const limited = makeAuth('admin', testDb.db, email, true);
    const send = () =>
      limited.handler(
        new Request(`${ADMIN_URL}/api/auth/email-otp/send-verification-otp`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            origin: ADMIN_URL,
            'x-forwarded-for': '198.51.100.20',
          },
          body: JSON.stringify({ email: 'limit@example.test', type: 'sign-in' }),
        }),
      );
    const statuses = [];
    for (let attempt = 0; attempt < 4; attempt += 1) statuses.push((await send()).status);
    expect(statuses).toEqual([200, 200, 200, 429]);
  });
});

describe('two-factor secrets', () => {
  it('are stored encrypted, never as the plain secret', async () => {
    const address = 'secret.storage@example.test';
    const userId = await createStaff(testDb.db, address);
    const { totpURI } = await enrolStaff(address);
    const plain = new URL(totpURI).searchParams.get('secret') ?? '';
    const [row] = await testDb.db
      .select({ secret: schema.twoFactors.secret })
      .from(schema.twoFactors)
      .where(and(eq(schema.twoFactors.userId, userId)));
    expect(row?.secret).toBeDefined();
    expect(row?.secret).not.toContain(plain);
  });
});
