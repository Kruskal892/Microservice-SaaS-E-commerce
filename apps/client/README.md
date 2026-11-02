# Client

Next.js App Router scaffold with React and Tailwind CSS v4. The current UI
includes `Header` (with `HeaderBottom` sticky navigation, search input, and
account/wishlist/cart links), a placeholder home page, and a `/login` route
built with shared `@packages/ui` controls, `GoogleButton`, React Hook Form, and
Zod validation. Storefront screens, backend API integration, authentication
submission handlers, commerce flows, localization, and theme controls are not
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
implemented. The root layout loads Roboto and Poppins with `next/font/google`.
The body uses `font-roboto`; the header input and headings use `font-poppins`. These app-local
utilities map to font variables in `global.css`. Builds need network access for
Google font downloads.

See the [complete token reference](../../docs/reference/design-tokens.md) for
colors, type, spacing, radii, breakpoints, and utility examples. Use the client
`@/*` alias for `src/*`; keep server-only Prisma/Redis modules out of client code.

## Reusable components and Storybook

The shared UI library includes common buttons, form controls, menus, modals,
tabs, tooltips, badges and cards. Import from `@packages/ui`. App-level common
components live in `src/components/common` (such as `GoogleButton`, exported
through `@/components`). Run `npm run storybook` from the
repository root and open port 6006 for examples, state previews and controls.
See [component recipes](../../docs/reference/common-components.md),
[design contract](../../docs/design/shared-ui-system.md), and
[Storybook workflow](../../docs/development/storybook.md).

## Shared input and form validation

Import `Input`, `Field`, `Label`, `FieldError`, and `Checkbox` from `@packages/ui`.
`Input` supports native input props, React 19 refs, and token-based light/dark
defaults. `className` styles the flex field wrapper; `inputClassName` styles the
native input. Optional icons occupy their own flex space at the start or end.
`iconContainerClassName` styles the icon container; `iconClassName` styles
registered SVG icons. The header uses it for an accessible search field; search
behavior is not implemented. See [shared UI](../../docs/reference/shared-ui.md)
for examples and setup in other apps.

Client form schemas live in `src/schemas/` (such as `loginSchema` in
[auth.schema.ts](src/schemas/auth.schema.ts)) using `zod`, paired with the local
[`zodResolver`](src/utils/zod-resolver.ts) for `react-hook-form`.

Shared SVG files live in `packages/assets/icons/`; use `icon="SearchIcon"`,
`icon="LockIcon"`, or render `<Icon name="GoogleIcon" />`. The Next config uses
the installed SVGR loader in Turbopack and Webpack. Restart development after
config changes; see the shared UI guide to register more icons.

The current standalone client typecheck stops at `TS6305` when shared-library
declaration output is missing. This source-only review did not build it. The
shared `Icon` supplies an overridable `size-5` default; see
[review status](../../docs/reference/shared-ui.md#review-status).

## Header and common components

The root layout renders the default export from `components/layout/Header`.
Its folder contains `Header.tsx`, `HeaderBottom.tsx` (sticky navigation bar with
departments button, desktop navigation links from `src/app/constants/navigation-menu.ts`,
and mobile `<details>` menu), and an extensionless `index.ts` barrel.
`components/common/GoogleButton` provides a reusable Google sign-in UI button
combining `@packages/ui` `Button` and `<Icon name="GoogleIcon" />`. Both
`common` and `layout` are re-exported from `src/components/index.ts`.

The header links to `/login`, `/wishlist`, and `/cart`. `/login` renders the
login form UI; `/wishlist`, `/cart`, `/sign-up`, and `/forgot-password` do not
exist yet and return the not-found page. Wishlist/cart counters are static `0`
values. Search has an editable field without submission or API calls. Metadata
uses MicroShop; the visible header brand remains Eshop.

## Routes

| Route        | Current response                                                                                      |
| ------------ | ----------------------------------------------------------------------------------------------------- |
| `/`          | Placeholder page with the header and sticky `HeaderBottom` navigation                                 |
| `/login`     | Login card UI with `GoogleButton`, email/password `Field`/`Input`, `Checkbox`, and Zod/RHF validation |
| `/api/hello` | Plain text `Hello, from API!` from a Next.js route handler                                            |

The `/login` form `onSubmit` handler is currently a no-op placeholder and does
not call the backend `/api/login` endpoint. The hello handler is separate from
the Express gateway and auth endpoints.

Project-wide setup, architecture, checks, and limitations live in the
[documentation hub](../../docs/README.md).
