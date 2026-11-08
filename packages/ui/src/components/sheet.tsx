'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { XIcon } from 'lucide-react';
import { Dialog as SheetPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

/** Sheet: a dialog that slides in from an edge (bottom on mobile, side on desktop). Always give it a SheetTitle. */
export const Sheet = SheetPrimitive.Root;
export const SheetTrigger = SheetPrimitive.Trigger;
export const SheetClose = SheetPrimitive.Close;

const sheetVariants = cva(
  'fixed z-50 flex flex-col gap-4 overflow-y-auto bg-surface p-6 text-ink shadow-lg focus-visible:outline-none',
  {
    variants: {
      side: {
        right:
          'inset-y-0 right-0 h-full w-full max-w-sheet border-l border-border data-[state=open]:animate-slide-in-right',
        left: 'inset-y-0 left-0 h-full w-full max-w-sheet border-r border-border data-[state=open]:animate-slide-in-left',
        bottom:
          'inset-x-0 bottom-0 max-h-full rounded-t-lg border-t border-border data-[state=open]:animate-slide-in-bottom',
      },
    },
    defaultVariants: { side: 'right' },
  },
);

export function SheetContent({
  className,
  children,
  side,
  ...props
}: ComponentProps<typeof SheetPrimitive.Content> & VariantProps<typeof sheetVariants>) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay
        data-slot="sheet-overlay"
        className="fixed inset-0 z-50 bg-canvas/80 backdrop-blur-sm data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out"
      />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(sheetVariants({ side }), className)}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="absolute top-4 right-4 inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-ink-muted hover:bg-surface-hover hover:text-ink focus-visible:focus-ring">
          <XIcon aria-hidden="true" className="size-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

export function SheetHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-header"
      className={cn('flex flex-col gap-2 pr-8', className)}
      {...props}
    />
  );
}

export function SheetFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn('mt-auto flex flex-col gap-3', className)}
      {...props}
    />
  );
}

export function SheetTitle({ className, ...props }: ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn('font-display text-h2 text-ink', className)}
      {...props}
    />
  );
}

export function SheetDescription({
  className,
  ...props
}: ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn('text-body text-ink-muted', className)}
      {...props}
    />
  );
}
