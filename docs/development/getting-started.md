# Getting started

[Documentation index](../README.md)

## Requirements

Use Node.js 24, matching [CI](../../.github/workflows/ci.yml), and npm. Git is needed to clone the repository. Docker is optional.

Auth registration requires MongoDB, Redis, and SMTP configuration; Kafka, Firebase, AWS, and ImageKit remain planned. Prisma database commands require a reachable MongoDB deployment and valid database-user credentials. There is no frontend to start yet.

## Install

Open a terminal in the repository root. In this workspace:

```powershell
Set-Location 'D:\Microservice Eshop'
npm ci
```

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

Copy the root `.env.example` to a local `.env` and replace its placeholder
MongoDB, Redis, and SMTP values. Both entry points load dotenv before application
imports. Existing shell variables take precedence. Keep `.env` out of commits.

| Variable                  | Consumer                 | Default / purpose             |
| ------------------------- | ------------------------ | ----------------------------- |
| PORT                      | Each app separately      | Auth 6001; gateway 8080       |
| AUTH_SERVICE_URL          | Gateway                  | http://localhost:6001         |
| DATABASE_URL              | Auth / Prisma            | MongoDB connection string     |
| REDIS_DATABASE_URL        | Existing auth OTP client | TCP redis:// or rediss:// URL |
| SMTP_HOST / SMTP_SERVICE  | Auth mail                | SMTP provider settings        |
| SMTP_PORT                 | Auth mail                | 587; 465 enables implicit TLS |
| SMTP_USER / SMTP_PASSWORD | Auth mail                | Provider credentials          |

Leave PORT unset when running both apps through npm run dev. For a custom auth
port, launch it separately with PORT and update AUTH_SERVICE_URL in the gateway's
own environment. Separate containers need a reachable auth service hostname.
Neither app reads HOST; both listen without an explicit bind address.

There is no shared config package, custom port parser, AUTH_PORT, or GATEWAY_PORT.
Port range validation and stronger Redis configuration are deferred in the
[future plan](../architecture/redis-and-runtime-plan.md).

## Prisma and MongoDB

The root dependencies add `prisma` and `@prisma/client` at `^6.19.0`; the lockfile
resolves both to 6.19.0. `prisma.config.ts` explicitly imports `dotenv/config` and
reads `DATABASE_URL`. Create a local root `.env` using your own connection details:

```dotenv
DATABASE_URL="mongodb+srv://USERNAME:ENCODED_PASSWORD@CLUSTER.mongodb.net/development?retryWrites=true&w=majority&authSource=admin"
```

Use a MongoDB database user, URL-encode credentials where needed, and keep `.env`
local. Existing process variables take precedence over dotenv values.
Auth's registration route uses a shared Prisma wrapper. Client generation is
required before starting auth; the registration flow remains in progress.

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
The reported attempt failed with Atlas SCRAM authentication; success remains
unconfirmed. See [troubleshooting](troubleshooting.md#mongodb-scram-authentication-failed).

## Browser requests

Both applications allow credentialed CORS requests from `http://localhost:3000`, with `Authorization` and `Content-Type` request headers. That address is an allowed frontend origin, not the auth port; no frontend is implemented yet. CORS does not authenticate clients or restrict non-browser callers.

## First-day checklist

- Locate both entry points and read their route handlers.
- Get the two default responses locally.
- Read [architecture](../architecture/architecture.md) and [API reference](../api/api-specification.md).
- Read [testing limitations](testing.md) before interpreting a green test run.
- Check [implementation status](../delivery/implementation-status.md) before assuming a feature exists.
