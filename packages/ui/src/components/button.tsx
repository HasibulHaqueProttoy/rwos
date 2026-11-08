import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

/*
 * Design rules: primary buttons are ink pills; one primary action per screen; the brand
 * (orange) variant only at checkout or upgrade, with dark text; 44px tap targets.
 */
export const buttonVariants = cva(
  [
    'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full text-body-strong',
    'transition-colors focus-visible:focus-ring',
    'disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-transparent disabled:bg-neutral-tint disabled:text-ink-subtle',
    '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-ink text-on-ink hover:bg-ink/85',
        secondary: 'border border-border-strong bg-surface text-ink hover:bg-surface-hover',
        ghost: 'text-ink hover:bg-surface-hover',
        brand: 'bg-brand text-on-brand hover:bg-brand/85',
        destructive: 'bg-danger text-on-ink hover:bg-danger/85',
      },
      size: {
        default: 'min-h-tap px-5 py-2',
        sm: 'min-h-8 px-3 py-1',
        icon: 'size-tap',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  },
);

export interface ButtonProps extends ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  /** Render the child element (for example a link) with button styles. */
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, type, ...props }: ButtonProps) {
  const Component = asChild ? Slot.Root : 'button';
  return (
    <Component
      data-slot="button"
      // A plain <button> inside a form submits by default; make that an explicit choice.
      type={asChild ? undefined : (type ?? 'button')}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
