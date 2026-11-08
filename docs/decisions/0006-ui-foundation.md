# 0006: UI foundation

Date: 2026-11-08 · Status: accepted

## Decisions

- **Tailwind CSS 4 with a locked theme.** The generated `theme.css` removes Tailwind's default palette, spacing scale, type scale, radii and shadows, then adds only Rocket Wave tokens. Using a raw colour or a size outside the scale is not possible by accident; a test also fails CI if a class used in the UI produces no CSS.
- **One source for tokens.** `packages/ui/tokens/rocketwave.tokens.json` is an exact copy of the design system's tokens. A generator writes the CSS variables (light and dark) and the Tailwind theme from it, and a test fails if the generated files are stale.
- **Accessibility overrides kept separate.** Where a design system value fails WCAG 2.2 AA, the fix lives in `tokens/overrides.json` with the original value and the reason, instead of silently editing the copy. Four fixes in this task (see `DESIGN_SYSTEM.md`).
- **Themes through CSS variables.** Components never use `dark:`; the variables switch with `prefers-color-scheme`, or with `data-theme` on `<html>` when the user chooses.
- **shadcn/ui structure, written into `packages/ui`.** Radix primitives (`radix-ui`), `class-variance-authority` for variants, `tailwind-merge` taught the Rocket Wave type scale (so `text-body text-ink` keeps both classes), `sonner` for toasts, `lucide-react` for icons.
- **Self-hosted fonts** through Fontsource variable packages (Inter, Inter Tight, JetBrains Mono): no request to Google at runtime, and it works the same on any host.
- **The logo is drawn from the official SVG.** `logo-paths.ts` is generated from `assets/rocketwave-logo.svg`, so the component can switch to all white in the dark theme without a second file.
- **Component tests run in jsdom** with axe-core accessibility checks; colour contrast is checked separately against the token values, because jsdom has no layout.

## Why

The design rules (tokens only, WCAG 2.2 AA in both themes, status never by colour alone, 44px tap targets) are easy to break one screen at a time. Building them into the components, the theme and the tests keeps every later screen consistent without relying on review alone.
