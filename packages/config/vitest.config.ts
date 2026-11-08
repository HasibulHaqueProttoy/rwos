import { defineProject } from 'vitest/config';
import { baseTestConfig } from './vitest/preset.mjs';

export default defineProject({ test: baseTestConfig });
