import { parseArgs } from 'node:util';
import { parseDatabaseEnv } from '@rwos/config/env';
import { createDatabase } from '@rwos/db';
import { IdentityError } from '../identity/errors';
import { createStaffMember } from '../identity/service';

// pnpm staff:create --email person@rocketwave.co --name "Full Name" --role founder
// Creates a staff account (run `pnpm db:seed:reference` first so the roles exist).
// The person then signs in at the admin with an emailed code and sets up two-factor.
try {
  const { values } = parseArgs({
    options: {
      email: { type: 'string' },
      name: { type: 'string' },
      role: { type: 'string' },
      'partner-id': { type: 'string' },
    },
  });
  if (!values.email || !values.name || !values.role) {
    throw new Error(
      'Usage: pnpm staff:create --email <email> --name "<full name>" --role <role key>',
    );
  }
  const env = parseDatabaseEnv();
  const { db, close } = createDatabase(env.DATABASE_URL, { max: 1 });
  try {
    const { userId } = await createStaffMember(
      db,
      { userId: null, userAgent: 'staff:create command' },
      {
        email: values.email,
        name: values.name,
        roleKey: values.role,
        partnerId: values['partner-id'],
      },
    );
    console.info(
      `[staff] created ${values.role} account ${userId}. They can now sign in at the admin.`,
    );
  } finally {
    await close();
  }
} catch (error) {
  const message =
    error instanceof IdentityError || error instanceof Error ? error.message : String(error);
  console.error(`[staff] not created: ${message}`);
  process.exitCode = 1;
}
