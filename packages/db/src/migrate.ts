import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { createDatabase } from './client';

export const migrationsFolder = fileURLToPath(new URL('../migrations', import.meta.url));

export interface MigrationResult {
  /** How many tables had the `set_updated_at` trigger attached in this run. */
  triggersAttached: number;
}

/**
 * Applies every pending migration, then attaches the `set_updated_at` trigger to any
 * table that has an `updated_at` column and no trigger yet. Safe to run repeatedly.
 */
export async function runMigrations(url: string): Promise<MigrationResult> {
  const { db, sql, close } = createDatabase(url, { max: 1 });
  try {
    await migrate(db, { migrationsFolder });
    const [row] = await sql<
      { attached: number }[]
    >`select ensure_updated_at_triggers() as attached`;
    return { triggersAttached: row?.attached ?? 0 };
  } finally {
    await close();
  }
}
