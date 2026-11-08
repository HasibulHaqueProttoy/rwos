import { randomUUID } from 'node:crypto';
import { parseDatabaseEnv } from '@rwos/config/env';
import postgres from 'postgres';
import { createDatabase } from './client';
import { runMigrations } from './migrate';

/**
 * Creates a fresh, fully migrated database for one test file, on the server in
 * DATABASE_URL, and returns a client plus `drop()` to delete it afterwards.
 * Only for local development and CI; refused when NODE_ENV is production.
 */
export async function createTestDatabase(baseUrl?: string) {
  const env = parseDatabaseEnv();
  if (env.NODE_ENV === 'production') {
    throw new Error('createTestDatabase is not allowed in production.');
  }
  const serverUrl = baseUrl ?? env.DATABASE_URL;
  // The name is generated here, never taken from input, so it is safe to put in SQL.
  const name = `rwos_test_${randomUUID().replaceAll('-', '').slice(0, 16)}`;

  await withAdmin(serverUrl, (admin) => admin.unsafe(`create database "${name}"`));

  const url = new URL(serverUrl);
  url.pathname = `/${name}`;
  await runMigrations(url.toString());

  const handle = createDatabase(url.toString(), { max: 5 });
  return {
    ...handle,
    name,
    url: url.toString(),
    async drop() {
      await handle.close();
      await withAdmin(serverUrl, (admin) =>
        admin.unsafe(`drop database if exists "${name}" with (force)`),
      );
    },
  };
}

async function withAdmin(url: string, action: (admin: postgres.Sql) => Promise<unknown>) {
  const admin = postgres(url, { max: 1, onnotice: () => undefined });
  try {
    await action(admin);
  } finally {
    await admin.end({ timeout: 5 });
  }
}
