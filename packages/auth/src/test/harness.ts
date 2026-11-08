import { randomBytes } from 'node:crypto';
import { base32 } from '@better-auth/utils/base32';
import { createOTP } from '@better-auth/utils/otp';
import { type Database, type SessionAudience, schema } from '@rwos/db';
import type { TestEmailSender } from '@rwos/integrations';
import { expect } from 'vitest';
import { type Auth, createAuth } from '../create-auth';

/** A fresh random AUTH_SECRET for each test run; never a fixed value in the code. */
export const SECRET = randomBytes(32).toString('base64');
export const ADMIN_URL = 'http://localhost:3001';
export const APP_URL = 'http://localhost:3000';

export function makeAuth(
  audience: SessionAudience,
  db: Database,
  email: TestEmailSender,
  rateLimit = false,
): Auth {
  return createAuth({
    audience,
    db,
    email,
    secret: SECRET,
    baseURL: audience === 'admin' ? ADMIN_URL : APP_URL,
    rateLimit,
  });
}

/** Turns Set-Cookie response headers into a Cookie request header, merged with earlier cookies. */
export function cookiesFrom(response: Headers, previous = ''): string {
  const jar = new Map(
    previous
      .split('; ')
      .filter(Boolean)
      .map((pair) => [pair.slice(0, pair.indexOf('=')), pair] as const),
  );
  for (const line of response.getSetCookie()) {
    const pair = line.split(';')[0] ?? '';
    const name = pair.slice(0, pair.indexOf('='));
    const value = pair.slice(pair.indexOf('=') + 1);
    if (value === '' || /max-age=0/i.test(line)) jar.delete(name);
    else jar.set(name, pair);
  }
  return [...jar.values()].join('; ');
}

export function codeFromEmail(email: TestEmailSender, to: string): string {
  // Better Auth sends to the lower-case address.
  const message = email.lastTo(to.toLowerCase());
  const code = /sign-in code is (\d{6})/.exec(message?.text ?? '')?.[1];
  expect(code, `no sign-in code emailed to ${to}`).toBeDefined();
  return code ?? '';
}

/** Requests a code and signs in with it. Returns the cookies and the JSON reply. */
export async function signInWithEmailCode(auth: Auth, email: TestEmailSender, address: string) {
  await auth.api.sendVerificationOTP({ body: { email: address, type: 'sign-in' } });
  const otp = codeFromEmail(email, address);
  const { headers, response } = await auth.api.signInEmailOTP({
    body: { email: address, otp },
    headers: new Headers({ 'user-agent': 'vitest', 'x-forwarded-for': '203.0.113.7' }),
    returnHeaders: true,
  });
  return { cookie: cookiesFrom(headers), response: response as Record<string, unknown> };
}

/** The current authenticator code for a secret shown in a totpURI (otpauth://...?secret=BASE32). */
export function totpCode(totpURI: string): Promise<string> {
  const secret = new URL(totpURI).searchParams.get('secret') ?? '';
  return createOTP(base32.decode(secret)).totp();
}

let roleCounter = 0;

/** Creates an active staff member with a placeholder role (roles are seeded in task 1.7). */
export async function createStaff(db: Database, emailAddress: string, active = true) {
  roleCounter += 1;
  const [role] = await db
    .insert(schema.roles)
    .values({ key: `test_role_${roleCounter}`, name: 'Test role' })
    .returning({ id: schema.roles.id });
  const [user] = await db
    .insert(schema.users)
    .values({ email: emailAddress, name: 'Sample Staff', isStaff: true, emailVerified: true })
    .returning({ id: schema.users.id });
  await db
    .insert(schema.staffMembers)
    .values({ userId: user?.id ?? '', roleId: role?.id ?? '', active });
  return user?.id ?? '';
}

/** Turns on authenticator-app two-factor for the signed-in user and returns its setup link. */
export async function enableTotp(auth: Auth, headers: Headers): Promise<string> {
  const reply = await auth.api.enableTwoFactor({ body: {}, headers });
  if (reply.method !== 'totp')
    throw new Error(`Expected an authenticator setup, got ${reply.method}`);
  return reply.totpURI;
}
