// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/*
 * Scans UI source for things CLAUDE.md forbids: raw colours, arbitrary sizes, Tailwind's
 * default palette, per-theme overrides, exclamation marks and em-dashes in visible copy.
 * Token sources and generated files are exempt.
 */
const repo = fileURLToPath(new URL('../../../../', import.meta.url));
const roots = ['packages/ui/src', 'apps/web/app', 'apps/admin/app'];
const exempt = [/logo-paths\.ts$/, /\.test\.tsx?$/, /\/test\//, /\/tokens\//];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(tsx?|css)$/.test(name) && !/(tokens|theme)\.css$/.test(name) ? [path] : [];
  });
}

const files = roots
  .flatMap((root) => sourceFiles(join(repo, root)))
  .filter((file) => !exempt.some((pattern) => pattern.test(file)));

const rules: [name: string, pattern: RegExp][] = [
  ['raw hex colour', /#[0-9a-fA-F]{3,8}\b(?![\w-])/],
  ['raw rgb/hsl colour', /\b(rgb|rgba|hsl|hsla|oklch)\(/],
  ['arbitrary size or colour value', /-\[(#|\d|calc|var)/],
  [
    "Tailwind's default palette",
    /\b(bg|text|border|fill|stroke|ring|outline)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)(-\d{2,3}|(?=[\s'"`]))/,
  ],
  ['per-theme override (themes come from tokens)', /\bdark:/],
  ['exclamation mark in visible copy', />[^<{}]*!\s*[^<{}=]*</],
  ['em-dash', /—/],
];

describe('design rules in UI source', () => {
  it('finds source files to check', () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it.each(rules)('no %s', (_name, pattern) => {
    const hits = files.flatMap((file) =>
      readFileSync(file, 'utf8')
        .split('\n')
        .map((line, index) => ({ line, index }))
        .filter(({ line }) => pattern.test(line) && !line.includes('design-rules: allow'))
        .map(({ index, line }) => `${relative(repo, file)}:${index + 1}: ${line.trim()}`),
    );
    expect(hits).toEqual([]);
  });
});
