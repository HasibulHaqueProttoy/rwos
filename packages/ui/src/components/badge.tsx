import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/cn';

/*
 * Status badge. Design rule: a status is never shown by colour alone, so `children` (the
 * status word, such as "Paid" or "Overdue") is required. Status colours only mean status.
 */
export const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-sm px-2 py-1 text-label [&_svg]:size-3 [&_svg]:shrink-0',
  {
    variants: {
      tone: {
        success: 'bg-success-tint text-success',
        warning: 'bg-warning-tint text-warning',
        danger: 'bg-danger-tint text-danger',
        info: 'bg-info-tint text-info',
        neutral: 'bg-neutral-tint text-ink-muted',
        brand: 'bg-brand-tint text-brand-strong',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export interface BadgeProps
  extends Omit<ComponentProps<'span'>, 'children'>, VariantProps<typeof badgeVariants> {
  /** The status word. Required: colour alone never carries meaning. */
  children: string | [ReactNode, string];
}

export function Badge({ className, tone, children, ...props }: BadgeProps) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ tone }), className)} {...props}>
      {children}
    </span>
  );
}
