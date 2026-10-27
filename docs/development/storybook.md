# Component development with Storybook

[Design contract](../design/shared-ui-system.md) ·
[Usage recipes](../reference/common-components.md) ·
[Figma](https://www.figma.com/design/SXjnKoIBg4Laj7RqjVgQHo?node-id=7-110)

## Run

From the repository root after `npm ci`:

```sh
npm run storybook
```

Open `http://localhost:6006`. Storybook uses React/Vite and the shared theme; it
does not start Next.js, auth, gateway, Redis or MongoDB. No environment secrets
or Google font downloads are needed. Use a supported Node version for Vite
(`20.19+` or `22.12+`; repository CI uses Node 24).

Commands available on explicit request:

```sh
npm run storybook:typecheck
npm run storybook:build
```

The build writes ignored `storybook-static/` for static hosting. It is not
published automatically. Builds do not establish that interaction or
accessibility tests pass. Do not run lint, build or tests automatically.

## Explore

- Autodocs includes source examples and prop controls. Compound component
  examples demonstrate composition; see usage recipes for the complete API.
- Theme and direction toolbars switch the document root and Radix direction
  provider, including portaled content.
- Button / State Matrix shows primary/secondary/ghost/danger across default,
  hover, focus-visible, active, disabled and loading. Separate stories cover
  pressed, icon-only, icon+label and sizes.
- CSS pseudo-state previews use the
  [pseudo-states addon](https://storybook.js.org/addons/storybook-addon-pseudo-states).
  They demonstrate authored CSS; they do not simulate native browser focus or
  prove keyboard accessibility.
- The accessibility panel is available for manual review. Automated a11y status
  remains `todo` until the team explicitly runs and reviews it.
- Story play functions are permanent interaction checks. Opening such a story
  in Storybook runs its play function; no play functions were run during this
  implementation. There is no separate headless interaction-test runner yet.

## Add or change a component

1. Reuse the existing native/Radix pattern, `cn`, tokens and folder exports.
2. Preserve underlying props/refs and expose caller `className` overrides.
3. Add a colocated `Component.stories.tsx` with `Meta`/`StoryObj`, examples,
   controls, supported states and usage/accessibility guidance.
4. Add a small permanent play check for new behavior. Import test utilities
   from `storybook/test`; use `canvasElement.ownerDocument.body` for portal
   queries. Do not access Storybook's parent document.
5. Update design/usage docs and Figma variants/tokens. Keep mains outside the
   Figma review sheets; show instances for review.
6. Run only the checks requested for the change, and record their actual result.

Stories are excluded from the shared-library and client compilation. The
separate `.storybook/tsconfig.json` includes both stories and shared source;
it does not depend on generated `packages/dist` declarations.

## Configuration

`.storybook/main.ts` configures React/Vite, `@packages` aliasing, React deduping,
the Tailwind Vite plugin and SVG-to-React imports via `vite-plugin-svgr`.
`preview.css` imports the theme and scans UI/stories. `preview.tsx` configures
global decorators, theme/direction controls and TooltipProvider. Telemetry is
disabled. Storybook/addons are pinned to the same release.

Shared primitives depend on `radix-ui` in the existing `packages` workspace.
Storybook/Vite/addons remain root development dependencies. The lockfile records
the installed tree. No new workspace package or root infrastructure import is
required.

## Verification boundary and known issues

The focused Storybook TypeScript check passed and the local development server
started with 56 stories and 16 autodocs pages. HTTP checks confirmed the story
index, transformed SVG modules, Button
story module and generated action/switch CSS. No browser was available in this
session. Lint, production builds, application tests and story play checks were
not run. Startup and source typing do not prove browser rendering, touch/RTL
interaction, screen-reader behavior or accessibility conformance.

The original profile/heart/cart SVGs still hardcode black. Icon stories document
this existing dark-mode limitation; this component library does not change the
storefront Header or missing app routes.

The installation advisory check reported 31 workspace vulnerabilities, including
an existing critical Next.js advisory. The reported entries concern existing
Next/Prisma/Nx/backend tooling; Radix and the added Storybook/Vite packages were
not listed as vulnerable entries. No broad `npm audit fix` or unrelated framework
upgrade was applied. Dependency remediation remains separate work.

Figma is a draft: account quota blocked the cover/specimen sheets and final
post-fix visual checks. Code Connect is unavailable on the current plan/seat.
See the [Figma completion boundary](../design/shared-ui-system.md#figma-completion-boundary).

Final static checks: all 35 repository documentation files checked had valid
local file and heading links. Shared manifest dependencies and React peer
requirements match the lockfile. Git whitespace checks passed. These results
are source/configuration evidence, not browser or interaction-test results.
