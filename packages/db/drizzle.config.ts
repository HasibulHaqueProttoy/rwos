import { defineConfig } from 'drizzle-kit';

// Migrations are generated from src/schema and applied with `pnpm db:migrate`.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema/index.ts',
  out: './migrations',
  casing: 'snake_case',
  strict: true,
  verbose: true,
});
