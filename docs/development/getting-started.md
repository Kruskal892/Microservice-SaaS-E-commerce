# Getting started

[Documentation index](../README.md)

**Reviewed:** 2026-10-22. Commands describe setup; live integrations have not
been verified by this documentation refresh.

## Requirements

Use Node.js 24, matching [CI](../../.github/workflows/ci.yml), and npm. Git is needed to clone the repository. Docker is optional.

Auth registration requires MongoDB, Redis, and SMTP configuration. Login also
requires `JWT_ACCESS_TOKEN_SECRET` and `JWT_REFRESH_TOKEN_SECRET`. Importing
auth also initializes client modules, so configure these before startup.
Kafka, frontend, and cloud integrations remain [future work](../future-plans/README.md).
Prisma database commands require a reachable MongoDB deployment and valid
database-user credentials. There is no frontend to start yet.

## Install

Open a terminal in your clone's repository root:

```powershell
npm ci
Copy-Item .env.example .env
```

Copy the example only when creating a new local environment; preserve an
existing `.env`. Replace the copied placeholders with development connection
details, then generate the Prisma client before starting auth:

```sh
npx prisma generate
```

Generation prepares the client without confirming database connectivity.
The committed lockfile is the installation reference. Run installation at the
root because [package.json](../../package.json) defines npm workspaces for
`apps/*` and the `packages` folder itself. One package manifest and TypeScript
configuration cover all shared module folders; each folder exposes an `index.ts`.
Auth uses `@packages/error-handler` through the shared TypeScript
wildcard alias and bundles that source. See
[shared modules](development-guide.md#adding-shared-modules) before adding a
consumer in another application.

## Run both applications

```sh
npm run dev
```

The script runs `npx nx run-many --target=serve --all`. Each serve target builds its application before starting Node.

| Application  | Default address                      | Expected JSON                              |
| ------------ | ------------------------------------ | ------------------------------------------ |
| Auth service | http://localhost:6001/               | `{ "message": "Hello API" }`               |
| API gateway  | http://localhost:8080/gateway-health | `{ "message": "Welcome to api-gateway!" }` |

In a second PowerShell terminal, check the responses:

```powershell
Invoke-RestMethod http://localhost:6001/
Invoke-RestMethod http://localhost:8080/gateway-health
```

To exercise forwarding with both apps running, also request `http://localhost:8080/`; it should return the auth message. `/gateway-health` is handled locally and does not check auth availability. These checks do not verify authentication or ecommerce functionality. Stop the development command with **Ctrl+C**.

## Run one application

```sh
npx nx serve @microservice-eshop/auth-service
```

Or:

```sh
npx nx serve @microservice-eshop/api-gateway
```

## Environment variables

The [configuration reference](../reference/configuration.md) owns all inputs,
defaults, fixed middleware settings, and port diagrams. Use the root
`.env.example` for MongoDB, Redis, SMTP, and JWT-secret placeholders. Replace both
JWT placeholders with distinct local signing secrets before testing login. Both entry points load
dotenv at startup; shell values take precedence. Keep `.env` out of commits.

Leave PORT unset when running both apps through npm run dev. For a custom auth
port, launch it separately with PORT and update AUTH_SERVICE_URL in the gateway's
own environment. Separate containers need a reachable auth service hostname.
Neither app reads HOST; both listen without an explicit bind address.

There is no shared config package, custom port parser, AUTH_PORT, or GATEWAY_PORT.
Port range validation and stronger Redis configuration are deferred in the
[future plan](../future-plans/architecture/redis-and-runtime-plan.md).

## Prisma and MongoDB

The root dependencies add `prisma` and `@prisma/client` at `^6.19.0`; the lockfile
resolves both to 6.19.0. `prisma.config.ts` explicitly imports `dotenv/config` and
reads `DATABASE_URL`. Create a local root `.env` using your own connection details:

```dotenv
DATABASE_URL="mongodb+srv://USERNAME:ENCODED_PASSWORD@CLUSTER.mongodb.net/development?retryWrites=true&w=majority&authSource=admin"
```

Use a MongoDB database user, URL-encode credentials where needed, and keep `.env`
local. Existing process variables take precedence over dotenv values.
Auth's registration, verification, and login routes use a shared Prisma wrapper.
Client generation is required before starting auth. Source wiring does not prove
live database connectivity or successful account creation/login.

When explicitly checking the schema and generating the configured client:

```sh
npx prisma validate
npx prisma generate
```

The Prisma 6 `prisma-client-js` generator writes the client into `node_modules`,
matching the shared wrapper's `@prisma/client` import. Run `npx prisma generate`
after installing dependencies or changing the schema. The former
`generated/prisma` directory is no longer used. Generation does not connect to
MongoDB or synchronize the database. `dotenv` is an explicit root dependency.

To synchronize schema/index changes against your intended development database:

```sh
npx prisma db push
```

Review the target and schema first: this command changes the database. MongoDB
uses `db push`, not Prisma Migrate; the configured migrations path is not an
implemented migration workflow. Do not add data-loss flags to bypass warnings.
Successful database/index synchronization was not verified during this refresh.
For authentication failures see
[troubleshooting](troubleshooting.md#mongodb-scram-authentication-failed).

## Browser requests

Both applications allow credentialed CORS requests from `http://localhost:3000`, with `Authorization` and `Content-Type` request headers. That address is an allowed frontend origin, not the auth port; no frontend is implemented yet. CORS does not authenticate clients or restrict non-browser callers.

## Try the auth API documentation

Run `npm run auth-docs`, then start or restart auth and open
`http://localhost:6001/api-docs`. The generator includes `/api` from the router
mount and supplies request/response examples for registration, verification, and
login. `/docs-json` serves the loaded document. Generation itself does not need
MongoDB/Redis/SMTP or JWT secrets because it parses source without starting auth.

Use the [API reference](../reference/api.md) for the OTP/account creation sequence
and login errors. The four-digit verification example is a placeholder; use the
code sent to your test mailbox. Login issues Secure, HTTP-only JWT cookies;
enable request credentials in browser clients and check cookie storage in the
intended HTTPS setup. Refresh, logout, and protected routes are not implemented.

## First-day checklist

- Locate both entry points and read their route handlers.
- Get the two default responses locally.
- Read [architecture](../architecture/overview.md) and [API reference](../reference/api.md).
- Read [testing limitations](testing.md) before interpreting a green test run.
- Check [implementation status](../operations/implementation-status.md) before assuming a feature exists.
