import type { ServerEnv } from '@rwos/config/env';
import { createDatabase, type Database, type SessionAudience } from '@rwos/db';
import { createEmailSender } from '@rwos/integrations';
import { type Auth, createAuth } from './create-auth';

export interface AuthServices {
  auth: Auth;
  db: Database;
}

/** Builds the database client, email sender and auth for one app from its validated environment. */
export function createAuthServices(audience: SessionAudience, env: ServerEnv): AuthServices {
  const { db } = createDatabase(env.DATABASE_URL);
  const email = createEmailSender(env.EMAIL_PROVIDER, {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    from: env.SMTP_FROM,
    user: env.SMTP_USER,
    password: env.SMTP_PASSWORD,
  });
  const google =
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET }
      : undefined;
  const auth = createAuth({
    audience,
    db,
    email,
    secret: env.AUTH_SECRET,
    baseURL: audience === 'admin' ? env.ADMIN_URL : env.APP_URL,
    google,
  });
  return { auth, db };
}
