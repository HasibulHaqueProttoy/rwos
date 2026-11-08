import axe from 'axe-core';
import { expect } from 'vitest';

/**
 * Runs axe accessibility checks on `container`. Colour contrast is skipped here because
 * jsdom has no layout or CSS; tokens.test.ts checks contrast against the real token values.
 */
export async function expectNoAxeViolations(container: Element) {
  const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  const problems = result.violations.map(
    (violation) => `${violation.id}: ${violation.help} (${violation.nodes.length} element(s))`,
  );
  expect(problems).toEqual([]);
}
