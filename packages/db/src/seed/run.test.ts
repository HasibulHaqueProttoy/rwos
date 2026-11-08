import { describe, expect, it, vi } from 'vitest';
import type { Transaction } from '../client';
import { runSeeds, SampleDataInProductionError } from './run';
import type { Seed } from './types';

const fakeTx = {} as Transaction;
const fakeDb = {
  transaction: vi.fn(<T>(work: (tx: Transaction) => Promise<T>) => work(fakeTx)),
};

function seed(name: string, calls: string[]): Seed {
  return {
    name,
    run: (tx) => {
      expect(tx).toBe(fakeTx);
      calls.push(name);
      return Promise.resolve();
    },
  };
}

describe('runSeeds', () => {
  it('runs reference seeds only by default, each in its own transaction', async () => {
    const calls: string[] = [];
    const ran = await runSeeds(fakeDb as never, {
      includeSample: false,
      nodeEnv: 'development',
      logger: { info: vi.fn() },
      seeds: { reference: [seed('roles', calls)], sample: [seed('demo', calls)] },
    });
    expect(ran).toEqual(['roles']);
    expect(calls).toEqual(['roles']);
    expect(fakeDb.transaction).toHaveBeenCalledTimes(1);
  });

  it('runs reference before sample when sample data is asked for', async () => {
    const calls: string[] = [];
    await runSeeds(fakeDb as never, {
      includeSample: true,
      nodeEnv: 'development',
      logger: { info: vi.fn() },
      seeds: { reference: [seed('roles', calls)], sample: [seed('demo', calls)] },
    });
    expect(calls).toEqual(['roles', 'demo']);
  });

  it('refuses sample data in production before touching the database', async () => {
    const transaction = vi.fn();
    await expect(
      runSeeds({ transaction } as never, {
        includeSample: true,
        nodeEnv: 'production',
        logger: { info: vi.fn() },
        seeds: { reference: [], sample: [] },
      }),
    ).rejects.toThrow(SampleDataInProductionError);
    expect(transaction).not.toHaveBeenCalled();
  });

  it('allows reference data in production', async () => {
    const calls: string[] = [];
    await runSeeds(fakeDb as never, {
      includeSample: false,
      nodeEnv: 'production',
      logger: { info: vi.fn() },
      seeds: { reference: [seed('roles', calls)], sample: [] },
    });
    expect(calls).toEqual(['roles']);
  });

  it('says so when there is nothing to seed', async () => {
    const logger = { info: vi.fn() };
    await runSeeds(fakeDb as never, {
      includeSample: true,
      nodeEnv: 'test',
      logger,
      seeds: { reference: [], sample: [] },
    });
    expect(logger.info).toHaveBeenCalledWith('[seed] nothing to seed yet');
  });
});
