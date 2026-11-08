import type { Seed } from '@rwos/db';
import { rolesAndPermissionsSeed } from './identity/seed';

/**
 * Every seed, in run order. Reference seeds run in every environment (production too) and
 * must be idempotent; sample seeds load generated data for local development and CI only.
 */
export const referenceSeeds: Seed[] = [rolesAndPermissionsSeed];
export const sampleSeeds: Seed[] = [];
