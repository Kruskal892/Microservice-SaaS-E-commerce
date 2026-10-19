# Deployment and CI

[Documentation index](../README.md)

## Current scope

Only auth-service Docker packaging is present. There is no gateway Dockerfile, Docker Compose stack, AWS infrastructure, Cloudflare configuration, deployment workflow, or documented production environment.

The following commands describe configured tasks. They were not executed during this documentation update.

## Build outputs

| Application | Build                                           | Output                   |
| ----------- | ----------------------------------------------- | ------------------------ |
| Auth        | `npx nx build @microservice-eshop/auth-service` | `apps/auth-service/dist` |
| Gateway     | `npx nx build @microservice-eshop/api-gateway`  | `apps/api-gateway/dist`  |

Both apps also define `prune-lockfile`, `copy-workspace-modules`, and `prune` targets. The pruning tasks depend on the application build and are intended to prepare runtime dependency metadata and workspace modules.

Auth sets `bundle: true` and emits CommonJS containing application and aliased
shared source; third-party dependencies remain external. The
`@microservice-eshop/<folder>` names are source aliases, not separately installed
runtime packages. One workspace library under `packages/` emits its own
JavaScript/declarations into `packages/dist`, and auth's serve target runs build
dependencies. These settings were inspected, not validated through a build or
container run. Verify generated dependency metadata and copied workspace modules
before relying on the pruning targets.

The gateway's Webpack configuration sets `generatePackageJson: false`. Do not assume its distribution directory is a self-contained deployable package; inspect the output and dependency packaging before designing its deployment.

## Auth Docker image

Source: [Dockerfile](../../apps/auth-service/Dockerfile).

```sh
npx nx docker:build @microservice-eshop/auth-service
npx nx docker:run @microservice-eshop/auth-service -p 6001:3000
```

The Docker build target depends on `build` and `prune`. The Dockerfile expects a prepared `dist` directory in its build context.

The container:

1. Uses `docker.io/node:lts-alpine`.
2. Sets `HOST=0.0.0.0` and `PORT=3000`.
3. Copies `dist` into `/app`.
4. Installs production dependencies with `npm --omit=dev -f install`.
5. Starts `node main.js`.

Auth reads uppercase `PORT`, so the Dockerfile configures port 3000 inside the container. Auth ignores `HOST` and listens without an explicit bind address. Publish `-p 6001:3000` to reach http://localhost:6001/ and match the host-run gateway upstream, or `-p 3000:3000` for standalone use.

Auth imports `cors`, but [its package](../../apps/auth-service/package.json)
declares Express and the shared workspace dependency without declaring `cors`;
`cors` is declared at the workspace root. Declare this runtime dependency at the
service level and verify pruning/image startup before relying on container packaging.

The image follows a moving LTS tag, while CI selects Node 24. The Dockerfile has no explicit health check or non-root `USER` instruction. Packaging configuration is not proof of production readiness.

## Gateway deployment constraints

The gateway listens on port 8080 by default and proxies to `http://localhost:6001`. In separate containers, `localhost` refers to the gateway container, so this target must be changed to the actual upstream service address before that topology can work. There is no upstream environment variable yet.

CORS is fixed to `http://localhost:3000`. Proxy trust is currently one hop, and rate limiting uses a raw-IP key with process-local counters. Define the trusted proxy topology and correct IPv6 key handling before relying on limits; multiple replicas do not share counters. Auth itself has no rate limiter or authentication middleware.

## GitHub Actions

[ci.yml](../../.github/workflows/ci.yml) runs on pushes to `master` and pull requests. It checks out the repository, sets up Node.js 24 with npm caching, installs with `npm ci`, and executes:

```sh
npx nx run-many -t lint test build typecheck
```

The workflow also invokes `npx nx fix-ci` under `if: always()`. Nx Cloud agent startup is commented out. No successful CI run or Cloud connection was verified here.

Neither explicit E2E target is included in the check command. The workflow does not publish images or deploy applications.

## Prisma deployment boundary

Prisma 6.19 and the MongoDB users/images schema are configured at the workspace
root. The `prisma-client-js` generator produces the client used by auth's shared
wrapper through `@prisma/client`. Docker/CI do not explicitly generate or deploy
this schema. Generate the client in the target environment before building and
package its runtime/engine dependencies; local generation does not establish
that current images contain a usable client. Deployment also needs secret injection;
keep the local `.env` out of images and source control. MongoDB schema/index
synchronization uses an explicitly reviewed `db push` workflow rather than Prisma
Migrate. No successful database deployment, backup/restore, or data migration is
confirmed. See [database setup](../development/getting-started.md#prisma-and-mongodb).

## Before introducing production deployment

Decide and document the deployment owner, image/version strategy, environment variables and secrets, network exposure, health checks, logging, rollback, and shutdown behavior. Add database migrations and backup procedures when persistence exists.

AWS and Cloudflare are planned technologies, not configured environments. There are no staging/production URLs or service credentials to provide to a new developer yet.
