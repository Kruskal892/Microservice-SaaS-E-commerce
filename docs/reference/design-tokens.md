# Design tokens

Runtime values live in [`packages/ui/theme.css`](../../packages/ui/theme.css).
Import it after Tailwind and scan `packages/ui` with `@source`.
The [monochrome specification](../design/eshop-monochrome.md) contains the full
colour, typography and responsive contract; [component rules](../design/common-ui.md)
explain how to apply it.

## Colors

| Utility role     | Light     | Dark      |
| ---------------- | --------- | --------- |
| `background`     | `#FFFFFF` | `#0A0A0A` |
| `surface`        | `#FFFFFF` | `#171717` |
| `surface-alt`    | `#F5F5F5` | `#242424` |
| `muted-surface`  | `#EBEBEB` | `#333333` |
| `text`           | `#000000` | `#FFFFFF` |
| `muted`          | `#595959` | `#B3B3B3` |
| `border`         | `#DEDEDE` | `#404040` |
| `control-border` | `#858585` | `#858585` |
| `action`         | `#000000` | `#FFFFFF` |
| `on-action`      | `#FFFFFF` | `#000000` |
| `focus`          | `#000000` | `#FFFFFF` |

Use `border-border` for structure and `border-control-border` for essential
control boundaries. Always pair `bg-action` with `text-on-action`.
`primary` aliases `action`; `secondary` aliases `muted`. Legacy brand utilities
remain neutral, but semantic utilities should drive theme-aware components.
Success, warning and error use small functional accents with readable text.

## Theme selection

The shared CSS supports `.dark` and `data-theme="dark"`; light is the default.
Choose one convention on the document root so portals inherit the same theme.
`color-scheme` follows the active mode for native controls.

The client uses `next-themes` with `attribute="data-theme"` and
`defaultTheme="system"`. Use `setTheme('light' | 'dark' | 'system')` rather than
editing the DOM attribute directly. The header's Dark mode toggle button uses
`aria-pressed`, stays disabled until mounted, and saves an explicit preference.
The provider owns startup selection, cross-tab updates and system tracking.

## Common control tokens

Buttons have 36/44/48px minimum heights; icon actions are 44px square. Inputs
and Select triggers default to 48px. Four OTP cells are 60x64px and shrink within
their group for longer codes. Focus uses a 2px ring and 2px surface offset.
`danger-action`, `danger-hover` and `danger-active` are destructive fills with
white labels in both themes. Ordinary actions stay monochrome.

## Typography

DM Sans is bundled with its OFL licence in `packages/assets/fonts/` and loaded
by the shared theme's `@font-face`. Client and Storybook both use `font-sans`.
No `next/font/google` download or app-specific font utility is required.

| Utility                              | Size                   |
| ------------------------------------ | ---------------------- |
| `text-xs` / `text-sm` / `text-base`  | 12 / 14 / 16px         |
| `text-lg` / `text-xl` / `text-2xl`   | 18 / 20 / 24px         |
| `text-3xl` / `text-4xl` / `text-5xl` | 30 / 36 / 48px         |
| `text-6xl`                           | 64px, 78px line height |
| `text-auth-display`                  | 54px, 60px line height |
| `text-mobile-h1`                     | 32px, 40px line height |

Use 400 for reading copy, 500 for labels, 600 for headings/actions and 700 for
the wordmark. Use tabular figures for countdowns and changing amounts.

## Spacing and radii

Spacing is based on 4px: `gap-2` is 8px, `gap-6` is 24px, `p-8` is 32px.
Prefer group gaps to stacked child margins. Radii: `xs` 4px, `sm` 8px, `md`
12px, `lg` 16px, `xl` 20px, `2xl` 24px. Full rounding is available for pills.
Resting cards have no shadow; elevated content uses `shadow-overlay`.
Transitions default to 120ms with a reduced-motion alternative in components.

## Breakpoints

Named prefixes are `mobile:` 390px, `tablet:` 768px and `desktop:` 1440px.
These replace Tailwind's default viewport prefix names. The storefront uses
`min-[64rem]:` (1024px) for the full header navigation and split auth layout.
At narrower widths, navigation uses a dialog and auth content uses one column.
Keep visible controls and product names within the viewport at 320px.

## Usage example

```tsx
<section className="flex flex-col gap-6 rounded-md border border-border bg-surface p-6 text-text">
  <h2 className="text-2xl font-semibold">Your details</h2>
  <p className="text-sm text-muted">
    Keep your account information up to date.
  </p>
  <Button>Save changes</Button>
</section>
```
