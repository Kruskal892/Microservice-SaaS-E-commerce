# Client

Next.js App Router scaffold with React and Tailwind CSS v4. The current UI
includes `Header` (with `HeaderBottom` sticky navigation, search input,
account/wishlist/cart links, and a light/dark `ThemeToggle`), a placeholder `/`
page, and `/login` and `/sign-up` forms built with shared `@packages/ui`
controls, `AuthCard`, `PasswordInput`, React Hook Form, and Zod validation. Storefront
screens, backend API integration, authentication submission handlers, commerce
flows, and localization are not implemented.

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

## Styling and theme switching

[global.css](src/app/global.css) imports the supplied design tokens from
[the shared theme](../../packages/ui/theme.css) and registers `packages/ui` as a
Tailwind source. The root layout imports it; [postcss.config.mjs](postcss.config.mjs) uses `@tailwindcss/postcss`.
Use semantic utilities such as `bg-background`, `bg-surface`, `text-text`,
`text-muted`, and `border-border`. They follow `data-theme="dark"` or `.dark`
on the document root.

`layout.tsx` wraps the app in `next-themes` `ThemeProvider` with
`attribute="data-theme"` and `defaultTheme="system"`. The provider supplies the
startup script, persists the preference under the existing `localStorage`
`theme` key, and synchronizes browser tabs. System changes are followed while
the preference is `system`. Selecting a mode with the binary switch saves an
explicit preference. There is no System option in the current UI; use
`setTheme('system')` to resume following the OS.
[`ThemeToggle`](src/components/common/ThemeToggle/ThemeToggle.tsx) uses
`useTheme().resolvedTheme` to display the effective mode and `setTheme()` to
select `"light"` or `"dark"`. The switch is disabled until mounted to keep the
server and initial browser markup consistent. Existing CSS tokens and
`dark:*` selectors continue to work without a custom DOM observer.

The root layout loads Roboto and Poppins with `next/font/google`.
The body, header search, and auth controls use `font-roboto`; the brand and auth
headings use `font-poppins`. These app-local utilities map to font variables in
`global.css`. Builds need network access for
Google font downloads.

See the [complete token reference](../../docs/reference/design-tokens.md) for
colors, type, spacing, radii, breakpoints, and utility examples. Use the client
`@/*` alias for `src/*`; keep server-only Prisma/Redis modules out of client code.

## Reusable components and Storybook

The shared UI library includes common buttons, form controls, menus, modals,
tabs, tooltips, badges and cards. Import from `@packages/ui`. App-level common
components live in `src/components/common` (`AuthCard`, `PasswordInput`, `GoogleButton`, and `ThemeToggle`,
exported through `@/components`). Run `npm run storybook` from the
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

Client form schemas live in `src/schemas/` (`loginSchema` and `signUpSchema` in
[auth.schema.ts](src/schemas/auth.schema.ts)) using `zod`, paired with the local
[`zodResolver`](src/utils/zod-resolver.ts) for `react-hook-form`.

Shared SVG files live in `packages/assets/icons/`; use `icon="SearchIcon"`,
`icon="LockIcon"`, or render `<Icon name="GoogleIcon" />`, `<Icon name="SunIcon" />`,
or `<Icon name="MoonIcon" />`. The Next config uses
the installed SVGR loader in Turbopack and Webpack. Restart development after
config changes; see the shared UI guide to register more icons.

The current standalone client typecheck stops at `TS6305` when shared-library
declaration output is missing. This source-only review did not build it. The
shared `Icon` supplies an overridable `size-5` default; see
[review status](../../docs/reference/shared-ui.md#review-status).

## Header and common components

The root layout renders the default export from `components/layout/Header`.
Its folder contains `Header.tsx` (brand, search, and account actions),
`HeaderBottom.tsx` (CSS-sticky navigation with active-page links and a mobile
`<details>` menu), and `HeaderActions.tsx` (shared account/cart/theme controls).
The navigation is a sibling of the top header so it can remain sticky through
the page. Quick actions appear when the navigation reaches the viewport top.
Wishlist is available in the mobile menu; the unused Departments button and
empty count badges are omitted. The menu closes when a link is selected.
`components/common/GoogleButton` provides a reusable Google sign-in UI button
combining `@packages/ui` `Button` and `<Icon name="GoogleIcon" />`.
`components/common/ThemeToggle` uses the shared Radix-backed `Switch` with a
stable "Dark mode" label, an announced checked state, and sun/moon indicators.
Both `common` and `layout` are re-exported from `src/components/index.ts`.

The header links to `/login`, `/wishlist`, and `/cart`. `/login` renders the
login form UI and `/sign-up` renders a registration form scaffold; `/wishlist`, `/cart`,
and `/forgot-password` do not exist yet and return the not-found page.
Wishlist/cart are not connected to data. Search has an editable field
without submission or API calls. Metadata uses MicroShop; the visible header
brand remains Eshop.

## Routes

| Route        | Current response                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------------------- |
| `/`          | Placeholder page with the header, `ThemeToggle`, and sticky `HeaderBottom` navigation                   |
| `/login`     | Login card UI with `GoogleButton`, email/password `Field`/`Input`, `Checkbox`, and Zod/RHF validation   |
| `/sign-up`   | Name/email/password/confirmation form scaffold with Zod/RHF validation and password visibility controls |
| `/api/hello` | Plain text `Hello, from API!` from a Next.js route handler                                              |

Both auth forms validate locally and show an unavailable status on valid
submission; no credentials are logged or sent. Google sign-in is visibly
unavailable. `AuthCard` shares the page shell, and `PasswordInput` retains native
input props and refs while adding an accessible `EyeIcon`/`EyeOffIcon` button.
Sign-up enforces matching passwords and the backend's name, email, and password
length limits.

`signUpSchema` trims name/email, requires a name of 1–100 characters and a valid
email of at most 254 characters, and accepts passwords of 8–128 characters.
Confirmation must match the password; password whitespace is preserved.
Client validation is scaffolding and does not replace backend validation.

`PasswordInput` suppresses Edge's native `::-ms-reveal` button inside the native
input so it does not duplicate the custom eye control. This override is scoped
to `PasswordInput`; the generic shared `Input` stays unchanged. Keyboard access,
password-manager overlays, and rendering still need browser verification.

A permanent focused schema test is available but has not been run for this change:

```sh
node --experimental-strip-types --test apps/client/src/schemas/auth.schema.test.ts
```

The forms do not call the backend auth endpoints. The hello handler is separate from
the Express gateway and auth endpoints.

Project-wide setup, architecture, checks, and limitations live in the
[documentation hub](../../docs/README.md).
