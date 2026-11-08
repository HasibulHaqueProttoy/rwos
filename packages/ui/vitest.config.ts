import { baseTestConfig } from '@rwos/config/vitest';
import { defineProject } from 'vitest/config';

// Component tests run in jsdom; token and source-scan tests opt into node with a
// `@vitest-environment node` comment at the top of the file.
export default defineProject({
  test: {
    ...baseTestConfig,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
