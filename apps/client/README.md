# Client

Next.js App Router scaffold with React and Tailwind CSS v4. The current UI is the
original `Header` and placeholder page. Storefront screens, authentication UI,
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

[global.css](src/app/global.css) owns the supplied design tokens. The root layout
imports it; [postcss.config.mjs](postcss.config.mjs) uses `@tailwindcss/postcss`.
Use semantic utilities such as `bg-background`, `bg-surface`, `text-text`,
`text-muted`, and `border-border`. They follow `.dark` or `data-theme="dark"`
on the document; the default is light. Theme selection and persistence are not
implemented. Inter is the preferred font family, with a system fallback; no font
file is bundled or downloaded.

See the [complete token reference](../../docs/reference/design-tokens.md) for
colors, type, spacing, radii, breakpoints, and utility examples. Use the client
`@/*` alias for `src/*`; keep server-only Prisma/Redis modules out of client code.

## Routes

| Route        | Current response                                           |
| ------------ | ---------------------------------------------------------- |
| `/`          | Placeholder page with the existing header                  |
| `/api/hello` | Plain text `Hello, from API!` from a Next.js route handler |

The hello handler is separate from the Express gateway and auth endpoints. It
does not proxy requests or verify identity.

Project-wide setup, architecture, checks, and limitations live in the
[documentation hub](../../docs/README.md).
