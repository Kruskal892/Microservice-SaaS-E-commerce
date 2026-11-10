# Configuration reference

[Documentation hub](../README.md) · [Setup](../development/getting-started.md)

**Status:** Inputs read by current source. **Backend snapshot:** 2026-10-25;
**client configuration updated:** 2026-11-05.

Both backend application entry points import `dotenv/config`. Use a root `.env` based on
[.env.example](../../.env.example) and run development commands from the root.
Existing process environment variables take precedence. Prisma CLI also loads
dotenv through [prisma.config.ts](../../prisma.config.ts).

## Environment inputs

| Variable                   | Consumer                              | Default / behavior                                                                                                |
| -------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `PORT`                     | Each backend HTTP app                 | Auth `6001`, gateway `8080`; a supplied value passes through `Number()` with no explicit integer/range validation |
| `AUTH_SERVICE_URL`         | Gateway                               | `http://localhost:6001`; all forwarded paths use this one upstream                                                |
| `DATABASE_URL`             | Prisma CLI/client                     | MongoDB connection string; root example uses local `eshop`; no application fallback                               |
| `REDIS_DATABASE_URL`       | Auth Redis client                     | Passed directly to ioredis; root example uses `redis://127.0.0.1:6379`; no application validation                 |
| `SMTP_HOST`                | Auth mail                             | Passed to Nodemailer; root example is a placeholder                                                               |
| `SMTP_SERVICE`             | Auth mail                             | Optional Nodemailer provider setting; read in code but absent from `.env.example`                                 |
| `SMTP_PORT`                | Auth mail                             | `Number(value) \|\| 587`; exact string `'465'` enables implicit TLS                                               |
| `SMTP_USER`                | Auth mail                             | SMTP authentication user and sender address                                                                       |
| `SMTP_PASSWORD`            | Auth mail                             | SMTP authentication secret                                                                                        |
| `JWT_ACCESS_TOKEN_SECRET`  | Auth login/refresh; shared middleware | Access JWT signing/verification secret; no fallback; JWT expires in 15 minutes                                    |
| `JWT_REFRESH_TOKEN_SECRET` | Auth login/refresh                    | Refresh JWT signing/verification secret; no fallback; JWT expires in 7 days                                       |
| `NODE_ENV`                 | Prisma wrapper / gateway build        | Prisma global reuse outside production; gateway source-map configuration checks production                        |
| `NEXT_PUBLIC_API_URL`      | Client Axios instance                 | Base URL for browser requests (`apps/client/src/api/client.ts`), e.g. `http://localhost:8080`; 15-second timeout  |
| `HOST`                     | E2E setup only                        | Test destination defaults to `localhost`; HTTP apps do not read it as a bind address                              |

The Redis non-null assertion is a TypeScript annotation, not a runtime check.
Supply a TCP `redis://` or `rediss://` URL for the existing client. No central
configuration parser validates missing inputs or waits for dependencies.
Redis connection and command timeouts are five seconds, the offline command
queue is disabled, and requests allow one retry. The client reconnects in the
background; OTP admission returns 503 until Redis is ready.
Registration, OTP verification, and login browser requests time out after 15
seconds and do not retry automatically. Login enables Axios `withCredentials`
for the request; the shared Axios instance does not enable it globally.

Set distinct JWT signing secrets in your local `.env` or deployment environment;
the `.env.example` values are placeholders. Login passes the values directly to
`jwt.sign`. Missing secrets are discovered during signing and reach the generic
500 handler, rather than failing startup validation. Keep secret values out of
logs, screenshots, and PR evidence.

## Ports and local topology

```mermaid
flowchart LR
    Browser["Next.js client<br/>localhost:3000"] -->|"NEXT_PUBLIC_API_URL (registration, OTP verification, login)"| Gateway["Gateway HTTP<br/>:8080"]
    Gateway -->|"AUTH_SERVICE_URL"| Auth["Auth HTTP<br/>:6001"]
    AuthDebug["Nx inspector :9229"] -.-> Auth
    GatewayDebug["Nx inspector :9230"] -.-> Gateway
```

Leave `PORT` unset in `.env` and the launching shell when running `npm run dev`.
A shared override reaches both services, causing a port conflict. To use custom
ports, start each app in its own environment and set the gateway's
`AUTH_SERVICE_URL` to the auth address. Inspector ports are separate Nx serve
options, not HTTP destinations.

In the auth Dockerfile `PORT=3000` is configured; `-p 6001:3000` publishes it for a
host-run gateway. The Dockerfile also sets `HOST=0.0.0.0`, but the app does not
read `HOST`. See [deployment](../operations/deployment.md) for container network
and packaging limits.

## Client configuration

[`apps/client/src/api/client.ts`](../../apps/client/src/api/client.ts) reads
`NEXT_PUBLIC_API_URL` (typically configured in `apps/client/.env`, for example
`http://localhost:8080`) and configures a 15-second Axios timeout. The client has
no locale or theme environment variables. `npm run client` starts Next.js
development on port 3000 by default. The framework can accept a different port
through its CLI/environment; keep backend CORS aligned when calling the API.
Avoid a shared `PORT` override when launching the backend and client together.

Client dependencies are installed at the root npm workspace. Its
[Next config](../../apps/client/next.config.js) configures `@svgr/webpack` for SVG
component imports in Turbopack and Webpack, with no rewrites or proxy configuration. [PostCSS](../../apps/client/postcss.config.mjs) loads
`@tailwindcss/postcss`; [global.css](../../apps/client/src/app/global.css) imports
the palette/scales from [packages/ui/theme.css](../../packages/ui/theme.css) and
registers the shared UI source for Tailwind scanning. See [shared UI](shared-ui.md)
for additional consuming apps. `apps/client/index.d.ts` imports the shared
SVG declarations with `import '@packages/assets/svg'`, satisfying the client's
`@typescript-eslint/triple-slash-reference` rule. Client TypeScript maps
`@packages/*`, includes shared TSX, and references the shared composite project;
its declaration outputs must exist for the standalone no-emit check. See [design tokens](design-tokens.md) for exact utilities and
light/dark selectors. The client declares `next-themes` in its workspace
dependencies and mounts `ThemeProvider` in `src/app/providers.tsx` with `attribute="data-theme"` and
`defaultTheme="system"`. It uses the `theme` localStorage key and needs no theme
environment variable. The provider owns initial selection, persistence,
cross-tab synchronization, and live system tracking while `system` is selected.
The inline bootstrap uses `text/javascript` during server rendering and inert
`application/json` during client rendering. This workaround for the script-tag
console warning is present in source; browser/hydration behavior is unverified.
`ThemeToggle` reads `resolvedTheme`, calls `setTheme()`, and stays disabled until
mounted. Keep theme changes inside this API instead of directly editing the DOM.
The shared theme bundles DM Sans from `packages/assets/fonts/`; all client and
shared UI text uses `font-sans`. Font loading does not require Google downloads.

## Fixed backend policy

These settings are currently source constants, not environment variables:

| Setting                                 | Value / owner                                                                       |
| --------------------------------------- | ----------------------------------------------------------------------------------- |
| Browser origin                          | `http://localhost:3000`, credentials enabled in both apps                           |
| Allowed CORS request headers            | `Authorization`, `Content-Type`                                                     |
| Auth JSON / gateway proxy body limit    | 16 KB                                                                               |
| Gateway quota                           | 100 requests / 15 minutes, per-process in-memory store                              |
| Gateway upstream timeout                | 10,000 ms                                                                           |
| SMTP connection/greeting/socket timeout | 10,000 ms each                                                                      |
| OTP lifetime / cooldown                 | 300 / 60 seconds                                                                    |
| OTP counter / spam-lock expiry          | 3,600 seconds; counter expiry refreshed on each allowed increment                   |
| Access / refresh JWT expiry             | 15 minutes / 7 days; payload contains user ID and fixed `role: 'user'`              |
| Auth cookie names                       | `access_token`, `refresh_token`                                                     |
| Both auth cookie policies               | `httpOnly: true`, `secure: true`, `sameSite: 'none'`, 7-day `maxAge` (604800000 ms) |
| Swagger advertised host                 | `localhost:6001` in committed JSON                                                  |

Sources: [gateway](../../apps/api-gateway/src/main.ts),
[auth](../../apps/auth-service/src/main.ts),
[OTP helpers](../../apps/auth-service/src/utils/auth.helper.ts), and
[mail](../../apps/auth-service/src/mail/mail.client.ts),
[login controller](../../apps/auth-service/src/controller/auth.controller.ts), and
[cookie helper](../../apps/auth-service/src/utils/cookies/setCookies.ts).
Cookies are always marked Secure; there is no `NODE_ENV` override. Their retention
and JWT expiry differ for the access token. Refresh replaces only the access
cookie; the original refresh JWT expiry is unchanged. Auth parses incoming
cookies. Shared middleware verifies access JWTs but is not mounted on current
production routes. Refresh/middleware check their verification secret at request
time; missing configuration remains a server error. Rotation/revocation, logout,
CSRF policy, and production browser behavior still need implementation/validation.
Future validation, shared quotas, and ingress decisions are in the
[Redis/runtime plan](../future-plans/architecture/redis-and-runtime-plan.md).
