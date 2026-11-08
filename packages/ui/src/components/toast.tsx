'use client';

import { Toaster as Sonner, type ToasterProps } from 'sonner';

/**
 * Toast notifications (sonner). Put one <Toaster /> in the app layout, then call
 * toast('Saved'), toast.success(...), toast.error(...). Every toast carries words, never
 * colour alone.
 */
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'flex w-full items-start gap-3 rounded-md border border-border bg-surface p-4 text-ink shadow-lg',
          title: 'text-body-strong',
          description: 'text-body text-ink-muted',
          icon: 'mt-px',
          success: '[&_[data-icon]]:text-success',
          error: '[&_[data-icon]]:text-danger',
          warning: '[&_[data-icon]]:text-warning',
          info: '[&_[data-icon]]:text-info',
          actionButton:
            'ml-auto cursor-pointer rounded-full bg-ink px-3 py-1 text-label text-on-ink focus-visible:focus-ring',
          cancelButton:
            'cursor-pointer rounded-full px-3 py-1 text-label text-ink-muted hover:bg-surface-hover focus-visible:focus-ring',
        },
      }}
      {...props}
    />
  );
}

export { toast } from 'sonner';
