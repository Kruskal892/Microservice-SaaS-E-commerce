# Troubleshooting

[Documentation index](../README.md)

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

Use `http://localhost:8080/gateway-health` for the local gateway response. `http://localhost:8080/` forwards to auth on port 6001. Other paths forward too, but auth only defines `GET /`, so an upstream 404 is expected for unimplemented routes.

Static asset middleware was removed; `/assets` now forwards to auth instead of serving gateway files.

## Gateway responds at /gateway-health but forwarding fails

The `/gateway-health` route does not call auth. Confirm auth responds at `http://localhost:6001/`, then try `http://localhost:8080/`. Changing the auth `PORT` override does not change the hard-coded upstream. A host-run gateway can reach the auth container using `-p 6001:3000`; separate containers need a reachable service address instead of localhost.

## Browser CORS errors

Only `http://localhost:3000` is allowed as a credentialed browser origin. `http://127.0.0.1:3000` and other ports are different origins. Update the intended allowlist when adding a frontend; do not treat CORS as authentication.

## Registration fails while destructuring email

`Cannot destructure property 'email' of 'data' as it is undefined` means the
registration validator received no parsed body. Auth now mounts `express.json()`
before its router. Restart auth after updating the code and send
`POST http://localhost:6001/api/user-registration` with
`Content-Type: application/json` and a JSON object containing `name`, `email`,
and `password`. Missing bodies return HTTP 400 with `Missing required fields`.
Swagger UI is at `/api-docs`, not `/docs`.

## Rate-limit warnings or unexpected client identities

The current raw-IP key generator can trigger the limiter's IPv6 validation warning. The one-hop proxy trust setting also accepts forwarded identities on direct connections. These settings need correction before limits can be relied on. An HTTP 429 response uses a 15-minute window and a process-local counter; see [API middleware](../api/api-specification.md).

## Environment file appears ignored

Neither application entry point explicitly loads `.env`. Set application process
variables in the launching terminal as described in [getting started](getting-started.md).
Prisma CLI is different: `prisma.config.ts` imports `dotenv/config`, so its
"skipping environment variable loading" notice does not mean `.env` was ignored.
A pre-existing shell `DATABASE_URL` takes precedence over the file.

## MongoDB SCRAM authentication failed

`bad auth : authentication failed` means Atlas rejected authentication. Verify the
database user under Atlas Database Access (not the Atlas website login), reset its
password if needed, and update the local `DATABASE_URL`. URL-encode special
characters in credentials and use the correct authentication database; Atlas SCRAM
users normally authenticate against `admin`. Copy the connection details for the
intended cluster. Never paste credentials into logs, PR evidence, or documentation.

The reported `npx prisma db push` attempt failed at authentication; no successful
schema/index synchronization is confirmed. Retry only after correcting credentials,
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

`@microservice-eshop/error-handler` maps to
`packages/error-handler/index.ts`; another folder such as `middleware` must
have its own `index.ts` before it can be imported. The wildcard belongs in
`compilerOptions.paths`, not a literal source filename in `files`.

If the IDE reports that `packages/*/index.ts` is missing, inspect the effective
config and real included files first. The direct no-emit diagnostic inspection
in this session expanded `packages/tsconfig.lib.json` to the three actual source
files and reported no compiler errors. That did not reproduce the IDE error or
establish its cause. If compiler diagnostics are clean while the IDE still
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
