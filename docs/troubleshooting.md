# Troubleshooting

[Documentation index](README.md)

## Dependency installation fails

Run `node --version` and `npm --version` from the repository root. CI uses Node 24. Use `npm ci` with the committed lockfile.

If npm reports that package.json and the lockfile disagree after an intentional dependency change, reconcile them with the change owner rather than deleting the lockfile. Registry/network or permission failures need to be resolved separately.

## Port already in use

The defaults are auth `3000` and gateway `3333`. Check existing listeners in PowerShell:

```powershell
Get-NetTCPConnection -State Listen -LocalPort 3000,3333 -ErrorAction SilentlyContinue
```

Stop the development process you own with Ctrl+C, or start the desired app on a different port in its own terminal. Do not terminate an unidentified process.

If `npm run dev` causes both apps to use the same port, check whether `PORT` is set in the terminal environment:

```powershell
Get-Item Env:PORT -ErrorAction SilentlyContinue
```

Clear an override you no longer need:

```powershell
Remove-Item Env:PORT -ErrorAction SilentlyContinue
```

## Gateway returns 404

Use `http://localhost:3333/api`. The gateway has no root `GET /` handler and no forwarding routes. A successful auth request at port 3000 does not demonstrate gateway behavior.

Static asset requests need a file in the gateway's assets directory; the source directory currently only has a placeholder.

## Environment file appears ignored

Neither entry point explicitly loads `.env`. Set process variables in the launching terminal as described in [getting started](getting-started.md). Avoid assuming a planned integration's configuration keys already exist.

## Nx cannot find a project or target

Use full names such as `@microservice-eshop/auth-service`, run commands at the root, and install dependencies first.

```sh
npx nx show projects
npx nx show project @microservice-eshop/api-gateway
```

Check both the project's package configuration and plugins in `nx.json`. The gateway build is inferred from Webpack configuration, so looking only for an explicit `build` entry in its package file is insufficient.

If Nx reports stale workspace state after configuration changes, stop running Nx processes before using `npx nx reset`, then inspect the project again. This resets local Nx state; it does not fix application code.

## Compiler errors or missing emitted JavaScript

Read the exact task error before editing compiler settings. The auth service uses esbuild; the gateway uses Webpack with TypeScript compilation. Shared settings include `emitDeclarationOnly` and project references, so a raw `tsc` command is not interchangeable with an application build.

See [compiler ownership](development.md) for the relevant configuration chain. Do not disable strictness or change shared emission settings solely to hide an application-specific error.

## Gateway E2E waits, fails, or unexpectedly passes

Its generated setup defaults to port 3000 and its spec checks the auth response at `/`. The gateway uses port 3333 and `/api`. Read [the mismatch details](testing.md) before running it. Its teardown can terminate a process on the test port.

## Debugger port conflicts or unbound breakpoints

The VS Code configurations set inspection ports 9229 and 9230 through `NODE_OPTIONS`. This environment variable can be inherited by Nx and child processes. If logs report an occupied inspector port, stop duplicate debug sessions and inspect which process owns the port before changing the launch settings.

Use the matching app's debug configuration and confirm source-map paths match its distribution directory. Run only that app while diagnosing the debugger. The existing launch configurations were not verified by this documentation work.
