# Microservice Eshop

A microservice ecommerce project built with an **Nx monorepo** and **TypeScript**. The intended platform combines a Next.js storefront, Express backend services, persistent storage, event messaging, real-time communication, and machine learning.

The repository is currently at the foundation stage: Express scaffolds for an API gateway and authentication service, generated API smoke tests, authentication-service Docker packaging, and a GitHub Actions workflow are present. The stack below includes the project direction from the supplied technology overview; planned integrations are not yet implemented.

## Developer documentation

Start with the [developer documentation](docs/README.md) for onboarding, architecture, API behavior, Nx development, testing, deployment, troubleshooting, and implementation status.

## Technology stack

| Area                    | Technology          | Status                                                                       |
| ----------------------- | ------------------- | ---------------------------------------------------------------------------- |
| Architecture            | Microservices       | API gateway and authentication service scaffolds exist                       |
| Monorepo                | Nx                  | Configured with npm workspaces                                               |
| Language                | TypeScript          | Configured with strict compiler settings                                     |
| Backend                 | Node.js, Express    | Auth service with `GET /`; gateway with `GET /gateway-health`                |
| Frontend                | Next.js             | Planned                                                                      |
| Primary database        | MongoDB             | Planned                                                                      |
| Secondary data store    | Redis               | Planned                                                                      |
| Database ORM            | Prisma              | Planned                                                                      |
| Message broker          | Apache Kafka        | Planned                                                                      |
| Machine learning        | TensorFlow.js       | Planned                                                                      |
| WebSocket communication | Socket.IO           | Planned                                                                      |
| Web push notifications  | Firebase            | Planned                                                                      |
| Testing                 | Jest, Axios         | Auth smoke test configured; gateway test needs alignment                     |
| API documentation       | Swagger / OpenAPI   | Swagger UI dependency installed; no specification or documentation route yet |
| Cloud assets            | ImageKit            | Planned; inferred from the blue "i" logo in the overview                     |
| Containerization        | Docker              | Auth-service Dockerfile and Nx Docker targets configured                     |
| CI/CD                   | Git, GitHub Actions | CI workflow present; deployment not configured                               |
| Deployment              | AWS                 | Planned                                                                      |
| Domain management       | Cloudflare          | Planned                                                                      |

Dependency versions are recorded in [package.json](package.json) and [package-lock.json](package-lock.json). No database, message broker, frontend, or cloud integration is currently included.

## Architecture

Nx manages application tasks, dependencies, and build tooling from the repository root. Applications live under `apps/`. Explicit targets are defined in each application's `package.json`; plugins in `nx.json` infer additional targets.

The intended architecture uses a Next.js frontend to consume Express service APIs, MongoDB with Prisma for persistence, Redis as a secondary store, and Kafka for event messaging. Socket.IO, Firebase, TensorFlow.js, and cloud services extend that platform as features are implemented. Service boundaries, event contracts, and deployment topology remain to be designed.

### Current applications

| Application        | Nx project name                        | Purpose                                                                               |
| ------------------ | -------------------------------------- | ------------------------------------------------------------------------------------- |
| `api-gateway`      | `@microservice-eshop/api-gateway`      | Express gateway with middleware, local `/gateway-health`, and auth-service forwarding |
| `auth-service`     | `@microservice-eshop/auth-service`     | Express scaffold; authentication endpoints are not implemented yet                    |
| `auth-service-e2e` | `@microservice-eshop/auth-service-e2e` | Jest/Axios smoke test against the backend                                             |
| `api-gateway-e2e`  | `@microservice-eshop/api-gateway-e2e`  | Generated smoke test; currently mismatched with the gateway                           |

The gateway handles `GET /gateway-health` locally and forwards other requests to the hard-coded upstream `http://localhost:6001`. Clients can also call the auth service directly. No database or message broker participates in these requests.

| Application  | Default URL                            | Response                                   |
| ------------ | -------------------------------------- | ------------------------------------------ |
| Auth service | `http://localhost:6001/`               | `{ "message": "Hello API" }`               |
| API gateway  | `http://localhost:8080/gateway-health` | `{ "message": "Welcome to api-gateway!" }` |

The gateway applies CORS, request logging, body parsing, cookie parsing, and IP rate limiting before route handling. Static asset serving has been removed. See the [API reference](docs/api.md) for middleware behavior and limitations.

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

MongoDB, Redis, Kafka, and cloud credentials are not required to run the current scaffold.

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

Both applications read uppercase `PORT`. Neither reads `HOST`, and both listen without an explicit bind address. The gateway upstream is fixed at `http://localhost:6001`, so overriding the auth port does not update gateway forwarding. No explicit `.env` loader or `.env.example` is configured in the application source.

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

## Development commands

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

The auth-service build defaults to production, uses esbuild, and writes to `apps/auth-service/dist`. The gateway uses Webpack and writes to `apps/api-gateway/dist`. Auth-service unit test configuration exists, but no service unit test files are present yet.

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

The Dockerfile sets `HOST=0.0.0.0` and `PORT=3000`. Auth reads `PORT` and listens on 3000 inside the container, without an explicit bind address. Publish `-p 6001:3000` to match the gateway upstream, or `-p 3000:3000` for standalone use. The Dockerfile uses `node:lts-alpine`, installs production dependencies, and starts `main.js`. Auth imports `cors`, but its application package declares only `express`; align runtime dependencies before relying on a pruned container build. Docker was not verified. No Docker Compose configuration is included.

## Continuous integration

The [GitHub Actions workflow](.github/workflows/ci.yml) is configured for pushes to `master` and pull requests. It uses Node.js 24, installs dependencies with `npm ci`, and runs:

```sh
npx nx run-many -t lint test build typecheck
```

The dedicated `e2e` target is not included in this command. Nx Cloud task distribution is commented out. The presence of a workflow does not establish that checks have passed; production deployment is not configured.

## Project direction

Next steps are to implement authentication, establish database models and persistence, add the Next.js storefront, and define service boundaries for ecommerce features. Messaging, real-time updates, push notifications, machine learning, and production deployment can then be integrated as those features require them.

When extending the workspace, keep service code and configuration with its application, define cross-service API and event contracts explicitly, and update this README as integrations become available. Keep credentials out of committed files and document required environment variables when adding external services.
