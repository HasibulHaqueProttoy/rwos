import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

/** Text input. 16px text on mobile (stops iOS zooming in), 14px from md up. Pair with <Label>. */
export function Input({ className, type = 'text', ...props }: ComponentProps<'input'>) {
  return (
    <input
      data-slot="input"
      type={type}
      className={cn(
        'flex min-h-tap w-full min-w-0 rounded-md border border-border-strong bg-surface-sunken px-4 py-2 text-body-lg text-ink md:text-body',
        'placeholder:text-ink-muted focus-visible:focus-ring',
        'disabled:cursor-not-allowed disabled:text-ink-subtle',
        'aria-invalid:border-danger aria-invalid:bg-danger-tint',
        'file:border-0 file:bg-transparent file:text-body-strong file:text-ink',
        className,
      )}
      {...props}
    />
  );
}
