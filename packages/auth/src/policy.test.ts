import { describe, expect, it } from 'vitest';
import { signInCodeEmail } from './emails';
import { policies, SIGN_IN_CODE } from './policy';

describe('session and sign-in rules', () => {
  it('staff sessions end after 12 hours without activity (SECURITY.md)', () => {
    expect(policies.admin.sessionSeconds).toBe(12 * 60 * 60);
    expect(policies.admin.renewAfterSeconds).toBeLessThan(policies.admin.sessionSeconds);
  });

  it('staff cannot sign up, turn two-factor off or trust a device', () => {
    expect(policies.admin).toMatchObject({
      allowSignUp: false,
      allowTwoFactorDisable: false,
      allowTrustedDevices: false,
    });
  });

  it('customers can sign up and choose two-factor', () => {
    expect(policies.customer).toMatchObject({ allowSignUp: true, allowTwoFactorDisable: true });
  });

  it('the two apps use different cookie names', () => {
    expect(policies.admin.cookiePrefix).not.toBe(policies.customer.cookiePrefix);
  });

  it('sign-in codes are 6 digits, last 5 minutes and allow 3 tries', () => {
    expect(SIGN_IN_CODE).toEqual({ length: 6, expiresInSeconds: 300, allowedAttempts: 3 });
  });
});

describe('sign-in code email', () => {
  const message = signInCodeEmail('founder@example.test', '482915', policies.customer.emailSubject);

  it('puts the code in the body, never the subject line', () => {
    expect(message.text).toContain('482915');
    expect(message.subject).not.toContain('482915');
  });

  it('says how long the code lasts', () => {
    expect(message.text).toContain('5 minutes');
  });

  it('follows the copy rules: no exclamation marks or em-dashes', () => {
    for (const text of [message.subject, message.text, policies.admin.emailSubject]) {
      expect(text).not.toMatch(/[!—]/);
    }
  });
});
