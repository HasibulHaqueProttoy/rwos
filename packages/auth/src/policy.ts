import type { SessionAudience } from '@rwos/db';

/**
 * Session and sign-in rules per app. Staff rules come from docs/SECURITY.md; customer
 * session length is decision 0007.
 */
export interface AudiencePolicy {
  /** Session lifetime in seconds, renewed while the user is active (an idle timeout). */
  sessionSeconds: number;
  /** How often activity renews the session, in seconds. */
  renewAfterSeconds: number;
  /** Whether a new account can be created by signing in. */
  allowSignUp: boolean;
  /** Whether the user may turn two-factor off again. */
  allowTwoFactorDisable: boolean;
  /** Whether "trust this device" may skip two-factor for a while. */
  allowTrustedDevices: boolean;
  cookiePrefix: string;
  emailSubject: string;
}

export const policies: Record<SessionAudience, AudiencePolicy> = {
  admin: {
    // SECURITY.md: staff sessions expire after 12 hours of inactivity.
    sessionSeconds: 12 * 60 * 60,
    renewAfterSeconds: 5 * 60,
    // Staff accounts are created by an admin, never by signing in.
    allowSignUp: false,
    // SECURITY.md: two-factor is required for staff.
    allowTwoFactorDisable: false,
    allowTrustedDevices: false,
    cookiePrefix: 'rw-admin',
    emailSubject: 'Your Rocket Wave admin sign-in code',
  },
  customer: {
    sessionSeconds: 7 * 24 * 60 * 60,
    renewAfterSeconds: 24 * 60 * 60,
    // Customers create their account at checkout with an emailed code.
    allowSignUp: true,
    // SECURITY.md: two-factor is optional for customers.
    allowTwoFactorDisable: true,
    allowTrustedDevices: true,
    cookiePrefix: 'rw',
    emailSubject: 'Your Rocket Wave sign-in code',
  },
};

/** Emailed sign-in codes: 6 digits, valid 5 minutes, 3 tries. */
export const SIGN_IN_CODE = { length: 6, expiresInSeconds: 5 * 60, allowedAttempts: 3 } as const;
