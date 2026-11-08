import type { ServerEnv } from '@rwos/config/env';

export interface Logger {
  info(message: string): void;
}

export interface RunningWorker {
  stop(reason: string): void;
}

/**
 * Starts the background worker. For now it only stays alive; the outbox loop and
 * BullMQ queues arrive in task 1.9.
 */
export function startWorker(env: Pick<ServerEnv, 'NODE_ENV'>, logger: Logger): RunningWorker {
  logger.info(`[worker] started (${env.NODE_ENV})`);
  const keepAlive = setInterval(() => undefined, 60_000);
  let stopped = false;

  return {
    stop(reason) {
      if (stopped) return;
      stopped = true;
      clearInterval(keepAlive);
      logger.info(`[worker] stopping (${reason})`);
    },
  };
}
