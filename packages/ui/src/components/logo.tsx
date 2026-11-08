import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';
import { logoParts, logoViewBox } from './logo-paths';

export interface LogoProps extends Omit<ComponentProps<'svg'>, 'children'> {
  /**
   * `auto`: full colour in the light theme, all white in the dark theme (brand book).
   * `white`: all white, for orange or photo backgrounds.
   */
  tone?: 'auto' | 'white';
  /** Accessible name; pass an empty string when the logo sits next to the same words. */
  title?: string;
}

/** The Rocket Wave logo, drawn from the official SVG. Minimum width 120px. */
export function Logo({ tone = 'auto', title = 'Rocket Wave', className, ...props }: LogoProps) {
  const decorative = title === '';
  return (
    <svg
      data-slot="logo"
      viewBox={logoViewBox}
      xmlns="http://www.w3.org/2000/svg"
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : title}
      aria-hidden={decorative ? true : undefined}
      focusable="false"
      className={cn('h-8 w-auto min-w-logo-min', className)}
      {...props}
    >
      {logoParts.map((path, index) => (
        <path
          key={index}
          d={path.d}
          style={{
            fill: tone === 'white' ? 'var(--rw-logo-white)' : `var(--rw-logo-${path.part})`,
          }}
        />
      ))}
    </svg>
  );
}
