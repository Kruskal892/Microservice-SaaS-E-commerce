# Client

Next.js App Router scaffold with React and Tailwind CSS v4. The current UI is the
`Header` with the shared search input and a placeholder page. Storefront screens, authentication UI,
commerce flows, API integration, localization, and theme controls are not
implemented.

## Run and check

Install dependencies at the repository root with `npm ci`, then run:

```sh
npm run client
```

Open `http://localhost:3000`. `npm run dev` starts the backend `serve` targets;
the client uses a separate `dev` target. The client scaffold does not require
MongoDB, Redis, SMTP, JWT secrets, or a client environment file.

```sh
npx nx build @microservice-eshop/client
npx nx start @microservice-eshop/client
node node_modules/typescript/bin/tsc -p apps/client/tsconfig.json --noEmit
```

Run these commands from the repository root. Use `npm.cmd` or `npx.cmd` if
PowerShell blocks the `.ps1` wrappers. Build before using `start`.

## Styling

[global.css](src/app/global.css) imports the supplied design tokens from
[the shared theme](../../packages/ui/theme.css) and registers `packages/ui` as a
Tailwind source. The root layout imports it; [postcss.config.mjs](postcss.config.mjs) uses `@tailwindcss/postcss`.
Use semantic utilities such as `bg-background`, `bg-surface`, `text-text`,
`text-muted`, and `border-border`. They follow `.dark` or `data-theme="dark"`
on the document; the default is light. Theme selection and persistence are not
implemented. Inter is the preferred font family, with a system fallback; no font
file is bundled or downloaded.

See the [complete token reference](../../docs/reference/design-tokens.md) for
colors, type, spacing, radii, breakpoints, and utility examples. Use the client
`@/*` alias for `src/*`; keep server-only Prisma/Redis modules out of client code.

## Shared input

Import `Input` from `@packages/ui`; it supports native input props and React 19
refs and token-based light/dark defaults. `className` styles the flex field
wrapper; `inputClassName` styles the native input. Optional icons occupy their
own flex space at the start or end. `iconContainerClassName` styles the icon
container; `iconClassName` styles registered SVG icons. The header uses
it for an accessible search field; search behavior is not implemented. See
[shared UI](../../docs/reference/shared-ui.md) for examples and setup in other apps.

Shared SVG files live in `packages/assets/icons/`; use `icon="searchIcon"` or
`icon="lockIcon"`, or render `<Icon name="searchIcon" />`. The Next config uses
the installed SVGR loader in Turbopack and Webpack. Restart development after
config changes; see the shared UI guide to register more icons.

The current standalone client typecheck stops at `TS6305` when shared-library
declaration output is missing. This source-only review did not build it. The
shared `Icon` now supplies an overridable `size-5` default; see
[review status](../../docs/reference/shared-ui.md#review-status).

## Routes

| Route        | Current response                                           |
| ------------ | ---------------------------------------------------------- |
| `/`          | Placeholder page with the existing header                  |
| `/api/hello` | Plain text `Hello, from API!` from a Next.js route handler |

The hello handler is separate from the Express gateway and auth endpoints. It
does not proxy requests or verify identity.

Project-wide setup, architecture, checks, and limitations live in the
[documentation hub](../../docs/README.md).
