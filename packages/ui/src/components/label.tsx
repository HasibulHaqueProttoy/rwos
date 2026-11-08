import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

/** Field label. Every input needs one (WCAG); use htmlFor with the input's id. */
export function Label({ className, ...props }: ComponentProps<'label'>) {
  return (
    // eslint-disable-next-line jsx-a11y/label-has-associated-control -- callers pass htmlFor or wrap the control
    <label
      data-slot="label"
      className={cn('inline-flex items-center gap-2 text-label text-ink-muted', className)}
      {...props}
    />
  );
}
