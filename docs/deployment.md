# Deployment and CI

[Documentation index](README.md)

## Current scope

Only auth-service Docker packaging is present. There is no gateway Dockerfile, Docker Compose stack, AWS infrastructure, Cloudflare configuration, deployment workflow, or documented production environment.

The following commands describe configured tasks. They were not executed during this documentation update.

## Build outputs

| Application | Build | Output |
| --- | --- | --- |
| Auth | `npx nx build @microservice-eshop/auth-service` | `apps/auth-service/dist` |
| Gateway | `npx nx build @microservice-eshop/api-gateway` | `apps/api-gateway/dist` |

Both apps also define `prune-lockfile`, `copy-workspace-modules`, and `prune` targets. The pruning tasks depend on the application build and are intended to prepare runtime dependency metadata and workspace modules.

The gateway's Webpack configuration sets `generatePackageJson: false`. Do not assume its distribution directory is a self-contained deployable package; inspect the output and dependency packaging before designing its deployment.

## Auth Docker image

Source: [Dockerfile](../apps/auth-service/Dockerfile).

```sh
npx nx docker:build @microservice-eshop/auth-service
npx nx docker:run @microservice-eshop/auth-service -p 3000:3000
```

The Docker build target depends on `build` and `prune`. The Dockerfile expects a prepared `dist` directory in its build context.

The container:

1. Uses `docker.io/node:lts-alpine`.
2. Sets `HOST=0.0.0.0` and `PORT=3000`.
3. Copies `dist` into `/app`.
4. Installs production dependencies with `npm --omit=dev -f install`.
5. Starts `node main.js`.

Once running and published, the auth endpoint is http://localhost:3000/. It is a scaffold endpoint, not a database-aware readiness probe.

The image follows a moving LTS tag, while CI selects Node 24. The Dockerfile has no explicit health check or non-root `USER` instruction. Packaging configuration is not proof of production readiness.

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
