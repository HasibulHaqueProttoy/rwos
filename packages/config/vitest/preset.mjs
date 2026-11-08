/**
 * Shared Vitest settings. Each package spreads this into its own vitest.config.ts.
 * @type {import('vitest/config').ViteUserConfig['test']}
 */
export const baseTestConfig = {
  environment: 'node',
  include: ['src/**/*.test.{ts,tsx}', 'app/**/*.test.{ts,tsx}'],
  restoreMocks: true,
};
