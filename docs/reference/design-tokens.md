# Client design tokens

[Documentation hub](../README.md) · [Client README](../../apps/client/README.md)

**Status:** Implemented token configuration; storefront UI remains planned.
**Reviewed:** 2026-10-25.

[global.css](../../apps/client/src/app/global.css) is the source of truth for the
user-supplied palette and scales. Tailwind v4 loads it through
`@import 'tailwindcss'`, with `@tailwindcss/postcss` in the client PostCSS config.
No JavaScript Tailwind configuration or token-generation step is needed.
The implementation follows Tailwind's [theme variables](https://tailwindcss.com/docs/theme),
[custom dark variant](https://tailwindcss.com/docs/dark-mode), and
[breakpoint configuration](https://tailwindcss.com/docs/responsive-design).

## Colors

| Token       | Value     | Example utility            |
| ----------- | --------- | -------------------------- |
| `brand-50`  | `#EEF2FF` | `bg-brand-50`              |
| `brand-100` | `#E0E7FF` | `bg-brand-100`             |
| `brand-500` | `#6366F1` | `bg-brand-500`             |
| `brand-600` | `#4F46E5` | `bg-brand-600`             |
| `brand-700` | `#4338CA` | `hover:bg-brand-700`       |
| `success`   | `#16A34A` | `text-success`             |
| `warning`   | `#D97706` | `text-warning`             |
| `danger`    | `#DC2626` | `border-danger`            |
| `focus`     | `#818CF8` | `focus-visible:ring-focus` |

| Semantic token | Light     | Dark      | Example utility  |
| -------------- | --------- | --------- | ---------------- |
| `background`   | `#F8FAFC` | `#090D18` | `bg-background`  |
| `surface`      | `#FFFFFF` | `#121827` | `bg-surface`     |
| `surface-alt`  | `#F1F5F9` | `#1B2435` | `bg-surface-alt` |
| `text`         | `#0F172A` | `#F1F5F9` | `text-text`      |
| `muted`        | `#64748B` | `#94A3B8` | `text-muted`     |
| `border`       | `#E2E8F0` | `#2B364A` | `border-border`  |

`@theme inline` maps semantic utilities to theme-dependent CSS variables.
The starter aliases remain available: `primary` maps to `brand-600` and
`secondary` maps to `muted`. Brand and status colors are the same in both modes.
Tailwind's default palette remains available for existing classes such as the
placeholder page's `bg-red-500`.

## Theme selection

Light is the default. Set `data-theme="dark"` or add `.dark` to `<html>` to select
dark values and activate `dark:*` variants. Remove `.dark` and the attribute, or
set `data-theme="light"` without `.dark`, to return to light. Use one convention
on the document root rather than combining conflicting selectors.

```html
<html data-theme="dark"></html>
```

`color-scheme` follows the selected mode for native controls. There is no theme
toggle, system-preference detection, or saved preference. Semantic classes switch
automatically with the theme; `dark:*` is available for explicit differences.

The body applies `bg-background font-sans text-text`. The header markup and the
placeholder page remain unchanged. Individual screens still need their own
component styling, focus treatment, and accessibility checks.

## Typography

`font-sans` is `Inter, system-ui, sans-serif`. This config sets a preference;
Inter is not bundled or fetched, so the browser uses its installed font or the
system fallback. Font delivery is a separate future implementation choice.

| Utility     | Size at a 16px root |
| ----------- | ------------------- |
| `text-xs`   | 12px                |
| `text-sm`   | 14px                |
| `text-base` | 16px                |
| `text-lg`   | 18px                |
| `text-xl`   | 20px                |
| `text-2xl`  | 24px                |
| `text-3xl`  | 30px                |
| `text-4xl`  | 36px                |
| `text-5xl`  | 48px                |
| `text-6xl`  | 60px                |

The `--text-*` namespace is reset before defining this scale. Larger default
sizes are not included. Sizes use rem units; line height can be chosen per
component, for example `text-base/6`.

## Spacing and radii

The spacing unit is `0.25rem` (4px at a 16px root). The supplied spacing steps map
to Tailwind's usual numeric utilities; other multiples remain possible.

| Utility suffix | `1` | `2` | `3` | `4` | `5` | `6` | `8` | `10` | `12` | `16` | `20` |
| -------------- | --- | --- | --- | --- | --- | --- | --- | ---- | ---- | ---- | ---- |
| Pixels         | 4   | 8   | 12  | 16  | 20  | 24  | 32  | 40   | 48   | 64   | 80   |

For example, `p-6` gives 24px padding and `gap-8` gives a 32px gap.

| Utility       | Radius at a 16px root |
| ------------- | --------------------- |
| `rounded-sm`  | 8px                   |
| `rounded-md`  | 12px                  |
| `rounded-lg`  | 16px                  |
| `rounded-xl`  | 20px                  |
| `rounded-2xl` | 24px                  |

The named radius scale is reset to these five entries. `rounded-none` and
`rounded-full` remain Tailwind utilities.

## Breakpoints

| Prefix     | Minimum width at a 16px browser default | CSS value   |
| ---------- | --------------------------------------- | ----------- |
| `mobile:`  | 390px                                   | `24.375rem` |
| `tablet:`  | 768px                                   | `48rem`     |
| `desktop:` | 1440px                                  | `90rem`     |

Unprefixed classes apply at all widths, including below 390px. These named
breakpoints replace the default `sm/md/lg/xl/2xl` viewport variants; do not use
those prefixes in new client code. Use consistent rem units for breakpoint
ordering.

## Usage example

This is a documentation example, not an added component or screen:

```tsx
<section className="rounded-lg border border-border bg-surface p-4 text-text tablet:p-6 desktop:p-8">
  <h2 className="text-2xl">Section title</h2>
  <p className="mt-2 text-sm text-muted">Supporting content</p>
  <button className="mt-6 rounded-md bg-brand-600 px-6 py-3 text-white hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface">
    Continue
  </button>
</section>
```

The supplied external design spec and prototype describe future screens and
flows. They are design references, not proof that localization, cart, checkout,
theme controls, or backend integration exist. Keep implementation status in the
[status inventory](../operations/implementation-status.md) and screen proposals in
the [UI/UX specification](../future-plans/product/ui-ux-specification.md).
