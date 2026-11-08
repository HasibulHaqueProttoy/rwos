# 0002: Monorepo tooling and local services

Date: 2026-11-08 · Status: accepted

## Decisions

- **Versions:** pnpm 9.15 (pinned with `packageManager`), Turborepo 2, Next.js 16 (App Router, Turbopack), React 19, Vitest 5, Prettier 3. Shared versions live in one pnpm catalog in `pnpm-workspace.yaml`.
- **TypeScript 6.0, not 7.0:** TypeScript 7 (the native compiler) is out, but typescript-eslint supports only versions below 6.1. Move to 7 when the lint tooling supports it.
- **ESLint 9, not 10:** the Next.js, jsx-a11y and React plugins do not support ESLint 10 yet. One flat config at the root (`eslint.config.mjs`) built by `createConfig()` in `@rwos/config`, with type-aware rules (for example unhandled promises are errors) and accessibility rules for the apps.
- **Internal packages are used as TypeScript source** (`exports` points at `src/index.ts`), with no build step. Next.js compiles them through `transpilePackages`; the worker runs them with `tsx`.
- **Worker runs with `tsx`** in development and for now in production too. A bundled production build can be added when deployment is decided.
- **Environment:** one `.env.local` at the repository root. Next.js apps load it with `@next/env` in `next.config.ts`; the worker loads it with Node's `--env-file-if-exists`. `parseServerEnv()` in `@rwos/config/env` validates it with Zod at startup and reports only variable names, never values.
- **Node:** `.nvmrc` says 22 LTS and `engines` allows 22.12 or newer. Newer versions work for development.
- **MinIO image:** the official `minio/minio` images are no longer published on Docker Hub or Quay. Local storage uses `pgsty/minio`, a maintained community build of the same MinIO server, pinned to a release tag. It is only used locally; production uses a managed S3-compatible service (see RUNBOOK). If that image stops being maintained, switch to another S3-compatible server; app code only sees the `FileStorage` interface, so nothing else changes.
- **Postgres host port 5433** by default, to avoid clashing with a Postgres already installed on developer machines. Configurable with `POSTGRES_HOST_PORT`.
- **`pnpm dev` starts the Docker services first** (waiting for health checks), so one command starts everything.

## Why

Keep the build reproducible and the tooling on versions that work together, and keep every outside dependency replaceable.
