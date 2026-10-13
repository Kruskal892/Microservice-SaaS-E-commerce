# Deployment and CI

[Documentation index](README.md)

## Current scope

Only auth-service Docker packaging is present. There is no gateway Dockerfile, Docker Compose stack, AWS infrastructure, Cloudflare configuration, deployment workflow, or documented production environment.

The following commands describe configured tasks. They were not executed during this documentation update.

## Build outputs

| Application | Build                                           | Output                   |
| ----------- | ----------------------------------------------- | ------------------------ |
| Auth        | `npx nx build @microservice-eshop/auth-service` | `apps/auth-service/dist` |
| Gateway     | `npx nx build @microservice-eshop/api-gateway`  | `apps/api-gateway/dist`  |

Both apps also define `prune-lockfile`, `copy-workspace-modules`, and `prune` targets. The pruning tasks depend on the application build and are intended to prepare runtime dependency metadata and workspace modules.

The gateway's Webpack configuration sets `generatePackageJson: false`. Do not assume its distribution directory is a self-contained deployable package; inspect the output and dependency packaging before designing its deployment.

## Auth Docker image

Source: [Dockerfile](../apps/auth-service/Dockerfile).

```sh
npx nx docker:build @microservice-eshop/auth-service
npx nx docker:run @microservice-eshop/auth-service -p 6001:6001
```

The Docker build target depends on `build` and `prune`. The Dockerfile expects a prepared `dist` directory in its build context.

The container:

1. Uses `docker.io/node:lts-alpine`.
2. Sets `HOST=0.0.0.0` and `PORT=3000`.
3. Copies `dist` into `/app`.
4. Installs production dependencies with `npm --omit=dev -f install`.
5. Starts `node main.js`.

Auth now reads lowercase `port` and ignores `HOST`. On Linux, the Dockerfile's uppercase `PORT=3000` is ignored, so the service defaults to 6001 and binds without an explicit host. Publish `-p 6001:6001` to reach http://localhost:6001/ and match the host-run gateway upstream. Previous mappings `-p 3000:3000` and `-p 6001:3000` target a port on which the current service does not listen. Align the source and Docker environment keys before using custom ports.

Auth imports `cors`, but [its package](../apps/auth-service/package.json) declares only `express`; `cors` is declared at the workspace root. Declare this runtime dependency at the service level and verify pruning/image startup before relying on container packaging.

The image follows a moving LTS tag, while CI selects Node 24. The Dockerfile has no explicit health check or non-root `USER` instruction. Packaging configuration is not proof of production readiness.

## Gateway deployment constraints

The gateway listens on port 8080 by default and proxies to `http://localhost:6001`. In separate containers, `localhost` refers to the gateway container, so this target must be changed to the actual upstream service address before that topology can work. There is no upstream environment variable yet.

CORS is fixed to `http://localhost:3000`. Proxy trust is currently one hop, and rate limiting uses a raw-IP key with process-local counters. Define the trusted proxy topology and correct IPv6 key handling before relying on limits; multiple replicas do not share counters. Auth itself has no rate limiter or authentication middleware.

## GitHub Actions

[ci.yml](../.github/workflows/ci.yml) runs on pushes to `master` and pull requests. It checks out the repository, sets up Node.js 24 with npm caching, installs with `npm ci`, and executes:

```sh
npx nx run-many -t lint test build typecheck
```

The workflow also invokes `npx nx fix-ci` under `if: always()`. Nx Cloud agent startup is commented out. No successful CI run or Cloud connection was verified here.

Neither explicit E2E target is included in the check command. The workflow does not publish images or deploy applications.

## Before introducing production deployment

Decide and document the deployment owner, image/version strategy, environment variables and secrets, network exposure, health checks, logging, rollback, and shutdown behavior. Add database migrations and backup procedures when persistence exists.

AWS and Cloudflare are planned technologies, not configured environments. There are no staging/production URLs or service credentials to provide to a new developer yet.
