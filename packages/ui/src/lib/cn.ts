import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/** Type-scale names from the design system (text-body, text-h1 and so on). */
export const typeScale = [
  'display',
  'h1',
  'h2',
  'h3',
  'body-lg',
  'body',
  'body-strong',
  'label',
  'caption',
  'overline',
  'data',
] as const;

// Teach tailwind-merge that text-body, text-h1 and so on are font sizes, so `text-body text-ink`
// keeps both classes instead of treating text-body as a colour and dropping one of them.
const merge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: [...typeScale] }],
    },
  },
});

/** Joins class names and resolves Tailwind conflicts (the last one wins). */
export function cn(...inputs: ClassValue[]): string {
  return merge(clsx(inputs));
}
