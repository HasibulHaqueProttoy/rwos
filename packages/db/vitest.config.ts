import { baseTestConfig } from '@rwos/config/vitest';
import { defineProject } from 'vitest/config';

// Unit tests only. Tests that need Postgres end in .int.test.ts (see vitest.integration.config.ts).
export default defineProject({
  test: { ...baseTestConfig, exclude: ['**/node_modules/**', '**/*.int.test.ts'] },
});
