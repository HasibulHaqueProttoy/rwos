// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile } from '@tailwindcss/node';
import { describe, expect, it } from 'vitest';

/*
 * Tailwind silently ignores a class that does not exist (for example `min-h-9` when the
 * theme has no 9 step, or `bg-primary`). This test compiles the real Rocket Wave theme and
 * fails on any utility class in the UI source that produces no CSS.
 */
const repo = fileURLToPath(new URL('../../../../', import.meta.url));
const ui = join(repo, 'packages/ui');
const roots = ['packages/ui/src/components', 'apps/web/app', 'apps/admin/app'];

// A token counts as a utility class when it starts with one of these roots and a dash, or is one
// of the few bare utilities (border, rounded, shadow, outline).
const UTILITY =
  /^-?((bg|text|border|rounded|shadow|p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|h|w|min-h|min-w|max-h|max-w|size|inset|inset-x|inset-y|top|right|bottom|left|font|animate|outline|fill|focus|ring|z|translate-x|translate-y|leading|tracking|grid-cols|backdrop-blur)-.+|border|rounded|shadow|outline)$/;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

function candidates(): string[] {
  const found = new Set<string>();
  for (const file of roots.flatMap((root) => files(join(repo, root)))) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/'([^'\n]*)'|"([^"\n]*)"|`([^`$]*)`/g)) {
      const literal = match[1] ?? match[2] ?? match[3] ?? '';
      const tokens = literal.trim().split(/\s+/);
      // Single words (a prop value such as 'bottom-right') only count when used as a className.
      const inClassName = source
        .slice(Math.max(0, match.index - 11), match.index)
        .endsWith('className=');
      if (tokens.length < 2 && !inClassName) continue;
      for (const token of tokens) {
        const base = token.replace(/^([\w-]+(\[[^\]]*\])?:)+/, '');
        if (UTILITY.test(base) && /^[!-]?[\w\-:[\]=&>./%()*]+$/.test(token)) found.add(token);
      }
    }
  }
  return [...found].sort();
}

describe('Tailwind classes used in the UI', () => {
  it('all exist in the Rocket Wave theme', async () => {
    const css = `@import 'tailwindcss';\n@import './src/styles/index.css';`;
    const compiler = await compile(css, { base: ui, onDependency: () => undefined });
    const list = candidates();
    expect(list.length).toBeGreaterThan(50);

    const missing = list.filter((candidate) => {
      const output = compiler.build([candidate]);
      return !output.includes(escapeClass(candidate));
    });
    expect(missing).toEqual([]);
  });
});

function escapeClass(name: string): string {
  return `.${name.replace(/[^\w-]/g, (char) => `\\${char}`)}`;
}
