import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export interface DatabaseOptions {
  /** Most connections the pool may open. */
  max?: number;
}

/**
 * Opens a connection pool and the Drizzle client. Server-side only.
 * Call `close()` when a script or test is done, so the process can exit.
 */
export function createDatabase(url: string, options: DatabaseOptions = {}) {
  const sql = postgres(url, {
    max: options.max ?? 10,
    // Postgres notices ("relation already exists, skipping") are not errors.
    onnotice: () => undefined,
  });
  const db = drizzle(sql, { schema, casing: 'snake_case' });
  return { db, sql, close: () => sql.end({ timeout: 5 }) };
}

export type Database = ReturnType<typeof createDatabase>['db'];
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];
