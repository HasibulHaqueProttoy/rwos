import type { Seed } from './types';

/**
 * Reference data every environment needs, production included: roles and permissions
 * (task 1.7), jurisdictions, products and prices (task 1.10). Runs in this order.
 */
export const referenceSeeds: Seed[] = [];

/**
 * Generated sample data for local development and CI only. Never real customers,
 * passports or IDs, and never loaded in production.
 */
export const sampleSeeds: Seed[] = [];
