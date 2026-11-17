# Vendor (Seller Center)

Next.js App Router application (`@microservice-eshop/vendor`) with React 19 and
Tailwind CSS v4. It provides the merchant-facing **Eshop Seller Center** shell
styled with the shared monochrome design tokens (`packages/ui/theme.css`).

The current `/` route renders a static Seller Center overview with hardcoded
preview data (merchant header, KPI summary cards, recent orders table, and store
setup checklist). Seller registration/authentication, product catalog management,
order fulfillment, and payout integrations are not connected yet.

## Run and check

Install dependencies at the repository root with `npm ci`, then run:

```sh
npm run vendor
```

To run the vendor app alongside `apps/client` (which defaults to port `3000`),
pass a custom port:

```sh
npx nx dev @microservice-eshop/vendor --port=3001
```

Build, start, and typecheck from the repository root:

```sh
npx nx build @microservice-eshop/vendor
npx nx start @microservice-eshop/vendor
node node_modules/typescript/bin/tsc -p apps/vendor/tsconfig.json --noEmit
```

Use `npm.cmd` or `npx.cmd` if PowerShell blocks `.ps1` wrappers. Build before
running `start`.

## Styling and shared tokens

- [`postcss.config.mjs`](postcss.config.mjs) enables `@tailwindcss/postcss`.
- [`src/app/global.css`](src/app/global.css) imports `tailwindcss`, the shared
  monochrome token theme ([`packages/ui/theme.css`](../../packages/ui/theme.css)),
  and registers `packages/ui` with `@source` for class scanning.
- [`tsconfig.json`](tsconfig.json) maps `@/*` to `./src/*` and `@packages/*` to
  `../../packages/*` while referencing `../../packages`. Keep server-only
  Prisma/Redis modules out of browser imports; import shared UI controls from
  `@packages/ui`.

See the [design token reference](../../docs/reference/design-tokens.md) and
[shared UI guide](../../docs/reference/shared-ui.md) for available tokens and
components.

## Routes

| Route        | Current response                                                                                      |
| ------------ | ----------------------------------------------------------------------------------------------------- |
| `/`          | Static Seller Center overview with merchant header, 4 KPI cards, recent orders, and setup checklist   |
| `/api/hello` | Plain text `Hello, from API!` from a local Next.js route handler                                      |

Project-wide setup, architecture, and implementation status live in the
[documentation hub](../../docs/README.md).
