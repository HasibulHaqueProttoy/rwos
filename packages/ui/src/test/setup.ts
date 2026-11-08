import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom lacks a few browser APIs that Radix and sonner call; add no-op versions.
if (typeof window !== 'undefined') {
  // The DOM types say these always exist; in jsdom they may not.
  const globalWindow = window as unknown as Record<string, unknown>;
  if (!('ResizeObserver' in globalWindow)) {
    globalWindow.ResizeObserver = class {
      observe = () => undefined;
      unobserve = () => undefined;
      disconnect = () => undefined;
    };
  }
  if (!('matchMedia' in globalWindow)) {
    globalWindow.matchMedia = (query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList;
  }
  const element = Element.prototype as unknown as Record<string, unknown>;
  for (const name of ['scrollIntoView', 'setPointerCapture', 'releasePointerCapture']) {
    if (!(name in element)) element[name] = () => undefined;
  }
  if (!('hasPointerCapture' in element)) element.hasPointerCapture = () => false;
}

afterEach(() => {
  cleanup();
});
