# Microservice Eshop

An ecommerce foundation built with TypeScript, Express, Next.js, Nx, and npm
workspaces. The repository contains an API gateway, an authentication service,
shared error/database clients, Prisma's MongoDB schema, HTTP smoke tests, and a
Next.js client with Tailwind v4 design tokens, `next-themes` light/dark switching, and
shared UI components.

Registration currently validates input, checks for an existing email, and sends
an OTP using Redis and SMTP. Registration verification (`POST /api/verify-registration`)
validates the OTP, enforces attempt locks (30-minute lock after 3 failed attempts),
hashes passwords with bcrypt, and creates user accounts in MongoDB. Login
(`POST /api/login`) checks credentials and issues access/refresh JWT cookies.
Three password-recovery routes are also mounted, but reset still requires no
verification proof. See the
[recovery blockers](docs/development/authentication.md#password-recovery-blockers).
The client renders its header (with sticky navigation, search input, and a
light/dark `ThemeToggle`), a placeholder home page, and `/login` and `/sign-up`
pages with shared controls and React Hook Form + Zod validation.
`/sign-up` connects registration (`POST /api/user-registration`) and four-digit
OTP verification (`POST /api/verify-registration`) using Axios and TanStack Query;
`/login` submission and OTP resend show explicit unavailable feedback, and Google
sign-in is disabled. Storefront features are not implemented. See the
[client guide](apps/client/README.md) for API setup, theme behavior,
password visibility controls, header navigation, and registration fields.
Token verification on protected routes, refresh, logout, and
commerce APIs remain unfinished or planned. Live integrations are unverified.

The reusable component library includes Button, form controls, DropdownMenu,
Modal, Tabs, Tooltip, Badge and Card. Run `npm run storybook` for usage/state
examples at port 6006. See the [component guide](docs/reference/common-components.md)
and [design contract](docs/design/shared-ui-system.md).

## Documentation

Start with the [documentation hub](docs/README.md). Current behavior and proposed
work have separate documentation areas.

| Topic                       | Guide                                                                                                                             |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Setup                       | [Getting started](docs/development/getting-started.md)                                                                            |
| System and code layout      | [Architecture](docs/architecture/overview.md), [repository structure](docs/architecture/repository-structure.md)                  |
| Visual request walkthroughs | [HTTP and OTP flows](docs/architecture/request-flows.md)                                                                          |
| Endpoints and environment   | [API](docs/reference/api.md), [configuration](docs/reference/configuration.md)                                                    |
| Client and styling          | [Client setup](apps/client/README.md), [design tokens](docs/reference/design-tokens.md), [shared UI](docs/reference/shared-ui.md) |
| Contributor workflow        | [Development guide](docs/development/development-guide.md), [testing](docs/development/testing.md)                                |
| Packaging and current gaps  | [Deployment](docs/operations/deployment.md), [implementation status](docs/operations/implementation-status.md)                    |
| Roadmap and draft designs   | [Future plans](docs/future-plans/README.md)                                                                                       |

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

Start the client in a separate terminal:

```sh
npm run client
```

The client defaults to `http://localhost:3000` and renders its placeholder,
`/login`, and `/sign-up` UI pages without backend credentials. Submitting `/sign-up`
requires `NEXT_PUBLIC_API_URL` in `apps/client/.env` and running backend services.
`npm run dev` starts backend `serve` targets; it does not start the client's `dev` target.

Leave `PORT` unset when starting both backend applications together. Each service reads
the same variable in its own process. See [setup](docs/development/getting-started.md)
for separate startup, configuration, and database synchronization instructions.

| Application     | Default URL                          | Source-defined response                                                                                     |
| --------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Auth            | http://localhost:6001/               | `{ "message": "Hello API" }`                                                                                |
| Gateway         | http://localhost:8080/gateway-health | `{ "message": "Welcome to api-gateway!" }`                                                                  |
| Auth Swagger UI | http://localhost:6001/api-docs       | Six auth POST contracts, including recovery limitations                                                     |
| Client          | http://localhost:3000/               | Responsive header, theme switch, `/login` form UI, `/sign-up` registration & OTP flow, placeholder home     |

The gateway forwards other paths to `AUTH_SERVICE_URL`, defaulting to
`http://localhost:6001`. Its local health response does not check auth or any
external dependency. External integrations and container startup were not
verified by this documentation refresh.

## Technology and repository

| Area                | Present configuration                                                                     |
| ------------------- | ----------------------------------------------------------------------------------------- |
| Workspace           | Nx 23.3, npm workspaces (`apps/*`, `packages`)                                            |
| Runtime             | Node.js; Express 5; TypeScript 6.0                                                        |
| Frontend            | Next.js 16.4, React 19, Tailwind CSS 4.3, React Hook Form 7.91, Zod 4.6, TanStack Query 5 |
| HTTP gateway        | express-http-proxy, CORS, Morgan, in-memory IP limiting                                   |
| Persistence         | Prisma 6.19, MongoDB users/images schema and user persistence                             |
| Security            | bcryptjs password hashing; jsonwebtoken JWT signing; HTTP-only cookies                    |
| OTP and mail        | ioredis, Node crypto, Nodemailer, EJS                                                     |
| API documentation   | Swagger 2.0 JSON and Swagger UI; `npm run auth-docs` generator                            |
| Checks and delivery | Jest/SWC/Axios, ESLint, Prettier, GitHub Actions; auth Dockerfile                         |

[Package manifests](package.json) and the [lockfile](package-lock.json) own
dependency versions. Kafka, Socket.IO, Firebase, TensorFlow.js, AWS,
Cloudflare, and an unconfirmed media provider belong to
[future plans](docs/future-plans/README.md).

```text
apps/       # Next.js client, gateway, auth service, and backend E2E projects
packages/   # One shared workspace: errors, Prisma, Redis, UI, assets
prisma/     # MongoDB schema; root prisma.config.ts configures the CLI
docs/       # Architecture, references, guides, operations, future plans
```

Common Nx commands and build ownership are in the
[development guide](docs/development/development-guide.md). The
[CI workflow](.github/workflows/ci.yml) runs `lint test build typecheck`; it does
not explicitly run E2E targets or deploy. Auth has no unit-test files, and the
gateway's generated E2E test has a known port/contract mismatch. Consult
[testing](docs/development/testing.md) before relying on those checks.
