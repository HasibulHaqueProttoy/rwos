// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('keeps a type-scale size and a colour together', () => {
    expect(cn('text-body', 'text-ink')).toBe('text-body text-ink');
    expect(cn('text-h1 text-ink-muted')).toBe('text-h1 text-ink-muted');
  });

  it('lets the later class win within the same group', () => {
    expect(cn('text-body', 'text-h1')).toBe('text-h1');
    expect(cn('text-ink', 'text-ink-muted')).toBe('text-ink-muted');
    expect(cn('bg-surface', 'bg-canvas')).toBe('bg-canvas');
    expect(cn('px-4', 'px-6')).toBe('px-6');
  });

  it('drops falsy values', () => {
    expect(cn('p-4', false, undefined, null, 'gap-2')).toBe('p-4 gap-2');
  });
});
