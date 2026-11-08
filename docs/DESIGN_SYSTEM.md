# Design system

Source of truth: Rocket Wave Design System, https://claude.ai/artifact/PxoKocLtgLWroPpwUzmhts. The tokens below are copied into `packages/ui/src/tokens.css` as CSS variables and into the Tailwind preset. Never use raw hex values or spacing outside these tokens.

## Colour (light / dark)

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| brand | #EB6700 | #FF8A2A | Logo orange: active nav, progress, current step, icons, text 24px+ only |
| brand-strong | #B84F00 | #FFA45C | Orange text and links under 24px |
| brand-tint | #FFF1E6 | #2A1A0C | Selected nav, highlighted card |
| flame | #FF9900 | #FFB547 | Accent only, never text |
| ink | #111214 | #F3F4F6 | Text, primary button fill |
| ink-muted | #5F6672 | #A3A9B3 | Secondary text, labels |
| ink-subtle | #8A909A | #7C838E | Placeholders, disabled only |
| on-ink | #FFFFFF | #111214 | Text on primary buttons |
| canvas | #F3F4F6 | #0E0F11 | App background |
| surface | #FFFFFF | #17191C | Cards, sidebar, dialogs |
| surface-sunken | #F2F4F5 | #1F2226 | Inputs, read-only wells |
| surface-hover | #ECEEF1 | #24282D | Hover |
| border | #E3E6EA | #2C3036 | Dividers |
| border-strong | #8F96A1 | #6B727D | Input and checkbox borders |
| focus | #EB6700 | #FF8A2A | 2px focus ring, 2px offset |
| success / success-tint | #15803D / #DCFCE7 | #4ADE80 / #0B2A17 | Active, Paid, Filed |
| warning / warning-tint | #92400E / #FEF3C7 | #FBBF24 / #2A2008 | Upcoming, Due soon, Waiting |
| danger / danger-tint | #B91C1C / #FEE2E2 | #F87171 / #2C1010 | Overdue, Failed, Rejected |
| info / info-tint | #1D4ED8 / #DBEAFE | #7FA7FF / #0F1C3A | In progress |
| neutral-tint | #EEF0F2 | #24282D | Draft, Inactive |

## Type

Inter for UI; Inter Tight for display and h1/h2; JetBrains Mono for IDs. Scale: display 32/38, h1 24/32, h2 20/28 (600), h3 16/24 (600), body-lg 16/24, body 14/20, body-strong 14/20 (500), label 13/18 (500), caption 12/16, overline 11/16 (600, uppercase, sidebar groups only). Inputs are 16px on mobile. Tabular numbers for money, dates and IDs.

## Space, radius, shadow

Spacing 4, 8, 12, 16, 20, 24, 32, 48. Radius: sm 6 (badges), md 10 (inputs), lg 16 (cards, dialogs), full (buttons). Shadow sm on cards (light theme only), lg on dialogs.

## Rules

Primary buttons are ink (black) pills; one brand-orange button per screen only at checkout or upgrade, with ink text. Sentence case. One primary action per screen. Status badges always include a word. Log out lives in the account menu. Desktop: 248px sidebar, max content 1200px. Mobile: bottom tab bar, 16px gutters, 44px tap targets. WCAG 2.2 AA in both themes.

Logo: `packages/ui/assets/rocketwave-logo.svg` (full colour, 461 x 90). Minimum width 120px.
