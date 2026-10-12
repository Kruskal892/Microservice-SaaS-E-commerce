# Development guide

[Documentation index](README.md)

## Nx task configuration

Use the scoped package names as project identifiers. Explicit targets live under `nx.targets` in application package files. Plugins in [nx.json](../nx.json) infer additional targets from configuration files.

```sh
npx nx show projects
npx nx show project @microservice-eshop/auth-service
npx nx show project @microservice-eshop/api-gateway
npx nx graph
```

These inspection commands help resolve which executor and options a task uses. A target need not appear explicitly in the package file to exist.

| Plugin | Role configured in this workspace |
| --- | --- |
| `@nx/js/typescript` | Type checking and TypeScript build-related tasks |
| `@nx/eslint/plugin` | Lint targets |
| `@nx/jest/plugin` | Test targets; both E2E directories are excluded from inference |
| `@nx/docker` | Docker build/run targets |
| `@nx/webpack/plugin` | Gateway build and related targets |

Both E2E projects define their own `e2e` executor and dependencies. Nx's default comparison base is `master`.

## Common tasks

| Goal | Command |
| --- | --- |
| Serve all applications | `npm run dev` |
| Serve auth | `npx nx serve @microservice-eshop/auth-service` |
| Serve gateway | `npx nx serve @microservice-eshop/api-gateway` |
| Build auth | `npx nx build @microservice-eshop/auth-service` |
| Build gateway | `npx nx build @microservice-eshop/api-gateway` |
| Check auth types | `npx nx typecheck @microservice-eshop/auth-service` |
| Check gateway types | `npx nx typecheck @microservice-eshop/api-gateway` |
| Lint auth | `npx nx lint @microservice-eshop/auth-service` |
| Lint gateway | `npx nx lint @microservice-eshop/api-gateway` |

Builds, lint, and tests are explicit developer actions. For automated assistants working under the supplied project instructions, run them only when the user requests them.

## Build and compiler ownership

The auth service uses `@nx/esbuild:esbuild`, emits CommonJS, does not bundle dependencies, and writes to `apps/auth-service/dist`. Production is the default build configuration; its serve target selects the development build configuration by default.

The gateway uses the Nx Webpack plugin, with `compiler: 'tsc'`, a Node target, asset copying, and output in `apps/api-gateway/dist`.

TypeScript configuration is split across:

- Root `tsconfig.base.json`: strictness, ES2022 target, NodeNext modules/resolution, composite projects, and declaration settings.
- Root `tsconfig.json`: project references.
- Each application's `tsconfig.json`: project references for that application.
- Each application's `tsconfig.app.json`: source inclusion, root/output paths, and ambient types.
- Auth `tsconfig.spec.json`: test compilation settings.

The shared base enables `emitDeclarationOnly`. Do not assume a standalone `tsc` invocation replaces the configured Nx runtime build. Trace the application's executor and effective compiler settings when diagnosing missing JavaScript.

## Debugging

[.vscode/launch.json](../.vscode/launch.json) contains separate Nx launch configurations for the auth service and gateway. They set `NODE_OPTIONS` inspection ports to 9229 and 9230 respectively and use source maps.

Open **Run and Debug**, select the application configuration, and set a breakpoint in its entry point. Send an HTTP request to trigger a route breakpoint. These launch configurations have not been runtime-verified in this documentation update; see [debugger troubleshooting](troubleshooting.md) if inspection ports conflict.

## Making a change

1. Identify the owning app and search for consumers before changing shared root configuration.
2. Keep app-specific behavior in that app. Introduce shared code only when there is a concrete shared consumer.
3. Update the route contract and related tests when behavior changes.
4. Record newly required environment variables and external services.
5. Update the relevant guide and implementation status.
6. Report exactly which checks ran and which did not.

Use the formatting already configured: UTF-8, two-space indentation, final newlines, and single quotes through Prettier. ESLint extends Nx's flat configs and enforces module-boundary rules.

Do not commit generated `dist`, `node_modules`, coverage, or local Nx cache files. Preserve permanent tests; remove temporary debugging artifacts once their verification is complete. Never include credentials in examples or commits.
