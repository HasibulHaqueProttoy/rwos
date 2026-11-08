import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { baseTestConfig } from '@rwos/config/vitest';
import { defineProject } from 'vitest/config';

// Locally, read DATABASE_URL from the root .env.local; in CI it comes from the job.
const rootEnv = new URL('../../.env.local', import.meta.url);
if (!process.env.DATABASE_URL && existsSync(rootEnv)) loadEnvFile(rootEnv);

export default defineProject({
  test: {
    ...baseTestConfig,
    include: ['src/**/*.int.test.ts'],
    // Each test file creates its own throwaway database, so files can run in parallel.
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
