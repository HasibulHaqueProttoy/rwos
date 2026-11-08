import { parseDatabaseEnv } from '@rwos/config/env';
import { runMigrations } from '../migrate';

// `pnpm db:migrate`: applies pending migrations to DATABASE_URL.
// The URL is never printed, because it contains the database password.
try {
  const env = parseDatabaseEnv();
  const result = await runMigrations(env.DATABASE_URL);
  console.info(`[migrate] done; updated_at triggers attached: ${result.triggersAttached}`);
} catch (error) {
  console.error(`[migrate] failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
