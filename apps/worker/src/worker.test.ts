import { describe, expect, it, vi } from 'vitest';
import { startWorker } from './worker';

describe('startWorker', () => {
  it('logs start and stop once', () => {
    const logger = { info: vi.fn() };
    const worker = startWorker({ NODE_ENV: 'test' }, logger);
    worker.stop('SIGTERM');
    worker.stop('SIGTERM');

    expect(logger.info.mock.calls).toEqual([
      ['[worker] started (test)'],
      ['[worker] stopping (SIGTERM)'],
    ]);
  });

  it('keeps the process alive until stopped', () => {
    vi.useFakeTimers();
    const worker = startWorker({ NODE_ENV: 'test' }, { info: vi.fn() });
    expect(vi.getTimerCount()).toBe(1);
    worker.stop('test');
    expect(vi.getTimerCount()).toBe(0);
    vi.useRealTimers();
  });
});
