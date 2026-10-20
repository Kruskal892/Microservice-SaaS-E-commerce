# Deployment and CI

[Documentation index](../README.md)

## Current scope

Auth has a Dockerfile; gateway deployment, orchestration, AWS resources, and a
production release workflow remain unconfigured. All commands below are explicit
manual steps, not checks already run.

## Build outputs

Auth uses esbuild and emits `apps/auth-service/dist/main.js`. Its assets include
email templates at `dist/templates` and `prisma/schema.prisma` at
`dist/prisma/schema.prisma`. Templates resolve beside the bundle, without a
repository source-directory dependency. Gateway uses Webpack and emits into
`apps/api-gateway/dist`, with generated runtime package metadata enabled.

Both apps declare their imported runtime packages and shared workspace dependency.
Folder aliases are bundled source, not separately installable Node packages.
Pruning/copy-workspace tasks prepare deployment dependencies; inspect generated
manifests and lockfiles before relying on the output.

## Auth Docker image

```sh
npx nx docker:build @microservice-eshop/auth-service
npx nx docker:run @microservice-eshop/auth-service --env-file .env -p 6001:3000
```

The build stage uses Node 24 Alpine, copies prepared dist, runs npm ci --omit=dev,
installs Prisma CLI 6.19 in temporary tooling, and generates Linux-compatible
client/engine files from the copied schema. A placeholder database URL is used
only for generation; it does not contact or deploy the database. The final Node
24 Alpine image copies runtime files, uses the node user, sets PORT=3000, and
starts main.js. The temporary Prisma tooling is not copied into that stage.

Inject real runtime environment variables separately. Keep `.env` out of the
image and source control. If an env file sets PORT, that value must match the
published container port; the supplied example leaves PORT unset.

## Networking and ports

Auth defaults to 6001 and gateway to 8080. Each reads the ordinary PORT variable.
Leave PORT unset when running both locally through npm run dev. Gateway reads
AUTH_SERVICE_URL or defaults to http://localhost:6001. For separate containers,
set it to the reachable auth service hostname and internal port, not localhost.
No AUTH_PORT, GATEWAY_PORT, custom port parser, or shared config package exists.

CORS currently allows http://localhost:3000. Gateway does not trust forwarded
client identities by default. Configure the actual proxy topology before a
production ingress rollout. The IP limiter is in memory: multiple instances do
not share counters. Redis remains the existing simple OTP client, without custom
connection options or gateway rate-counter integration.

## Health and shutdown

Auth GET / is a greeting; gateway GET /gateway-health is local. Neither checks
external dependencies. Each main.ts calls app.listen() directly. There is no
/ready route, shared HTTP lifecycle helper, explicit HTTP receipt timeout policy,
or custom signal/drain handling. Process termination can interrupt active requests.

The gateway's ten-second upstream proxy timeout remains enabled. Readiness,
resource cleanup, and graceful deployment shutdown are future work in the
[HTTP lifecycle plan](../architecture/http-lifecycle-plan.md).

## Prisma and CI

Generate the local client after install/schema changes. MongoDB schema/index
updates use a reviewed db push operation; generation is not database deployment.
Backup/restore, schema rollout, secrets, TLS, logs/alerts, and rollback remain
release requirements.

GitHub Actions installs with npm ci and runs nx run-many -t lint test build
typecheck. Explicit E2E targets are excluded from that command. It does not publish
images or deploy services, and no CI result was checked here.

## Deferred work

See the [Redis/runtime plan](../architecture/redis-and-runtime-plan.md). Add atomic
OTP handling before public concurrent use and shared gateway counters when
replicas require them. No builds, tests, Docker, or live integrations were run.
