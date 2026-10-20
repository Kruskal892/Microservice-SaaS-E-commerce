# Development guide

[Documentation index](../README.md)

## Nx task configuration

Use the scoped package names as project identifiers. Explicit targets live under `nx.targets` in application package files. Plugins in [nx.json](../../nx.json) infer additional targets from configuration files.

```sh
npx nx show projects
npx nx show project @microservice-eshop/auth-service
npx nx show project @microservice-eshop/api-gateway
npx nx graph
```

These inspection commands help resolve which executor and options a task uses. A target need not appear explicitly in the package file to exist.

| Plugin               | Role configured in this workspace                              |
| -------------------- | -------------------------------------------------------------- |
| `@nx/js/typescript`  | Type checking and TypeScript build-related tasks               |
| `@nx/eslint/plugin`  | Lint targets                                                   |
| `@nx/jest/plugin`    | Test targets; both E2E directories are excluded from inference |
| `@nx/docker`         | Docker build/run targets                                       |
| `@nx/webpack/plugin` | Gateway build and related targets                              |

Both E2E projects define their own `e2e` executor and dependencies. Nx's default comparison base is `master`.

## Common tasks

| Goal                   | Command                                             |
| ---------------------- | --------------------------------------------------- |
| Serve all applications | `npm run dev`                                       |
| Serve auth             | `npx nx serve @microservice-eshop/auth-service`     |
| Serve gateway          | `npx nx serve @microservice-eshop/api-gateway`      |
| Build auth             | `npx nx build @microservice-eshop/auth-service`     |
| Build gateway          | `npx nx build @microservice-eshop/api-gateway`      |
| Check auth types       | `npx nx typecheck @microservice-eshop/auth-service` |
| Check gateway types    | `npx nx typecheck @microservice-eshop/api-gateway`  |
| Lint auth              | `npx nx lint @microservice-eshop/auth-service`      |
| Lint gateway           | `npx nx lint @microservice-eshop/api-gateway`       |

Builds, lint, and tests are explicit developer actions. For automated assistants working under the supplied project instructions, run them only when the user requests them.

## Build and compiler ownership

The auth service uses `@nx/esbuild:esbuild`, bundles application and shared source
into CommonJS, leaves third-party dependencies external, and writes to
`apps/auth-service/dist`. Production is the default build configuration; its
serve target selects the development build configuration by default.

Auth's esbuild target sets `declaration: false`; its application TypeScript
config disables `declarationMap` and `emitDeclarationOnly`. The executable
service does not need declaration output from esbuild. This keeps the executor
in no-emit typecheck mode rather than checking bundled shared source as part of
auth's composite declaration project. Shared-library declaration output remains
enabled, and the separate Nx typecheck target still uses project references.

The gateway uses the Nx Webpack plugin, with `compiler: 'tsc'`, a Node target, asset copying, and output in `apps/api-gateway/dist`.

TypeScript configuration is split across:

- Root `tsconfig.base.json`: strictness, ES2022 target, NodeNext modules/resolution, composite projects, and declaration settings.
- Root `tsconfig.json`: project references.
- Each application's `tsconfig.json`: project references for that application.
- Each application's `tsconfig.app.json`: source inclusion, root/output paths, and ambient types.
- Auth `tsconfig.spec.json`: test compilation settings.
- [Shared-package tsconfig.json](../../packages/tsconfig.json):
  references `tsconfig.lib.json`, which loads Node types and emits JavaScript
  and declarations into the package's `dist`. Root and auth project references
  include this library through the root grouping and auth application config, respectively.

The root npm workspace list includes `apps/*` and `packages` itself. The shared
TypeScript config maps `@packages/*` to `./packages/*`.
Import errors and middleware from `@packages/error-handler`; relative
imports between projects violate Nx module boundaries. Auth keeps `rootDir`
scoped to its own `src` and bundles aliased shared source with esbuild. The
workspace package remains the grouping for Nx/project references, not the
folder import name. Nx infers its build from `tsconfig.lib.json`, and auth's
serve target runs build dependencies. Folder aliases are not Node packages:
any other application or test runner using them must also resolve the alias
in its build/runtime configuration.

### Adding shared modules

Gateway Webpack maps `@packages` to the workspace `packages/` directory in
`apps/api-gateway/webpack.config.js`. TypeScript `paths` alone do not configure
Webpack resolution. Keep this directory alias when importing shared folders.

Add folders directly inside `packages/` with an `index.ts` exporting their
public APIs. Import them as `@packages/<folder-name>`; the wildcard
also supports individual files and nested folders, such as
`@packages/error-handler/error-middleware` and `@packages/libs/prisma`,
without per-folder updates. The library includes `**/*.ts` and excludes `dist`
and `node_modules`, so new module folders need no package manifest or TypeScript
configuration. Another application needs the shared TypeScript project
references and a build/runtime that resolves aliases.

The manifest name `@microservice-eshop/shared` groups these files as one Nx/npm
project; it is not the required application import name. `packages/index.ts`
is an optional aggregate barrel. Folder imports read the folder's own `index.ts`,
so adding a folder does not require editing the aggregate barrel or wildcard.
An empty folder is not importable: `packages/middleware/index.ts` must exist
and export real middleware before using `@packages/middleware`.

Auth's solution `tsconfig.json` references its app/spec configs; the shared-library
reference remains in `tsconfig.app.json`. Auth also has `bundle: true` in its esbuild target. Gateway now references the shared library and bundles shared HTTP/error modules.
Auth Jest/SWC maps @packages/\* to shared source; see
[testing](testing.md#shared-module-and-error-handler-coverage).

```text
packages/
|-- package.json
|-- tsconfig.json
|-- tsconfig.lib.json
|-- index.ts                 # Optional aggregate exports
`-- error-handler/
    |-- index.ts             # Public API for @packages/error-handler
    `-- error-middleware.ts
```

```ts
import { errorMiddleware, NotFoundError } from '@packages/error-handler';
```

The shared base enables `emitDeclarationOnly`. Do not assume a standalone `tsc` invocation replaces the configured Nx runtime build. Trace the application's executor and effective compiler settings when diagnosing missing JavaScript.

## Gateway configuration ownership

Gateway middleware stays in apps/api-gateway/src/main.ts. It uses the default
in-memory limiter, default IPv6-aware IP keys, and no proxy trust. Limiting occurs
before the proxy reads bodies, with a 16 KB limit and ten-second upstream timeout.
Gateway does not import Redis. Each main.ts calls app.listen() directly; packages/error-handler owns error
responses. Readiness and shutdown are deferred in the
[HTTP lifecycle plan](../architecture/http-lifecycle-plan.md).

Both apps use PORT (auth 6001, gateway 8080) and ignore HOST. Leave PORT unset for
simultaneous local startup. Gateway reads AUTH_SERVICE_URL with a localhost:6001
fallback. There is no config package or custom port parser. Auth E2E still reads
HOST/PORT separately; keep test destinations aligned with service overrides.

See the [auth folder plan](../architecture/auth-service-structure-plan.md) for
future feature ownership and the [Redis/runtime plan](../architecture/redis-and-runtime-plan.md)
for deliberately deferred infrastructure. Neither plan creates empty modules or
per-folder package manifests.

## Debugging

[.vscode/launch.json](../../.vscode/launch.json) contains separate Nx launch configurations for the auth service and gateway. They attach to child processes and use source maps. Each service's `serve` target owns its inspector port: 9229 for auth and 9230 for the gateway. No inherited `NODE_OPTIONS` inspection flag is needed.

Open **Run and Debug**, select the application configuration, and set a breakpoint in its entry point. Send an HTTP request to trigger a route breakpoint. These launch configurations have not been runtime-verified in this documentation update; see [debugger troubleshooting](troubleshooting.md) if inspection ports conflict.

## Making a change

### Commit messages

Use the repository's [commit-message template](../../.gitmessage) for a concise,
reviewable record of why a change exists, what it does, and how it was verified.
The format is `<type>(<scope>): <summary>`, with icon-labeled body sections for
motivation, changes, validation, impact, rollout/rollback, and reviewer context,
plus optional real issue references. Scopes name
the owning application or system. Keep small commits brief; use impact and
migration details when behavior, contracts, data, or configuration change.

Enable it once per clone, from the repository root:

```sh
git config --local commit.template .gitmessage
```

Then stage the intended files and run `git commit` without `-m` or `-F`.
Git opens the template in your configured editor. The template is entirely
commented: replace or uncomment the useful lines and remove guidance. Leaving
it untouched produces no commit message under Git's normal comment cleanup.
Keep icons in the body, preserve conventional subject/footer syntax, and remove
unused sections, outcomes, placeholder text, and decorative dividers before saving.

Local Git configuration is not shared by cloning the repository, so developers must run the
setup command themselves. The template is guidance, not a validation hook;
`git commit -m`, merge/rebase-generated messages, and GUI commit inputs may
bypass it.

Example for a documentation-only change:

```text
docs(workspace): add developer onboarding guides

🎯 Motivation
New developers need a source-backed guide to the workspace and its limits.

✨ Changes
- Document setup, application ownership, API routes, and Nx tasks.
- Separate implemented scaffolding from planned integrations.

🧪 Validation
- ⏭️ Not run: builds, lint, tests, and runtime checks (documentation only).
```

Adapt validation to the actual commit. Include a `BREAKING CHANGE:` footer with
migration instructions for incompatible changes and a `Refs:` footer only when
a real reference exists. No ticket is required when none applies.

### Change checklist

1. Identify the owning app and search for consumers before changing shared root configuration.
2. Keep app-specific behavior in that app. Introduce shared code only when there is a concrete shared consumer.
3. Update the route contract and related tests when behavior changes.
4. Record newly required environment variables and external services.
5. Update the relevant guide and implementation status.
6. Report exactly which checks ran and which did not.

### Prisma tooling

VS Code sets `prisma.pinToPrisma6: true` to match the Prisma 6.19 dependency line.
Edit `prisma/schema.prisma` and use the explicit commands in
[database setup](getting-started.md#prisma-and-mongodb). Prisma configuration is
root-level CLI configuration, not service database wiring. Generated client output
and `.env` are ignored by Git. After schema changes, future application consumers
must regenerate the client; generation and database synchronization are separate steps.

### Formatting

[.prettierrc](../../.prettierrc) defines an 80-column print width, two-space
indentation, spaces instead of tabs, semicolons, single quotes, trailing commas
where supported, bracket spacing, parentheses around arrow parameters, and LF
line endings. Print width is a formatting guideline, not a hard line-length
limit. JSON retains double quotes as required by its syntax.

[.editorconfig](../../.editorconfig) aligns editors on UTF-8, two-space indentation,
LF line endings, and final newlines. [.prettierignore](../../.prettierignore) excludes
dependencies, the npm lockfile, Nx state, and generated build/test output at any
application depth.

From the repository root:

```sh
npm run format:check
npm run format
```

The first command checks formatting without editing files; the second rewrites
all supported, non-ignored files. For a focused change, format only the files
you edited, for example:

```sh
npx prettier --write apps/api-gateway/src/main.ts
```

Formatting is separate from linting. ESLint extends Nx's flat configs and
enforces module boundaries and no blank lines between consecutive imports.
The workspace's TypeScript save settings run Prettier and ESLint fixes; Prettier
alone preserves existing blank lines between imports. Formatting checks are not
currently part of CI.

Do not commit generated `dist`, `node_modules`, coverage, or local Nx cache files. Preserve permanent tests; remove temporary debugging artifacts once their verification is complete. Never include credentials in examples or commits.
