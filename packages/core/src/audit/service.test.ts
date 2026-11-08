import { describe, expect, it } from 'vitest';
import { auditEntrySchema } from './schema';

const base = { actorUserId: '6f1c2c1e-6e0f-4d64-9a51-6b8f7c1d2e3f', action: 'auth.sign_in' };

describe('auditEntrySchema', () => {
  it('accepts a dotted action and an optional subject', () => {
    expect(auditEntrySchema.parse({ ...base, subjectType: 'session' }).action).toBe('auth.sign_in');
  });

  it('allows a system actor (null)', () => {
    expect(auditEntrySchema.parse({ ...base, actorUserId: null }).actorUserId).toBeNull();
  });

  it.each(['signIn', 'auth', 'Auth.Sign_in', 'auth..sign_in', 'auth.sign-in'])(
    'rejects the action "%s"',
    (action) => {
      expect(() => auditEntrySchema.parse({ ...base, action })).toThrow();
    },
  );

  it('cuts a very long user agent instead of failing', () => {
    const parsed = auditEntrySchema.parse({ ...base, userAgent: 'x'.repeat(2000) });
    expect(parsed.userAgent).toHaveLength(512);
  });
});
