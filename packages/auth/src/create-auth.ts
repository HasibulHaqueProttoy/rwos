import { recordAudit } from '@rwos/core';
import { type Database, type SessionAudience, schema } from '@rwos/db';
import type { EmailSender } from '@rwos/integrations';
import { betterAuth, type BetterAuthPlugin } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { emailOTP, twoFactor } from 'better-auth/plugins';
import { signInCodeEmail } from './emails';
import { policies, SIGN_IN_CODE } from './policy';
import { findActiveStaff, isLiveUser } from './staff';

export interface CreateAuthOptions {
  /** `admin` for admin.rocketwave.co (staff), `customer` for app.rocketwave.co. */
  audience: SessionAudience;
  db: Database;
  email: EmailSender;
  /** AUTH_SECRET: signs cookies and encrypts two-factor secrets. Same value in both apps. */
  secret: string;
  /** The app's own URL (APP_URL or ADMIN_URL); requests from other origins are refused. */
  baseURL: string;
  /** Customer app only, and only when both values are set. */
  google?: { clientId: string; clientSecret: string } | undefined;
  /** Rate limiting of sign-in endpoints. On by default; tests may turn it off. */
  rateLimit?: boolean;
}

const EMAIL_CODE_SIGN_IN = '/sign-in/email-otp';
const TWO_FACTOR_VERIFY_PATHS = new Set([
  '/two-factor/verify-totp',
  '/two-factor/verify-backup-code',
]);

/**
 * Better Auth's two-factor plugin challenges only password sign-ins. Rocket Wave signs in
 * with emailed codes, so this reuses the plugin's own challenge for the email-code sign-in
 * too: when a user has two-factor on, the emailed code alone never yields a session.
 * A test fails if a Better Auth upgrade changes this hook.
 */
function twoFactorAlsoForEmailCodes(plugin: ReturnType<typeof twoFactor>) {
  const hook = plugin.hooks?.after?.[0];
  if (!hook)
    throw new Error('better-auth two-factor plugin has no sign-in hook; review the upgrade');
  const challengesPasswordSignIn = hook.matcher.bind(hook);
  hook.matcher = (context) =>
    challengesPasswordSignIn(context) || context.path === EMAIL_CODE_SIGN_IN;
  return plugin;
}

/**
 * Records successful sign-ins in the audit log. It is a plugin listed after two-factor so it
 * runs after the two-factor challenge: a sign-in waiting for its second factor has no
 * session yet and is not recorded.
 */
function auditSignIns(db: Database, audience: SessionAudience): BetterAuthPlugin {
  return {
    id: 'rw-audit-sign-in',
    hooks: {
      after: [
        {
          matcher: (context) =>
            context.path === EMAIL_CODE_SIGN_IN || TWO_FACTOR_VERIFY_PATHS.has(context.path ?? ''),
          handler: createAuthMiddleware(async (ctx) => {
            const created = ctx.context.newSession;
            if (!created) return;
            // An authenticator check made from an existing session is two-factor setup, which
            // also issues a fresh session; it is audited as auth.two_factor_enabled, not a sign-in.
            if (TWO_FACTOR_VERIFY_PATHS.has(ctx.path) && ctx.context.session) return;
            const method =
              ctx.path === EMAIL_CODE_SIGN_IN
                ? 'email_code'
                : ctx.path === '/two-factor/verify-backup-code'
                  ? 'email_code_and_backup_code'
                  : 'email_code_and_totp';
            await recordAudit(db, {
              actorUserId: created.user.id,
              action: 'auth.sign_in',
              subjectType: 'session',
              subjectId: created.session.id,
              after: { audience, method },
              ip: created.session.ipAddress ?? null,
              userAgent: created.session.userAgent ?? null,
            });
          }),
        },
      ],
    },
  };
}

export function createAuth(options: CreateAuthOptions) {
  const { audience, db } = options;
  const policy = policies[audience];

  return betterAuth({
    appName: 'Rocket Wave',
    baseURL: options.baseURL,
    secret: options.secret,
    trustedOrigins: [options.baseURL],
    telemetry: { enabled: false },
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: {
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verifications,
        twoFactor: schema.twoFactors,
        rateLimit: schema.rateLimits,
      },
    }),
    advanced: {
      cookiePrefix: policy.cookiePrefix,
      database: { generateId: 'uuid' },
    },
    // No passwords anywhere: everyone signs in with an emailed code.
    emailAndPassword: { enabled: false },
    socialProviders:
      audience === 'customer' && options.google
        ? {
            google: {
              clientId: options.google.clientId,
              clientSecret: options.google.clientSecret,
            },
          }
        : {},
    account: { encryptOAuthTokens: true },
    user: {
      additionalFields: {
        phone: { type: 'string', required: false },
        timezone: { type: 'string', required: false },
        // Never accepted from a request: only staff provisioning sets it.
        isStaff: { type: 'boolean', required: false, defaultValue: false, input: false },
      },
    },
    session: {
      expiresIn: policy.sessionSeconds,
      updateAge: policy.renewAfterSeconds,
      additionalFields: {
        audience: { type: 'string', required: true, input: false },
      },
    },
    rateLimit: {
      enabled: options.rateLimit ?? true,
      storage: 'database',
      window: 60,
      max: 100,
      customRules: {
        '/email-otp/send-verification-otp': { window: 60, max: 3 },
        [EMAIL_CODE_SIGN_IN]: { window: 60, max: 5 },
        '/two-factor/*': { window: 60, max: 5 },
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: () => Promise.resolve(policy.allowSignUp ? undefined : false),
        },
        update: {
          after: async (user, ctx) => {
            const path = ctx?.path;
            const action =
              path === '/two-factor/verify-totp' && user.twoFactorEnabled
                ? 'auth.two_factor_enabled'
                : path === '/two-factor/disable'
                  ? 'auth.two_factor_disabled'
                  : null;
            if (action)
              await recordAudit(db, {
                actorUserId: user.id,
                action,
                subjectType: 'user',
                subjectId: user.id,
              });
          },
        },
      },
      session: {
        create: {
          // Stamp the app on every session, and refuse sessions for deleted users and,
          // in the admin, for anyone who is not active staff.
          before: async (session) => {
            const allowed =
              audience === 'admin'
                ? Boolean(await findActiveStaff(db, { userId: session.userId }))
                : await isLiveUser(db, session.userId);
            if (!allowed) return false;
            return { data: { ...session, audience } };
          },
        },
      },
    },
    hooks: {
      before: createAuthMiddleware((ctx) => {
        if (ctx.path === '/two-factor/disable' && !policy.allowTwoFactorDisable) {
          throw new APIError('FORBIDDEN', {
            message: 'Two-factor authentication is required for staff accounts.',
          });
        }
        const body = ctx.body as { trustDevice?: unknown } | undefined;
        if (
          TWO_FACTOR_VERIFY_PATHS.has(ctx.path) &&
          !policy.allowTrustedDevices &&
          body?.trustDevice
        ) {
          throw new APIError('BAD_REQUEST', {
            message: 'Staff accounts cannot skip two-factor on a trusted device.',
          });
        }
        return Promise.resolve();
      }),
    },
    plugins: [
      emailOTP({
        otpLength: SIGN_IN_CODE.length,
        expiresIn: SIGN_IN_CODE.expiresInSeconds,
        allowedAttempts: SIGN_IN_CODE.allowedAttempts,
        storeOTP: 'hashed',
        disableSignUp: !policy.allowSignUp,
        async sendVerificationOTP({ email, otp, type }) {
          if (type !== 'sign-in') return;
          // The admin only emails active staff. Others get the same "code sent" reply,
          // so the admin never reveals who has an account.
          if (audience === 'admin' && !(await findActiveStaff(db, { email }))) return;
          await options.email.send(signInCodeEmail(email, otp, policy.emailSubject));
        },
      }),
      twoFactorAlsoForEmailCodes(
        twoFactor({
          issuer: audience === 'admin' ? 'Rocket Wave admin' : 'Rocket Wave',
          // Accounts have no password; the session (after the emailed code) proves who is asking.
          allowPasswordless: true,
        }),
      ),
      auditSignIns(db, audience),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
