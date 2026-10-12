# Microservice Eshop

A microservice ecommerce project built with an **Nx monorepo** and **TypeScript**. The intended platform combines a Next.js storefront, Express backend services, persistent storage, event messaging, real-time communication, and machine learning.

The repository is currently at the foundation stage: an Express service scaffold, an API smoke test, Docker packaging, and a GitHub Actions workflow are present. The stack below includes the project direction from the supplied technology overview; planned integrations are not yet implemented.

## Technology stack

| Area | Technology | Status |
| --- | --- | --- |
| Architecture | Microservices | Intended architecture; one backend scaffold exists |
| Monorepo | Nx | Configured with npm workspaces |
| Language | TypeScript | Configured with strict compiler settings |
| Backend | Node.js, Express | Service scaffold with `GET /` |
| Frontend | Next.js | Planned |
| Primary database | MongoDB | Planned |
| Secondary data store | Redis | Planned |
| Database ORM | Prisma | Planned |
| Message broker | Apache Kafka | Planned |
| Machine learning | TensorFlow.js | Planned |
| WebSocket communication | Socket.IO | Planned |
| Web push notifications | Firebase | Planned |
| Testing | Jest, Axios | API smoke test configured |
| API documentation | Swagger / OpenAPI | Planned |
| Cloud assets | ImageKit | Planned; inferred from the blue "i" logo in the overview |
| Containerization | Docker | Dockerfile and Nx Docker targets configured |
| CI/CD | Git, GitHub Actions | CI workflow present; deployment not configured |
| Deployment | AWS | Planned |
| Domain management | Cloudflare | Planned |

Dependency versions are recorded in [package.json](package.json) and [package-lock.json](package-lock.json). No database, message broker, frontend, or cloud integration is currently included.

## Architecture

Nx manages application tasks, dependencies, and build tooling from the repository root. Applications live under `apps/`. Explicit targets are defined in each application's `package.json`; plugins in `nx.json` infer additional targets.

The intended architecture uses a Next.js frontend to consume Express service APIs, MongoDB with Prisma for persistence, Redis as a secondary store, and Kafka for event messaging. Socket.IO, Firebase, TensorFlow.js, and cloud services extend that platform as features are implemented. Service boundaries, event contracts, and deployment topology remain to be designed.

### Current applications

| Application | Nx project name | Purpose |
| --- | --- | --- |
| `auth-service` | `@microservice-eshop/auth-service` | Express scaffold; authentication endpoints are not implemented yet |
| `auth-service-e2e` | `@microservice-eshop/auth-service-e2e` | Jest/Axios smoke test against the backend |

Currently, an HTTP client calls the Express service directly. No API gateway, database, or message broker participates in the request.

## Repository structure

```text
.
|-- apps/
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

Start the backend:

```sh
npx nx serve @microservice-eshop/auth-service
```

The development target builds the service before starting it. Open `http://localhost:3000` or send a `GET /` request. The current endpoint returns HTTP 200 with:

```json
{ "message": "Hello API" }
```

### Environment configuration

| Variable | Local default | Purpose |
| --- | --- | --- |
| `HOST` | `localhost` | Interface on which the service listens |
| `PORT` | `3000` | HTTP port |

The service reads process environment variables directly. No `.env` loader or `.env.example` is configured.

For example, in PowerShell:

```powershell
$env:HOST = 'localhost'
$env:PORT = '3001'
npx nx serve @microservice-eshop/auth-service
```

## Development commands

Run these from the repository root. The root `package.json` has no npm scripts; use Nx directly.

| Task | Command |
| --- | --- |
| List projects | `npx nx show projects` |
| Inspect service targets | `npx nx show project @microservice-eshop/auth-service` |
| View dependency graph | `npx nx graph` |
| Start development server | `npx nx serve @microservice-eshop/auth-service` |
| Build service | `npx nx build @microservice-eshop/auth-service` |
| Run service unit tests | `npx nx test @microservice-eshop/auth-service` |
| Run API smoke test | `npx nx e2e @microservice-eshop/auth-service-e2e` |
| Check service types | `npx nx typecheck @microservice-eshop/auth-service` |
| Lint service | `npx nx lint @microservice-eshop/auth-service` |

The build defaults to production and writes to `apps/auth-service/dist`. Unit test configuration exists, but no service unit test files are present yet.

The E2E target depends on the backend build and serve targets. It waits for the configured port and checks that `GET /` returns HTTP 200 and the expected JSON. Teardown kills the process on that port, so use a free port dedicated to the test run. The test does not cover authentication or ecommerce behavior.

## Docker

Build the service image:

```sh
npx nx docker:build @microservice-eshop/auth-service
```

The target depends on build and pruning tasks that prepare the distribution directory and runtime dependencies.

Run the container with the HTTP port published:

```sh
npx nx docker:run @microservice-eshop/auth-service -p 3000:3000
```

The Dockerfile uses `node:lts-alpine`, installs production dependencies, and starts `main.js`. It sets `HOST=0.0.0.0` and `PORT=3000` inside the container. The base image follows the Node LTS tag rather than a pinned release. No Docker Compose configuration is included.

## Continuous integration

The [GitHub Actions workflow](.github/workflows/ci.yml) is configured for pushes to `master` and pull requests. It uses Node.js 24, installs dependencies with `npm ci`, and runs:

```sh
npx nx run-many -t lint test build typecheck
```

The dedicated `e2e` target is not included in this command. Nx Cloud task distribution is commented out. The presence of a workflow does not establish that checks have passed; production deployment is not configured.

## Project direction

Next steps are to implement authentication, establish database models and persistence, add the Next.js storefront, and define service boundaries for ecommerce features. Messaging, real-time updates, push notifications, machine learning, and production deployment can then be integrated as those features require them.

When extending the workspace, keep service code and configuration with its application, define cross-service API and event contracts explicitly, and update this README as integrations become available. Keep credentials out of committed files and document required environment variables when adding external services.
