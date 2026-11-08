import { createConfig } from '@rwos/config/eslint';

export default createConfig({
  rootDir: import.meta.dirname,
  nextApps: ['apps/web', 'apps/admin'],
});
