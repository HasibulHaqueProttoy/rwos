# @rwos/config

Shared tooling for every package and app.

| Export | What it is |
| --- | --- |
| `@rwos/config/tsconfig/base.json` | Strict TypeScript settings for all code |
| `@rwos/config/tsconfig/library.json` | For packages under `packages/` and the worker |
| `@rwos/config/tsconfig/nextjs.json` | For the Next.js apps (adds DOM and JSX) |
| `@rwos/config/eslint` | `createConfig()`, used by the root `eslint.config.mjs` |
| `@rwos/config/vitest` | `baseTestConfig`, spread into each package's `vitest.config.ts` |
| `@rwos/config/env` | `parseServerEnv()`: validates environment variables with Zod at startup |

`parseServerEnv()` throws `InvalidEnvError` listing only the names of bad or missing variables, never their values, so secrets do not end up in logs.
