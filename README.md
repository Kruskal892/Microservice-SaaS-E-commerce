# Microservice Eshop

A microservice ecommerce project built with an **Nx monorepo** and **TypeScript**. The intended platform combines a Next.js storefront, Express backend services, persistent storage, event messaging, real-time communication, and machine learning.

The repository is currently at the foundation stage: Express applications for an API gateway and authentication service, initial Prisma/MongoDB schema and CLI configuration, registration/OTP helpers, generated API smoke tests, authentication-service Docker packaging, and a GitHub Actions workflow are present. The stack below includes the project direction from the supplied technology overview; planned integrations are not yet implemented.

## Developer documentation

Start with the [documentation index](docs/README.md) for the PRD, feature and UI/UX
specifications, system architecture, database ERD, API specification, technical
design, and implementation plan. Existing onboarding, development, testing,
deployment, troubleshooting, and implementation-status guides are grouped there
as well. Product and database designs are labeled as proposals; they do not imply
implemented ecommerce features.

## Technology stack

| Area                    | Technology          | Status                                                              |
| ----------------------- | ------------------- | ------------------------------------------------------------------- |
| Architecture            | Microservices       | API gateway and authentication service scaffolds exist              |
| Monorepo                | Nx                  | Configured with npm workspaces                                      |
| Language                | TypeScript          | Configured with strict compiler settings                            |
| Backend                 | Node.js, Express    | Auth service with `GET /`; gateway with `GET /gateway-health`       |
| Frontend                | Next.js             | Planned                                                             |
| Primary database        | MongoDB             | Email lookup wired; user creation and live persistence unverified   |
| Secondary data store    | Redis               | Simple ioredis client for OTP strings, expiry, and request counters |
| Database ORM            | Prisma 6.19         | CLI/client dependencies and generation configured                   |
| Message broker          | Apache Kafka        | Planned                                                             |
| Machine learning        | TensorFlow.js       | Planned                                                             |
| WebSocket communication | Socket.IO           | Planned                                                             |
| Web push notifications  | Firebase            | Planned                                                             |
| Testing                 | Jest, Axios         | Auth greeting smoke test; gateway E2E needs alignment               |
| API documentation       | Swagger / OpenAPI   | Auth Swagger UI at /api-docs and JSON at /docs-json                 |
| Cloud assets            | ImageKit            | Planned; inferred from the blue "i" logo in the overview            |
| Containerization        | Docker              | Auth-service Dockerfile and Nx Docker targets configured            |
| CI/CD                   | Git, GitHub Actions | CI workflow present; deployment not configured                      |
| Deployment              | AWS                 | Planned                                                             |
| Domain management       | Cloudflare          | Planned                                                             |

Dependency versions are recorded in [package.json](package.json) and [package-lock.json](package-lock.json). Prisma tooling and a MongoDB schema are included; auth reads users through Prisma; user creation, message brokers, frontend, and cloud integrations are incomplete or planned.

## Architecture

Nx manages application tasks, dependencies, and build tooling from the repository root. Applications live under `apps/`. Explicit targets are defined in each application's `package.json`; plugins in `nx.json` infer additional targets.

The intended architecture uses a Next.js frontend to consume Express service APIs, MongoDB with Prisma for persistence, Redis as a secondary store, and Kafka for event messaging. Socket.IO, Firebase, TensorFlow.js, and cloud services extend that platform as features are implemented. Service boundaries, event contracts, and deployment topology remain to be designed.

### Current applications

| Application        | Nx project name                        | Purpose                                                                               |
| ------------------ | -------------------------------------- | ------------------------------------------------------------------------------------- |
| `api-gateway`      | `@microservice-eshop/api-gateway`      | Express gateway with middleware, local `/gateway-health`, and auth-service forwarding |
| `auth-service`     | `@microservice-eshop/auth-service`     | Registration and OTP delivery; verification and account creation incomplete           |
| `auth-service-e2e` | `@microservice-eshop/auth-service-e2e` | Jest/Axios smoke test against the backend                                             |
| `api-gateway-e2e`  | `@microservice-eshop/api-gateway-e2e`  | Generated smoke test; currently mismatched with the gateway                           |

The gateway handles `GET /gateway-health` locally, then forwards other paths to `AUTH_SERVICE_URL` (default `http://localhost:6001`). Auth registration reads MongoDB and uses Redis/SMTP; these integrations have not been verified end to end.

| Application  | Default URL                            | Response                                   |
| ------------ | -------------------------------------- | ------------------------------------------ |
| Auth service | `http://localhost:6001/`               | `{ "message": "Hello API" }`               |
| API gateway  | `http://localhost:8080/gateway-health` | `{ "message": "Welcome to api-gateway!" }` |

The gateway applies CORS, logging, and in-memory IP limiting before its proxy reads request bodies, with a 16 KB limit and ten-second upstream timeout. It uses default IP normalization and does not enable proxy trust. Static asset serving has been removed. See the [API reference](docs/api/api-specification.md) for middleware behavior and limitations.

Shared error classes and a JSON response handler exist under
`packages/error-handler`. Auth imports `@packages/error-handler` and
registers its four-parameter middleware after routes; the gateway also uses it.
Folder imports use a shared TypeScript alias, and auth bundles the shared source.
See [error-handler design](docs/architecture/technical-design.md#shared-error-handler-current-source)
and [response formats](docs/api/api-specification.md#shared-error-handler-auth-service).

## Repository structure

```text
.
|-- apps/
|   |-- api-gateway/
|   |   |-- src/main.ts          # Gateway entry point
|   |   |-- src/assets/          # Asset directory copied during builds
|   |   |-- package.json         # Dependencies and Nx targets
|   |   `-- webpack.config.js   # Node application build configuration
|   |-- api-gateway-e2e/         # Generated gateway test and setup
|   |-- auth-service/
|   |   |-- src/main.ts          # Express entry point
|   |   |-- src/assets/          # Assets copied during builds
|   |   |-- Dockerfile           # Container for the compiled service
|   |   |-- package.json         # Dependencies and Nx targets
|   |   `-- jest.config.cts      # Service test configuration
|   `-- auth-service-e2e/
|       |-- src/auth-service/    # HTTP smoke test
|       |-- src/support/         # Test setup, readiness, and teardown
|       |-- package.json         # E2E target and service dependencies
|       `-- jest.config.cts
|-- .github/workflows/ci.yml     # GitHub Actions checks
|-- packages/                   # One workspace package for shared modules
|   |-- package.json            # Nx/npm grouping; no per-folder manifests
|   |-- tsconfig.json           # References the shared library config
|   |-- tsconfig.lib.json       # Includes all TypeScript modules
|   |-- index.ts                # Optional aggregate exports
|   `-- error-handler/          # Error classes and response handler
|-- prisma/schema.prisma        # Initial users/images MongoDB schema
|-- prisma.config.ts            # Prisma CLI config and explicit .env loading
|-- nx.json                     # Nx plugins and target defaults
|-- package.json                # Root dependencies and workspaces
|-- package-lock.json           # Locked dependency tree
|-- tsconfig.base.json          # Shared TypeScript compiler settings
`-- jest.config.ts              # Workspace Jest project discovery
```

## Getting started

### Prerequisites

- **Node.js 24**, matching the version configured in CI.
- **npm**, used by the workspace and committed lockfile.
- **Git** to clone the repository.
- **Docker** only for container development.

Auth registration requires MongoDB, Redis, and SMTP configuration. Copy `.env.example` to a local `.env` and replace placeholders. Kafka and cloud services remain planned.

### Install and run

From the repository root, install dependencies:

```sh
npm ci
```

Start both applications:

```sh
npm run dev
```

This script runs the `serve` targets across the workspace. Use the default ports below when starting both apps; a shared `PORT` override would make them compete for the same port.

To start only the auth service:

```sh
npx nx serve @microservice-eshop/auth-service
```

The development target builds the service before starting it. Open `http://localhost:6001` or send a `GET /` request. The current endpoint returns HTTP 200 with:

```json
{ "message": "Hello API" }
```

To start only the gateway:

```sh
npx nx serve @microservice-eshop/api-gateway
```

Open `http://localhost:8080/gateway-health` for the gateway response. With auth running, `http://localhost:8080/` forwards to auth and returns `{ "message": "Hello API" }`. Stop a development process with **Ctrl+C**.

### Environment configuration

| Variable | Application  | Local default | Purpose                                |
| -------- | ------------ | ------------- | -------------------------------------- |
| `PORT`   | Auth service | `6001`        | Converted to a number before listening |
| `PORT`   | API gateway  | `8080`        | HTTP port                              |

Both applications keep the ordinary PORT variable and defaults above. Leave it
unset when launching both together. Gateway reads AUTH_SERVICE_URL or defaults
to http://localhost:6001; update it if auth runs elsewhere. Dotenv loads at startup.
No custom port parser, AUTH_PORT, GATEWAY_PORT, or shared config package is used.
The placeholder-only [.env.example](.env.example) lists current integration inputs.

For example, in PowerShell:

```powershell
$env:PORT = '3001'
npx nx serve @microservice-eshop/auth-service
```

After this example, remove the overrides before starting both applications in the same terminal:

```powershell
Remove-Item Env:PORT -ErrorAction SilentlyContinue
npm run dev
```

### Prisma and MongoDB setup

Prisma CLI reads `DATABASE_URL` from the root `.env` through `prisma.config.ts`.
The schema defines `users` and `images`. The `prisma-client-js` generator matches
the shared wrapper's `@prisma/client` import. Run `npx prisma generate` after
installing dependencies or changing the schema, before starting auth.
See [authentication development](docs/development/authentication.md) for the
current registration flow, dependencies, and unfinished verification. Registration is routed.
For placeholder-only setup, generation, and database synchronization instructions,
see [database setup](docs/development/getting-started.md#prisma-and-mongodb).
The reported `db push` attempt failed Atlas authentication; successful synchronization
has not been confirmed. `.env` and generated clients are Git-ignored.

## Development commands

Shared modules use `@packages/<folder>` imports. For example,
`@packages/error-handler` resolves to `packages/error-handler/index.ts`.
The wildcard also supports individual files, such as `@packages/error-handler/error-middleware`.
Folder imports use the folder's `index.ts`; no per-folder package or TypeScript
configs are required. Auth references
the shared library from `tsconfig.app.json` and bundles this source. Other apps and test runners need
their own project-reference and alias-resolution setup. See
[adding shared modules](docs/development/development-guide.md#adding-shared-modules).

Run these from the repository root. The root `dev` script starts all serve targets; use Nx directly to select an application or task.

| Task                     | Command                                                |
| ------------------------ | ------------------------------------------------------ |
| Start both applications  | `npm run dev`                                          |
| List projects            | `npx nx show projects`                                 |
| Inspect service targets  | `npx nx show project @microservice-eshop/auth-service` |
| View dependency graph    | `npx nx graph`                                         |
| Start development server | `npx nx serve @microservice-eshop/auth-service`        |
| Start gateway            | `npx nx serve @microservice-eshop/api-gateway`         |
| Build service            | `npx nx build @microservice-eshop/auth-service`        |
| Build gateway            | `npx nx build @microservice-eshop/api-gateway`         |
| Run service unit tests   | `npx nx test @microservice-eshop/auth-service`         |
| Run API smoke test       | `npx nx e2e @microservice-eshop/auth-service-e2e`      |
| Check service types      | `npx nx typecheck @microservice-eshop/auth-service`    |
| Lint service             | `npx nx lint @microservice-eshop/auth-service`         |

The auth-service build defaults to production, uses esbuild, and writes to `apps/auth-service/dist`. The gateway uses Webpack and writes to `apps/api-gateway/dist`. Auth has generated greeting smoke coverage; validation and failure-path tests remain future work. No tests were run for this change.

The auth-service E2E target depends on the backend build and serve targets. It waits for the configured port and checks that `GET /` returns HTTP 200 and the expected JSON. Teardown kills the process on that port, so use a free port dedicated to the test run. Auth test setup, Axios, and teardown now default to port `6001`. The test does not cover authentication or ecommerce behavior.

The gateway's generated E2E target is `npx nx e2e @microservice-eshop/api-gateway-e2e`, but its setup still defaults to port `3000` and its assertion expects `GET /` with `Hello API`. The gateway defaults to port `8080`; its root forwards to auth while `/gateway-health` returns the gateway's own message. Align the test with the intended gateway contract before relying on it; an unrelated port-3000 listener could otherwise satisfy the wrong check.

## Docker

Docker packaging is currently provided only for the auth service. Build its image:

```sh
npx nx docker:build @microservice-eshop/auth-service
```

The target depends on build and pruning tasks that prepare the distribution directory and runtime dependencies.

Run the container with the HTTP port published:

```sh
npx nx docker:run @microservice-eshop/auth-service -p 6001:3000
```

The Dockerfile uses Node 24 Alpine, installs locked runtime dependencies,
generates platform-compatible Prisma runtime files, and runs as the node user.
Templates and the schema are copied through auth build assets. Supply environment
variables separately; the example leaves PORT unset so Docker's internal 3000
matches `-p 6001:3000`. See [deployment](docs/delivery/deployment.md) for the full
command and constraints. The image and build output remain unverified.

## Continuous integration

The [GitHub Actions workflow](.github/workflows/ci.yml) is configured for pushes to `master` and pull requests. It uses Node.js 24, installs dependencies with `npm ci`, and runs:

```sh
npx nx run-many -t lint test build typecheck
```

The dedicated `e2e` target is not included in this command. Nx Cloud task distribution is commented out. The presence of a workflow does not establish that checks have passed; production deployment is not configured.

## Project direction

Next steps are to implement authentication, establish database models and persistence, add the Next.js storefront, and define service boundaries for ecommerce features. Messaging, real-time updates, push notifications, machine learning, and production deployment can then be integrated as those features require them.

When extending the workspace, keep service code and configuration with its application, define cross-service API and event contracts explicitly, and update this README as integrations become available. Keep credentials out of committed files and document required environment variables when adding external services.

## Current reliability limits and plans

OTP checks/counters retain simple sequential Redis GET/SET operations and string
values. Concurrent requests can race, and SMTP acceptance can precede a failed
Redis write. Gateway counters are per-process. Advanced Redis/port configuration
was deferred at the user's request; no custom Redis store or shared config
package is introduced.

Each app starts Express directly with app.listen(). Dependency readiness,
custom HTTP timeouts, and graceful shutdown are deferred in the
[HTTP lifecycle plan](docs/architecture/http-lifecycle-plan.md). No /ready route
is implemented. The unrouted userVerification controller still references
undefined verifyOtp(); account activation remains unfinished.

- [Auth-service folder structure plan](docs/architecture/auth-service-structure-plan.md)
- [Redis and runtime plan](docs/architecture/redis-and-runtime-plan.md)
- [Current implementation status](docs/delivery/implementation-status.md)
