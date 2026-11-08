import { z } from 'zod';

/** An optional setting: an empty value (as copied from .env.example) counts as not set. */
const optionalString = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().min(1).optional(),
);

const booleanString = z.enum(['true', 'false']).transform((value) => value === 'true');

/** Server-side environment shared by every app. Names match .env.example. */
export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_URL: z.url(),
  ADMIN_URL: z.url(),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  REDIS_URL: z.url({ protocol: /^rediss?$/ }),
  S3_ENDPOINT: z.url(),
  S3_REGION: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  S3_FORCE_PATH_STYLE: booleanString.default(false),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535),
  SMTP_FROM: z.email(),
  SMTP_USER: optionalString,
  SMTP_PASSWORD: optionalString,
  EMAIL_PROVIDER: z.enum(['smtp', 'test']).default('smtp'),
  /** Signs sessions and encrypts two-factor secrets. At least 32 characters; generate with `openssl rand -base64 32`. */
  AUTH_SECRET: z.string().min(32),
  /** Google sign-in for customers; both or neither. */
  GOOGLE_CLIENT_ID: optionalString,
  GOOGLE_CLIENT_SECRET: optionalString,
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export class InvalidEnvError extends Error {
  constructor(readonly variableNames: string[]) {
    // Only names go in the message, never values: they may be secrets.
    super(`Invalid or missing environment variables: ${variableNames.join(', ')}`);
    this.name = 'InvalidEnvError';
  }
}

/** Environment needed by database scripts (migrate, seed) and tests. */
export const databaseEnvSchema = serverEnvSchema.pick({ NODE_ENV: true, DATABASE_URL: true });

export type DatabaseEnv = z.infer<typeof databaseEnvSchema>;

/** Validates `source` against `schema`, reporting only the names of bad variables. */
export function parseEnv<Schema extends z.ZodType>(
  schema: Schema,
  source: NodeJS.ProcessEnv = process.env,
): z.infer<Schema> {
  const result = schema.safeParse(source);
  if (!result.success) {
    const names = [...new Set(result.error.issues.map((issue) => String(issue.path[0])))];
    throw new InvalidEnvError(names.sort());
  }
  return result.data;
}

export function parseServerEnv(source: NodeJS.ProcessEnv = process.env): ServerEnv {
  return parseEnv(serverEnvSchema, source);
}

export function parseDatabaseEnv(source: NodeJS.ProcessEnv = process.env): DatabaseEnv {
  return parseEnv(databaseEnvSchema, source);
}
