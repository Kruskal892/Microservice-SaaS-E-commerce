# Microservice Eshop

An ecommerce backend foundation built with TypeScript, Express, Nx, and npm
workspaces. The repository contains an API gateway, an authentication service,
shared error/database clients, Prisma's MongoDB schema, and HTTP smoke tests.

Registration currently validates input, checks for an existing email, and sends
an OTP using Redis and SMTP. Registration verification (`POST /api/verify-registration`)
validates the OTP, enforces attempt locks (30-minute lock after 3 failed attempts),
hashes passwords with bcrypt, and creates user accounts in MongoDB. Login
(`POST /api/login`) checks credentials and issues access/refresh JWT cookies.
Three password-recovery routes are also mounted, but reset still requires no
verification proof. See the
[recovery blockers](docs/development/authentication.md#password-recovery-blockers).
Token verification on protected routes, refresh, logout, the storefront, and
commerce APIs remain unfinished or planned. Live integrations are unverified.

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

Copy [.env.example](.env.example) to `.env`, configure MongoDB, Redis, SMTP, and
separate access/refresh JWT signing secrets. Then generate the Prisma client and
start the services:

```sh
npx prisma generate
npm run dev
```

Leave `PORT` unset when starting both applications together. Each service reads
the same variable in its own process. See [setup](docs/development/getting-started.md)
for separate startup, configuration, and database synchronization instructions.

| Application     | Default URL                          | Source-defined response                                 |
| --------------- | ------------------------------------ | ------------------------------------------------------- |
| Auth            | http://localhost:6001/               | `{ "message": "Hello API" }`                            |
| Gateway         | http://localhost:8080/gateway-health | `{ "message": "Welcome to api-gateway!" }`              |
| Auth Swagger UI | http://localhost:6001/api-docs       | Six auth POST contracts, including recovery limitations |

The gateway forwards other paths to `AUTH_SERVICE_URL`, defaulting to
`http://localhost:6001`. Its local health response does not check auth or any
external dependency. External integrations and container startup were not
verified by this documentation refresh.

## Technology and repository

| Area                | Present configuration                                                  |
| ------------------- | ---------------------------------------------------------------------- |
| Workspace           | Nx 23.3, npm workspaces (`apps/*`, `packages`)                         |
| Runtime             | Node.js; Express 5; TypeScript 6.0                                     |
| HTTP gateway        | express-http-proxy, CORS, Morgan, in-memory IP limiting                |
| Persistence         | Prisma 6.19, MongoDB users/images schema and user persistence          |
| Security            | bcryptjs password hashing; jsonwebtoken JWT signing; HTTP-only cookies |
| OTP and mail        | ioredis, Node crypto, Nodemailer, EJS                                  |
| API documentation   | Swagger 2.0 JSON and Swagger UI; `npm run auth-docs` generator         |
| Checks and delivery | Jest/SWC/Axios, ESLint, Prettier, GitHub Actions; auth Dockerfile      |

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
