import { parseServerEnv } from '@rwos/config/env';
import { startWorker } from './worker';

const worker = startWorker(parseServerEnv(), console);

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    worker.stop(signal);
    process.exit(0);
  });
}
