# Shared UI

[Documentation hub](../README.md) · [Design tokens](design-tokens.md)

**Status:** Shared React input and theme source implemented; review comments addressed; browser verification pending.
**Reviewed:** 2026-10-27 (source only).

## Use in another application

Import browser components from `@packages/ui`. Do not import the root `@packages`
barrel in browser code: it also exports Prisma and Redis clients.

The UI lives inside the existing `packages` workspace, not a separate npm package.
React 19, Tailwind v4, and the shared workspace dependencies (`clsx` and
`tailwind-merge`) must be available. The consuming app must resolve
`@packages/*` to the repository's `packages/*` source through its TypeScript and
bundler configuration. If the app overrides `compilerOptions.paths`, include
this mapping alongside its local aliases. Follow the client compiler setup for
shared TSX inclusion and project references.

In the app's global stylesheet, import Tailwind once, import the shared theme,
and explicitly register the shared source directory for class generation. Paths
are relative to the stylesheet; this is the existing client setup:

```css
@import 'tailwindcss';
@import '../../../../packages/ui/theme.css';

@source '../../../../packages/ui';
```

Load that stylesheet from the app entry point and enable Tailwind's PostCSS
plugin. `theme.css` contains the existing palette, typography, spacing, radii,
breakpoints, and theme selectors; it does not apply body styles or import
Tailwind. Apps own page layout and body styling. It resets the text, radius, and
breakpoint namespaces to the documented scales, so review those names when
adopting it in an app with an existing theme. Apps can override semantic variables
after importing the shared theme.

## Input

[Input.tsx](../../packages/ui/common/Input/Input.tsx) is a native `<input>` with
default styling. It accepts `React.ComponentProps<'input'>`, including React 19's
`ref` prop, native `size`, `id`, `name`, `required`, `disabled`, ARIA attributes,
event handlers, and controlled or uncontrolled values. It adds `data-slot="input"`
inside a flex field wrapper. `className` styles the wrapper (height, width,
border, background, typography); `inputClassName` styles the native input
(padding and input-specific details). Both merge after defaults through `cn`.
There are no custom size, validation, or variant props.

### Optional icon

Pass a registered icon name or a custom React element to render a decorative icon.
Supported names are inferred from the shared registry for editor autocomplete.
Other strings are rejected by TypeScript.

```tsx
<Input type="search" aria-label="Search products" icon="SearchIcon" />
<Input type="password" aria-label="Password" icon="LockIcon" />
<Input aria-label="Custom icon" icon={<CustomIcon />} />
<Input name="email" type="email" />
```

`CustomIcon` above is a consumer-supplied component. All fields use a flex
wrapper, including fields without icons. The icon is a non-interactive flex item
hidden from assistive technology. `iconPosition="start"` is the default;
`iconPosition="end"` applies `order-last`. Flex layout follows the document's text
direction. No absolute positioning, offsets, or reserved input padding is needed.

The icon uses `shrink-0 px-3` and flex centering, and stretches to the field's
inner height. Named SVGs default to `size-5` on the shared `Icon` component,
merged before caller classes so `iconClassName="size-8"` overrides the size.
Custom React elements own their size. SVGs do not shrink. Its actual width takes
space in the layout, so wider icons or custom padding do not overlap input text.
The native input uses `flex-1 min-w-0`; it fills the remaining width.

```tsx
<Input
  aria-label="Search products"
  icon="SearchIcon"
  iconPosition="end"
  className="h-14 border-2 border-brand-500"
  inputClassName="px-4"
  iconContainerClassName="bg-brand-600 px-4 text-white"
  iconClassName="stroke-2"
/>
```

`iconContainerClassName` styles the icon area's background, width, padding, and
text color. Keep it in normal flex flow so it stretches with the field.
`iconClassName` is passed to the SVG only for a registered icon name. For a custom
element, put SVG classes directly on that element. The wrapper clips backgrounds
to its rounded border. Its focus, invalid, and disabled styles follow the native
input through CSS `:has()` selectors.

Native attributes, ARIA attributes, event handlers, and React 19 refs still target
the `<input>`. This changes the earlier styling contract: move native input
padding overrides from `className` to `inputClassName`; field sizing, border,
background, typography, and external spacing remain in `className`. Direct-child
selectors must account for the wrapper even when no icon is supplied. Native
search-clear controls and password-manager affordances still need browser
verification alongside end icons.

Keep icon content decorative: do not pass buttons or links to `icon`. A password
visibility toggle needs a separate accessible button and client-owned state;
`icon` does not change the input type or provide toggle behavior.

### SVG icon library

Store SVG files in `packages/assets/icons/` and export them from
`packages/assets/icons/index.ts`. Those exports are the registry, currently
providing `SearchIcon`, `LockIcon`, `ProfileIcon`, `HeartIcon`, and `CartIcon`. Each export automatically
extends the exported `IconName` type; no change to `Icon.tsx` is needed.
Simply adding a file does not register a name. Names are case-sensitive:
`searchIcon` and `lockIcon` have been replaced by `SearchIcon` and `LockIcon`.
Current consumers use the new names. Keep the barrel limited to SVG React
components because `Icon` renders any selected export as a component.

Prefer `currentColor` for themeable fills/strokes. The new profile, heart, and
cart SVGs hardcode black; text-color utilities cannot recolor them, and
dark-mode contrast remains unresolved.

Assets belong to the repo-wide `packages/assets` folder, independently of UI.
Apps can also import `{ SearchIcon, LockIcon }` from `@packages/assets/icons`
or `@packages/assets`. Export new SVGs from `packages/assets/icons/index.ts`
to make them available for named UI usage. See the
[assets README](../../packages/assets/README.md) for ownership and setup.

For standalone use:

```tsx
import { Icon } from '@packages/ui';

<Icon name="SearchIcon" className="size-5 text-muted" />;
```

Icons are decorative by default. A standalone meaningful icon needs an
accessible name and `aria-hidden={false}`, or a labeled surrounding control.

The client configures the existing `@svgr/webpack` loader in both Turbopack and
Webpack so `.svg` imports become React components. Restart the dev server after
changing this configuration. Other apps consuming `@packages/ui` must configure
their bundler's SVG-to-React support with a default component export and include
`packages/assets/svg.d.ts` for SVG types. This setup treats JavaScript/TypeScript SVG
imports as components, rather than image URLs. The SVG files are bundled assets;
no public-folder copying or runtime fetch is required. Jest consumers need SVG
mocks or an SVG transformer. No shared UI rendering spec currently exists.

```tsx
import { Input } from '@packages/ui';

export function EmailField() {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="email">Email</label>
      <Input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        required
        className="max-w-80"
      />
    </div>
  );
}
```

| State / property     | Default utilities                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------- |
| Size and spacing     | `h-10 w-full min-w-0` wrapper; `px-3 py-2` input                                          |
| Shape                | `rounded-sm border border-border`                                                         |
| Color and typography | `bg-surface font-sans text-base text-text` wrapper; `placeholder:text-muted` input        |
| Keyboard focus       | `has-focus-visible:border-focus has-focus-visible:ring-2 has-focus-visible:ring-focus/50` |
| Disabled             | `has-disabled:cursor-not-allowed has-disabled:bg-surface-alt has-disabled:opacity-50`     |
| Invalid              | `has-aria-invalid:border-danger has-aria-invalid:ring-2 has-aria-invalid:ring-danger/20`  |

Semantic colors follow light/dark selectors without separate dark utilities.
Text remains `text-base` at every width. File button styles use the same font and
text tokens. Color transitions respect reduced motion.

Provide a visible label or an accessible name. For an error, set `aria-invalid`
and connect an error message with `aria-describedby`; the input only styles the
state and does not render messages or validate values. Controlled values, event
handlers, and imperative refs belong in a client component in Next.js. The shared
input itself needs no client boundary. For checkbox, radio, range, or other
specialized native controls, supply appropriate overrides or a dedicated control;
the defaults target text-like inputs and file inputs.

The header uses this input as an accessible search field; product search is not
implemented. See [manual checks](../development/testing.md#client-styling-checks)
for verification steps. No build, lint, tests, or browser checks were run for this
change. A no-emit client typecheck was attempted on 2026-10-26 and stopped at
`TS6305`: the referenced shared-library declarations have not been built.

## Review status

The sizing and dark-mode comments have been addressed in source. Named SVGs
receive an overridable default size from the shared `Icon`, and the header uses
`bg-surface` and the client-local `font-poppins` backed by `next/font/google`. The outdated parent size-selector restriction and
claims of rendering specs have been removed. No shared UI rendering spec or
UI test runner is currently present. Runtime and browser validation remain open.

See [current validation](../operations/implementation-status.md#client-and-conflict-resolution-2026-10-27)
for the full review boundary.
