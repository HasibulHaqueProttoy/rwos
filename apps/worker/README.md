# @rwos/worker

Background job runner: reminders, webhooks, exports, outbox delivery.

- `pnpm dev` (from the root) runs it with `tsx watch`, reading the root `.env.local`.
- It checks the environment with `parseServerEnv()` and exits with the names of any missing variables.
- It stops cleanly on SIGINT and SIGTERM.

Status: stays alive and logs only. The outbox loop and BullMQ queues arrive in task 1.9.
