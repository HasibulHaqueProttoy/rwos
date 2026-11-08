import { type AuthServices, createAuthServices } from '@rwos/auth';
import { parseServerEnv } from '@rwos/config/env';
import { loadEnvConfig } from '@next/env';
import path from 'node:path';

const cache = globalThis as unknown as { rwCustomerServices?: AuthServices };

/**
 * Server-side services (database, auth) for this app. Created on first use, not at build
 * time, and reused across hot reloads so development does not open a new pool each edit.
 */
export function getServices(): AuthServices {
  if (!cache.rwCustomerServices) {
    // Development reads the one .env.local at the repository root (Next.js only reads the
    // app folder's own files). Variables already set, as in production, always win.
    loadEnvConfig(path.resolve(process.cwd(), '../..'), process.env.NODE_ENV !== 'production');
    cache.rwCustomerServices = createAuthServices('customer', parseServerEnv());
  }
  return cache.rwCustomerServices;
}
