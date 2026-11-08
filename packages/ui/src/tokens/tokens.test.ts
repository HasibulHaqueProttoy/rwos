// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import overrides from '../../tokens/overrides.json';
import source from '../../tokens/rocketwave.tokens.json';
import { renderLogoModule } from './logo-source';
import { renderThemeCss, renderTokensCss, resolveTokens, type Theme } from './build';
import { contrastRatio } from './contrast';

const model = resolveTokens();
const color = (name: string, theme: Theme) => {
  const token = model.colors.find((candidate) => candidate.name === name);
  if (!token) throw new Error(`No colour token "${name}"`);
  return token[theme];
};
const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('generated files', () => {
  it('tokens.css, theme.css and logo-paths.ts match the token sources (run tokens:build)', async () => {
    const prettier = await import('prettier');
    expect(read('../styles/tokens.css')).toBe(renderTokensCss(model));
    expect(read('../styles/theme.css')).toBe(renderThemeCss(model));
    const logo = await prettier.format(renderLogoModule(), {
      parser: 'typescript',
      ...(await prettier.resolveConfig(new URL('../components/logo-paths.ts', import.meta.url))),
    });
    expect(read('../components/logo-paths.ts')).toBe(logo);
  });

  it('every design system colour becomes a Tailwind colour', () => {
    const theme = renderThemeCss(model);
    for (const token of source.color.tokens) {
      expect(theme).toContain(`--color-${token.name}: var(--rw-color-${token.name});`);
    }
  });
});

describe('accessibility overrides', () => {
  it('only change tokens that exist, and record the original value', () => {
    for (const [name, override] of Object.entries(overrides.color)) {
      const original = source.color.tokens.find((token) => token.name === name);
      expect(original, name).toBeDefined();
      expect(override.was).toBe(original?.value.light);
      expect(override.reason.length).toBeGreaterThan(20);
    }
  });
});

// WCAG 2.2 AA: 4.5:1 for text, 3:1 for large text, icons, borders and focus rings.
const TEXT = 4.5;
const NON_TEXT = 3;
const pairs: [foreground: string, background: string, minimum: number][] = [
  ['ink', 'canvas', TEXT],
  ['ink', 'surface', TEXT],
  ['ink', 'surface-sunken', TEXT],
  ['ink', 'surface-hover', TEXT],
  ['ink', 'brand-tint', TEXT],
  ['ink-muted', 'canvas', TEXT],
  ['ink-muted', 'surface', TEXT],
  ['ink-muted', 'surface-sunken', TEXT],
  ['ink-muted', 'surface-hover', TEXT],
  ['ink-muted', 'neutral-tint', TEXT],
  ['brand-strong', 'canvas', TEXT],
  ['brand-strong', 'surface', TEXT],
  ['brand-strong', 'brand-tint', TEXT],
  ['on-ink', 'ink', TEXT],
  ['on-ink', 'danger', TEXT],
  ['on-brand', 'brand', TEXT],
  ['success', 'success-tint', TEXT],
  ['warning', 'warning-tint', TEXT],
  ['danger', 'danger-tint', TEXT],
  ['info', 'info-tint', TEXT],
  ['danger', 'surface', TEXT],
  ['border-strong', 'surface', NON_TEXT],
  ['border-strong', 'surface-sunken', NON_TEXT],
  ['focus', 'canvas', NON_TEXT],
  ['focus', 'surface', NON_TEXT],
  ['brand', 'surface', NON_TEXT],
];

describe.each(['light', 'dark'] as const)('contrast in the %s theme', (theme) => {
  it.each(pairs)('%s on %s meets %s:1', (foreground, background, minimum) => {
    const ratio = contrastRatio(color(foreground, theme), color(background, theme));
    expect(ratio).toBeGreaterThanOrEqual(minimum);
  });
});
