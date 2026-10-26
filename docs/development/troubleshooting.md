# Troubleshooting

[Documentation index](../README.md)

**Reviewed:** 2026-10-25. Configuration defaults belong to the
[configuration reference](../reference/configuration.md).

## Shared input styling and compiler errors

`className` styles the flex wrapper; use `inputClassName` for the native input,
`iconContainerClassName` for icon-area background/padding, and `iconClassName`
for a registered SVG. Named icons get an overridable `size-5` default from
the shared `Icon`; give custom React elements their own SVG size. The header
uses `bg-surface` and `font-sans` so it follows the supplied theme. See
[review status](../reference/shared-ui.md#review-status).

If a no-emit client check reports `TS6305` for shared UI declarations, the
referenced shared project outputs are missing or stale. A normal shared build
is a prerequisite; changing font/icon classes does not resolve that diagnostic.
No build was performed during the 2026-10-26 source review.

## Client styles or theme tokens do not appear

Start the frontend with `npm run client`; the backend `npm run dev` script does
not start its `dev` target. Confirm `layout.tsx` imports `global.css`, which
imports Tailwind and `packages/ui/theme.css`, registers `packages/ui` with
`@source`, and `postcss.config.mjs` registers `@tailwindcss/postcss`. Relative CSS
paths must match the consuming app; see [shared UI](../reference/shared-ui.md).
Install dependencies at the root workspace rather than creating a second lockfile.

Use full class names from the [token reference](../reference/design-tokens.md).
Semantic colors use `bg-surface`, `text-text`, `text-muted`, and `border-border`.
The configured viewport prefixes are `mobile:`, `tablet:`, and `desktop:`;
default `sm/md/lg/xl/2xl` viewport variants were replaced. Dark colors require
`.dark` or `data-theme="dark"` on `<html>`; there is no theme toggle or preference
storage. Inter uses a system fallback until font delivery is implemented.

The header search input and placeholder page are intentional; product search is not implemented. A token setup does
not add catalog, authentication, cart, or checkout screens. Backend CORS still
allows only `http://localhost:3000`; an occupied port causing Next to choose
another port matters when API integration is added. Gateway E2E also defaults
to 3000 incorrectly; keep it separate from client development.

## Dependency installation fails

Run `node --version` and `npm --version` from the repository root. CI uses Node 24. Use `npm ci` with the committed lockfile.

If npm reports that package.json and the lockfile disagree after an intentional dependency change, reconcile them with the change owner rather than deleting the lockfile. Registry/network or permission failures need to be resolved separately.

## Port already in use

The defaults are auth `6001` and gateway `8080`. Check existing listeners in PowerShell:

```powershell
Get-NetTCPConnection -State Listen -LocalPort 6001,8080 -ErrorAction SilentlyContinue
```

Stop the development process you own with Ctrl+C, or start the desired app on a different port in its own terminal. Do not terminate an unidentified process.

Both applications read `PORT`, so a shared override can make both apps use the same port. Check the terminal environment:

```powershell
Get-Item Env:PORT -ErrorAction SilentlyContinue
```

Clear an override you no longer need:

```powershell
Remove-Item Env:PORT -ErrorAction SilentlyContinue
```

## Gateway returns 404

Use `http://localhost:8080/gateway-health` for the local gateway response. `http://localhost:8080/` forwards to auth on port 6001. Auth also defines registration, verification, login, and Swagger routes. Unimplemented paths return an upstream 404.

Static asset middleware was removed; `/assets` now forwards to auth instead of serving gateway files.

## Gateway responds at /gateway-health but forwarding fails

The `/gateway-health` route does not call auth. Confirm auth responds at `http://localhost:6001/`, then try `http://localhost:8080/`. Changing auth PORT requires updating AUTH_SERVICE_URL in the gateway environment. A host-run gateway can reach the auth container using `-p 6001:3000`; separate containers need a reachable service address instead of localhost.

## Browser CORS errors

Only `http://localhost:3000` is allowed as a credentialed browser origin. `http://127.0.0.1:3000` and other ports are different origins. The client scaffold defaults to the allowed origin but makes no backend requests yet. Update the intended allowlist when changing the frontend origin; do not treat CORS as authentication.

## Registration fails while destructuring email

`Cannot destructure property 'email' of 'data' as it is undefined` means the
registration validator received no parsed body. Auth now mounts `express.json()`
before its router. Restart auth after updating the code and send
`POST http://localhost:6001/api/user-registration` with
`Content-Type: application/json` and a JSON object containing `name`, `email`,
and `password`. Missing or non-object bodies return HTTP 400 with `Request body must be an object`.
Swagger UI is at `/api-docs`, not `/docs`.

## Swagger paths or examples are stale

Run `npm run auth-docs` from the repository root, restart auth, then reload
`http://localhost:6001/api-docs`. The service reads committed JSON at startup.
`/docs-json` shows the document loaded by that process; it does not regenerate it.
The generator must scan `main.ts` to retain the `/api` router prefix. Required
request fields and concrete examples come from `#swagger` controller/router comments;
inference alone cannot see registration's helper validation or choose examples.
If you change the auth HTTP port, Swagger's advertised host must also be updated;
it currently stays fixed at `localhost:6001`.

## Password recovery delivery and authorization

Recovery mail now uses the supplied email and the recovery template. Check SMTP
and Redis configuration for delivery errors; a failed send still consumes a
request. OTP submission awaits verification, but reset still accepts
email/newPassword without proof of verification. See
[recovery blockers](authentication.md#password-recovery-blockers) and the
[current API contract](../reference/api.md#password-recovery-incomplete-and-unsafe).

## Login fails or cookies are missing

Send JSON with `email` and `password` to `POST /api/login`. Use the stored email
exactly: login does not trim/lowercase it. Missing fields in an object return 400,
an unknown user returns 400, and an absent hash or wrong password returns 401.
An absent parsed body can instead reach the generic 500 response.

Set both `JWT_ACCESS_TOKEN_SECRET` and `JWT_REFRESH_TOKEN_SECRET` in the auth
environment. Missing signing secrets fail at `jwt.sign`; TypeScript assertions
do not supply values. Keep secret values out of diagnostics.

Inspect `Set-Cookie` in the response and browser cookie rejection reasons.
Browser calls need credentials enabled and the allowed origin. The helper always
sets Secure, HttpOnly, SameSite=None cookies; verify storage in your intended HTTPS
setup. HttpOnly cookies are not readable with `document.cookie`. Both cookies
remain for 7 days, but the access JWT expires after 15 minutes. Refresh, logout,
and token verification routes/middleware are not implemented, so cookie issuance
alone does not establish working authenticated requests. See
[the login contract](../reference/api.md#login-and-jwt-cookies).

## Rate-limit warnings or unexpected client identities

Gateway uses the default IPv6-aware keys and in-memory counters. Proxy trust
is disabled by default. Configure a real ingress topology before trusting
forwarded headers. Multiple gateway processes currently have separate quotas.
Redis-backed limiting is deferred in the [future plan](../future-plans/architecture/redis-and-runtime-plan.md).

## Environment file appears ignored

Both entry points load dotenv at startup. Run from the repository root and use
.env.example as a placeholder guide. Existing shell variables take precedence.
Redis keeps its original client; there is no shared config package or custom
port parser. Auth defaults to 6001, gateway to 8080; PORT overrides that process.

## MongoDB SCRAM authentication failed

`bad auth : authentication failed` means Atlas rejected authentication. Verify the
database user under Atlas Database Access (not the Atlas website login), reset its
password if needed, and update the local `DATABASE_URL`. URL-encode special
characters in credentials and use the correct authentication database; Atlas SCRAM
users normally authenticate against `admin`. Copy the connection details for the
intended cluster. Never paste credentials into logs, PR evidence, or documentation.

No current successful schema/index synchronization is established by this
documentation review. Retry a failed push only after correcting credentials,
against the intended development database. See [database setup](getting-started.md#prisma-and-mongodb).

## Prisma editor uses incompatible schema syntax

If startup reports `@prisma/client did not initialize yet`, run
`npx prisma generate` from the workspace root, then restart auth. The schema uses
Prisma 6's `prisma-client-js` generator, matching the wrapper's `@prisma/client`
import. The former custom `generated/prisma` output did not initialize that
package. Restarting the TypeScript server alone does not generate a client.

The workspace uses Prisma 6.19 with MongoDB `String @db.ObjectId` fields and a
`datasource` block. Keep the VS Code `prisma.pinToPrisma6` setting enabled for this
checkout; Prisma 8 RC contract syntax from earlier experiments does not describe
the current schema.

## Nx cannot find a project or target

Use full names such as `@microservice-eshop/auth-service`, run commands at the root, and install dependencies first.

```sh
npx nx show projects
npx nx show project @microservice-eshop/api-gateway
```

Check both the project's package configuration and plugins in `nx.json`. The gateway build is inferred from Webpack configuration, so looking only for an explicit `build` entry in its package file is insufficient.

If Nx reports stale workspace state after configuration changes, stop running Nx processes before using `npx nx reset`, then inspect the project again. This resets local Nx state; it does not fix application code.

If auth warns that the daemon is not running, stop the serve command and run
`npx nx reset --onlyDaemon`, followed by `npx nx daemon --start`, then restart
serve. A previous daemon failure can leave `.nx/workspace-data/d/disabled` in
place. Also check that the launching terminal does not set `NX_DAEMON=false`.
Auth uses `runBuildTargetDependencies: true`, whose file watching requires the
daemon. This warning is separate from a Prisma initialization crash.

## Compiler errors or missing emitted JavaScript

### Folder imports and literal wildcard diagnostics

`@packages/error-handler` maps to
`packages/error-handler/index.ts`; another folder such as `middleware` must
have its own `index.ts` before it can be imported. The wildcard belongs in
`compilerOptions.paths`, not a literal source filename in `files`.

If the IDE reports that `packages/*/index.ts` is missing, inspect the effective
config and real included files first. The shared library includes `**/*.ts`;
the wildcard alias is not a literal file entry. If compiler diagnostics are clean while the IDE still
reports the error, select **TypeScript: Select TypeScript Version > Use Workspace
Version**, then **TypeScript: Restart TS Server**; reload the editor window if
needed. Do not replace the wildcard with per-folder configs solely to clear
an unconfirmed editor diagnostic.

For runtime `Cannot find module` errors, remember that TypeScript paths do not
create Node packages. Auth bundles the alias targets with esbuild; other apps
and Jest need their own resolution setup. See
[shared module setup](development-guide.md#adding-shared-modules).

### Compiler ownership

If auth's build reports `TS6307` for files under `packages/` while its separate
typecheck passes, inspect esbuild's declaration setting. The executor's
declaration checker can read shared source without the project references used
by the standalone typecheck. Auth sets `declaration: false` in its build target
and disables `declarationMap` and `emitDeclarationOnly` in its app config so
esbuild uses no-emit typechecking. Keep shared-library declarations enabled;
do not widen auth's source inclusion just to hide this build error.

Read the exact task error before editing compiler settings. The auth service uses esbuild; the gateway uses Webpack with TypeScript compilation. Shared settings include `emitDeclarationOnly` and project references, so a raw `tsc` command is not interchangeable with an application build.

See [compiler ownership](development-guide.md) for the relevant configuration chain. Do not disable strictness or change shared emission settings solely to hide an application-specific error.

## Gateway E2E waits, fails, or unexpectedly passes

Its generated setup defaults to port 3000 and its spec checks the auth response at `/`. The gateway uses port 8080; `/gateway-health` is local, while `/` forwards to auth on 6001. Read [the mismatch details](testing.md) before running it. Its teardown can terminate a process on the test port.

## Debugger port conflicts or unbound breakpoints

The service targets set inspection ports 9229 (auth) and 9230 (gateway). VS Code
attaches to child processes without setting `NODE_OPTIONS`, avoiding inherited
inspection flags on Nx and its children. Remove a stale `NODE_OPTIONS` inspection
flag from the launching terminal and stop duplicate debug sessions if a port is
still occupied. Inspect the owning process before stopping it.

Use the matching app's debug configuration and confirm source-map paths match its distribution directory. Run only that app while diagnosing the debugger. The existing launch configurations were not verified by this documentation work.
