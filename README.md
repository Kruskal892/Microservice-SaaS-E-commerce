# Microservice Eshop

An ecommerce backend foundation built with TypeScript, Express, Nx, and npm
workspaces. The repository contains an API gateway, an authentication service,
shared error/database clients, Prisma's MongoDB schema, and HTTP smoke tests.

Registration currently validates input, checks for an existing email, and sends
an OTP using Redis and SMTP. It does not create accounts. Verification, login,
sessions, the storefront, and commerce APIs remain unfinished or planned.

## Documentation

Start with the [documentation hub](docs/README.md). Current behavior and proposed
work have separate documentation areas.

| Topic                       | Guide                                                                                                            |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Setup                       | [Getting started](docs/development/getting-started.md)                                                           |
| System and code layout      | [Architecture](docs/architecture/overview.md), [repository structure](docs/architecture/repository-structure.md) |
| Visual request walkthroughs | [HTTP and OTP flows](docs/architecture/request-flows.md)                                                         |
| Endpoints and environment   | [API](docs/reference/api.md), [configuration](docs/reference/configuration.md)                                   |
| Contributor workflow        | [Development guide](docs/development/development-guide.md), [testing](docs/development/testing.md)               |
| Packaging and current gaps  | [Deployment](docs/operations/deployment.md), [implementation status](docs/operations/implementation-status.md)   |
| Roadmap and draft designs   | [Future plans](docs/future-plans/README.md)                                                                      |

## Quick start

Use **Node.js 24** (matching CI) and npm. From the repository root:

```sh
npm ci
```

Copy [.env.example](.env.example) to `.env`, configure MongoDB, Redis, and SMTP,
then generate the Prisma client and start the services:

```sh
npx prisma generate
npm run dev
```

Leave `PORT` unset when starting both applications together. Each service reads
the same variable in its own process. See [setup](docs/development/getting-started.md)
for separate startup, configuration, and database synchronization instructions.

| Application     | Default URL                          | Source-defined response                    |
| --------------- | ------------------------------------ | ------------------------------------------ |
| Auth            | http://localhost:6001/               | `{ "message": "Hello API" }`               |
| Gateway         | http://localhost:8080/gateway-health | `{ "message": "Welcome to api-gateway!" }` |
| Auth Swagger UI | http://localhost:6001/api-docs       | Registration documentation                 |

The gateway forwards other paths to `AUTH_SERVICE_URL`, defaulting to
`http://localhost:6001`. Its local health response does not check auth or any
external dependency. External integrations and container startup were not
verified by this documentation refresh.

## Technology and repository

| Area                | Present configuration                                             |
| ------------------- | ----------------------------------------------------------------- |
| Workspace           | Nx 23.3, npm workspaces (`apps/*`, `packages`)                    |
| Runtime             | Node.js; Express 5; TypeScript 6.0                                |
| HTTP gateway        | express-http-proxy, CORS, Morgan, in-memory IP limiting           |
| Persistence         | Prisma 6.19, MongoDB users/images schema and email lookup         |
| OTP and mail        | ioredis, Node crypto, Nodemailer, EJS                             |
| API documentation   | Swagger 2.0 JSON and Swagger UI                                   |
| Checks and delivery | Jest/SWC/Axios, ESLint, Prettier, GitHub Actions; auth Dockerfile |

[Package manifests](package.json) and the [lockfile](package-lock.json) own
dependency versions. Next.js, Kafka, Socket.IO, Firebase, TensorFlow.js, AWS,
Cloudflare, and an unconfirmed media provider belong to
[future plans](docs/future-plans/README.md).

```text
apps/       # Gateway, auth service, and their E2E projects
packages/   # One shared workspace: errors, Prisma, Redis
prisma/     # MongoDB schema; root prisma.config.ts configures the CLI
docs/       # Architecture, references, guides, operations, future plans
```

Common Nx commands and build ownership are in the
[development guide](docs/development/development-guide.md). The
[CI workflow](.github/workflows/ci.yml) runs `lint test build typecheck`; it does
not explicitly run E2E targets or deploy. Auth has no unit-test files, and the
gateway's generated E2E test has a known port/contract mismatch. Consult
[testing](docs/development/testing.md) before relying on those checks.
