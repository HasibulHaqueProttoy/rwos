import { parseDatabaseEnv } from '@rwos/config/env';
import { createDatabase, runSeeds } from '@rwos/db';
import { referenceSeeds, sampleSeeds } from '../seeds';

// `pnpm db:seed`: reference data plus generated sample data (refused in production).
// `pnpm db:seed:reference`: reference data only, safe for every environment.
const includeSample = process.argv.includes('--sample');

try {
  const env = parseDatabaseEnv();
  const { db, close } = createDatabase(env.DATABASE_URL, { max: 1 });
  try {
    await runSeeds(db, {
      includeSample,
      nodeEnv: env.NODE_ENV,
      logger: console,
      seeds: { reference: referenceSeeds, sample: sampleSeeds },
    });
  } finally {
    await close();
  }
} catch (error) {
  console.error(`[seed] failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
