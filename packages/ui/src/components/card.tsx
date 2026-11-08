import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

/** Card: surface with a border; a soft shadow in the light theme only (dark uses the border). */
export function Card({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card"
      className={cn(
        'flex flex-col rounded-lg border border-border bg-surface text-ink shadow-sm',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn('flex flex-col gap-1 p-5 md:p-6', className)}
      {...props}
    />
  );
}

export function CardTitle({ className, children, ...props }: ComponentProps<'h3'>) {
  return (
    <h3 data-slot="card-title" className={cn('text-h3 text-ink', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      data-slot="card-description"
      className={cn('text-body text-ink-muted', className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-content"
      className={cn('px-5 pb-5 md:px-6 md:pb-6', className)}
      {...props}
    />
  );
}

export function CardFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center gap-3 px-5 pb-5 md:px-6 md:pb-6', className)}
      {...props}
    />
  );
}
