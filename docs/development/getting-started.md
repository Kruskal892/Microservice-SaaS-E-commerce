# Getting started

[Documentation index](../README.md)

## Requirements

Use Node.js 24, matching [CI](../../.github/workflows/ci.yml), and npm. Git is needed to clone the repository. Docker is optional.

No MongoDB, Redis, Kafka, Firebase, AWS, or ImageKit account is needed to serve the current HTTP scaffolds. Prisma database commands require a reachable MongoDB deployment and valid database-user credentials. There is no frontend to start yet.

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
Auth uses `@microservice-eshop/error-handler` through the shared TypeScript
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

| Variable | Consumer     | Default | Behavior                                 |
| -------- | ------------ | ------- | ---------------------------------------- |
| `PORT`   | Auth service | `6001`  | Converted to a number before listening   |
| `PORT`   | API gateway  | `8080`  | Passed directly to Express/Node when set |

The gateway's upstream is hard-coded to `http://localhost:6001`. Changing the auth port does not change the proxy destination. Neither app reads `HOST`; both listen without an explicit bind address. Both applications read uppercase `PORT`. Neither entry point explicitly loads a `.env` file, and no `.env.example` is provided.

To override the auth service's port in PowerShell:

```powershell
$env:PORT = '3001'
npx nx serve @microservice-eshop/auth-service
```

Open http://localhost:3001/ for that standalone auth session. Gateway forwarding still targets port 6001 and will not reach this overridden port. After stopping it, clear the overrides before running both apps:

```powershell
Remove-Item Env:PORT -ErrorAction SilentlyContinue
npm run dev
```

A shared `PORT` override makes both apps compete for one port. Use separate terminals and distinct ports if you need custom values. Port values are not validated by the application code.

## Prisma and MongoDB

The root dependencies add `prisma` and `@prisma/client` at `^6.19.0`; the lockfile
resolves both to 6.19.0. `prisma.config.ts` explicitly imports `dotenv/config` and
reads `DATABASE_URL`. Create a local root `.env` using your own connection details:

```dotenv
DATABASE_URL="mongodb+srv://USERNAME:ENCODED_PASSWORD@CLUSTER.mongodb.net/development?retryWrites=true&w=majority&authSource=admin"
```

Use a MongoDB database user, URL-encode credentials where needed, and keep `.env`
local. Existing process variables take precedence over dotenv values.
The entry points do not wire database-backed routes yet. A draft controller uses
a shared Prisma wrapper; see [authentication development](authentication.md)
for its client-import mismatch and incomplete registration flow.

When explicitly checking the schema and generating the configured client:

```sh
npx prisma validate
npx prisma generate
```

The `prisma-client` generator outputs TypeScript to `generated/prisma`, which is
Git-ignored. Future consumers must import that generated output and include it
in their build; installing `@prisma/client` alone does not integrate persistence.
`dotenv` is now an explicit root dependency. The wrapper still imports
`@prisma/client` rather than this generated output; align generation, imports,
and shared-project compiler ownership before relying on model types.

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
