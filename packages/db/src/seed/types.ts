import type { Transaction } from '../client';

/**
 * One seed step. It must be idempotent: running it twice leaves the same rows
 * (use upserts keyed on a natural key such as a role key or product code).
 */
export interface Seed {
  /** Shown in the log, for example "roles and permissions". */
  name: string;
  run(tx: Transaction): Promise<void>;
}
