import type { Database } from '../client';
import type { Seed } from './types';

export interface RunSeedsOptions {
  /** Also load generated sample data. Refused in production. */
  includeSample: boolean;
  nodeEnv: 'development' | 'test' | 'production';
  logger: { info(message: string): void };
  /** Reference seeds (every environment) and sample seeds (local and CI only), in run order. */
  seeds: { reference: Seed[]; sample: Seed[] };
}

export class SampleDataInProductionError extends Error {
  constructor() {
    super('Sample data is never loaded in production. Use the reference seed only.');
    this.name = 'SampleDataInProductionError';
  }
}

/** Runs each seed in its own transaction, reference data first. Returns the names run. */
export async function runSeeds(
  db: Pick<Database, 'transaction'>,
  options: RunSeedsOptions,
): Promise<string[]> {
  if (options.includeSample && options.nodeEnv === 'production') {
    throw new SampleDataInProductionError();
  }
  const { seeds } = options;
  const toRun = options.includeSample ? [...seeds.reference, ...seeds.sample] : seeds.reference;

  const ran: string[] = [];
  for (const seed of toRun) {
    await db.transaction((tx) => seed.run(tx));
    options.logger.info(`[seed] ${seed.name}`);
    ran.push(seed.name);
  }
  if (ran.length === 0) options.logger.info('[seed] nothing to seed yet');
  return ran;
}
