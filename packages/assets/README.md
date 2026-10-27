# Shared assets

Repo-wide source assets live here, independently of the UI components.
This folder belongs to the existing `packages` workspace; it does not need its
own package manifest.

```text
packages/assets/
|-- index.ts
|-- svg.d.ts
`-- icons/
    |-- index.ts
    |-- search.svg
    |-- lock.svg
    |-- profileIcon.svg
    |-- heartIcon.svg
    `-- cartIcon.svg
```

Any React app with the monorepo `@packages/*` alias and SVG-to-React loader can
import icons directly:

```tsx
import { SearchIcon } from '@packages/assets/icons';

<SearchIcon
  className="size-5 text-muted"
  aria-hidden="true"
  focusable="false"
/>;
```

`@packages/assets` exports the same icons. SVG imports require a default React
component export from the bundler; the client configures the installed SVGR
loader for Turbopack and Webpack. Include `packages/assets/svg.d.ts` for types.
TypeScript aliases alone do not configure runtime asset handling. Other runtimes
can use the raw `.svg` files with their own asset pipeline; this folder does not
publish URLs or copy files into each app's public directory.

To add an icon, put the SVG in `icons/` and export it from `icons/index.ts`.
Use `currentColor` for themeable fills/strokes. The current profile, heart, and
cart SVGs hardcode black, so text-color utilities do not recolor them. Every export is automatically
available for named UI usage such as `<Input icon="SearchIcon" />` or
`<Icon name="ProfileIcon" />`; no separate UI registry entry is needed. Available names are `SearchIcon`,
`LockIcon`, `ProfileIcon`, `HeartIcon`, and `CartIcon`. Names are case-sensitive;
the earlier lowercase `searchIcon`/`lockIcon` names are no longer supported.
Keep the barrel limited to SVG React components.

For named input icons, `iconContainerClassName` styles the flex icon area and
`iconClassName` styles the SVG. The shared `Icon` component merges its `size-5`
default before caller classes, so `iconClassName="size-8"` can replace it. Raw
SVG imports do not receive that default; set their size at the call site. Asset files
and registry entries alone do not change application bundler configuration.

Keep accessible names on meaningful icons or their enclosing controls; direct
SVG imports do not add accessibility attributes automatically. See the
[shared UI guide](../../docs/reference/shared-ui.md#svg-icon-library) for named
icons and input styling.
