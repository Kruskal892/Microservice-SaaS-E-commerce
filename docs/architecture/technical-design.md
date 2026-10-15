# Technical Design Document (TDD)

[Documentation index](../README.md)

**Priority:** High. **Status:** Current patterns and proposed first-slice decisions.
**Updated:** 2026-10-15.

## 1. Implementation ownership

| Concern                                          | Current owner / source                                             |
| ------------------------------------------------ | ------------------------------------------------------------------ |
| Gateway middleware, local route, proxy, listener | [Gateway main.ts](../../apps/api-gateway/src/main.ts)              |
| Auth CORS, root response, listener error status  | [Auth main.ts](../../apps/auth-service/src/main.ts)                |
| App tasks/dependencies                           | Each app's package.json                                            |
| Inferred tasks/caching/base branch               | [nx.json](../../nx.json)                                           |
| Strict TypeScript                                | [tsconfig.base.json](../../tsconfig.base.json), project references |
| Shared modules and folder aliases                | [packages](../../packages/package.json), [library config](../../packages/tsconfig.lib.json), shared TypeScript `paths` |
| HTTP checks                                      | E2E projects; gateway generated assertion is mismatched            |

Keep behavior/configuration with its app. Reuse Express/Nx patterns and introduce
shared modules only for real consumers. No service-layer framework exists. The
[development guide](../development/development-guide.md) owns detailed task/editor setup.

## Prisma persistence tooling (current source)

[prisma.config.ts](../../prisma.config.ts) loads dotenv and configures the schema,
classic engine, `DATABASE_URL`, and a migrations directory path. The
[MongoDB schema](../../prisma/schema.prisma) declares users/images and a
`prisma-client` generator with custom TypeScript output under `generated/prisma`.
Prisma and its client are locked to 6.19.0. Neither service consumes the client;
HTTP request behavior is unchanged. The root CLI config is not included in the
root TypeScript project's empty `files` list.

Auth's solution config no longer directly references `../../packages`; its
application config retains `../../packages/tsconfig.lib.json`. Runtime bundling
configuration is unchanged. Build/typecheck success was not checked here.

See [database design](database-design.md#current-prisma-schema) for schema
constraints and unresolved fields, and [setup](../development/getting-started.md#prisma-and-mongodb)
for explicit commands. A configured migrations path does not establish MongoDB
migration support or a deployment history.

## 2. Proposed request pattern

Route -> input validation -> verified identity when required -> ownership check ->
business operation -> persistence -> public response. Validate in the receiving
service even if the gateway validates. Do not pass arbitrary client objects into
database writes. Separate transport/business code when behavior justifies it.

The [API specification](../api/api-specification.md) owns contracts. Introduce
executable OpenAPI and a Swagger route with implemented APIs; the installed UI
dependency is not an existing contract.

## 3. Proposed decisions

| Topic    | Direction                                               | Decision gate                                                          |
| -------- | ------------------------------------------------------- | ---------------------------------------------------------------------- |
| Identity | Auth owns hashing and session issue/revocation          | Select session/token storage, transport, expiry, verification/recovery |
| Gateway  | Configurable upstreams and explicit failure policy      | Validate startup config; decide proxy topology, timeout/status mapping |
| Access   | Verified identity plus ownership in the service         | Never trust client user IDs for cart/order access                      |
| Data     | MongoDB/Prisma, service-owned collections               | Confirm connector, deployment, and checkout consistency                |
| Commerce | Smallest complete catalog/cart/order owner              | Do not create a service for each entity by default                     |
| Money    | Integer minor units, currency, server totals            | Decide precision, bounds, tax, shipping and rounding                   |
| Retries  | Durable customer/key uniqueness and request fingerprint | Same request returns original order; conflicting reuse is 409          |
| Frontend | Next.js consuming public APIs                           | No state library/cache selected                                        |
| Async    | Integrate only for agreed workflows                     | Need schema ownership, replay/delivery/failure policy                  |

These are proposals. Cookie sessions need a CSRF policy; token alternatives need
secure transport/storage, expiry, and revocation. Parsed cookies or client identity
headers cannot establish a logged-in user.

## 4. Foundation fixes to implement

1. Align gateway E2E port/readiness/teardown/assertions; separate local health from
   forwarding and explicitly start auth for forwarding.
2. Declare imported runtime packages per app and review pruning. Auth declares
   Express and the shared workspace package but omits its CORS dependency;
   gateway declares only Express despite other imports.
3. Replace assumed proxy trust/raw-IP keys with the chosen topology and IPv6 policy.
   Remove the unverified req.user allowance until identity exists.
4. Configure upstream, validate ports, correct the `/api` startup log, decide
   practical body limits/order, and specify upstream failures.
5. Separate liveness/readiness and add shutdown/error behavior for operations.

These are plan tasks, not implementation changes made by this documentation.

## 5. Consistency and failures

[Database design](database-design.md) owns the draft model. Cart updates need
conflict handling; order writes need atomic or compensating stock behavior.
Return success only after required durable state exists. Matching retries reuse
the order; mismatching keys fail. Preserve recoverable cart state and avoid logging
passwords, tokens, or personal request payloads.

Auth registers the shared error handler described below; the gateway does not
use it. Correlation IDs, proxy timeout, and structured logging remain absent.
Sanitization and upstream status mapping still need decisions; the services do
not share a uniform failure contract.

### Shared error handler (current source)

Sources: [error classes](../../packages/error-handler/index.ts),
[response handler](../../packages/error-handler/error-middleware.ts), and
[TypeScript configuration](../../packages/tsconfig.json).

`AppError` extends `Error` with a readonly HTTP `statusCode`, an
`isOperational` flag (defaults to `true`), and optional `details` (currently
`any`). Its constructor initializes the message and captures a Node stack trace.
The readonly fields are a TypeScript restriction, not runtime object freezing.

| Class | HTTP status | Default message | Optional details |
| --- | --- | --- | --- |
| `NotFoundError` | 404 | Resources not found | No |
| `ValidationError` | 400 | Invalid request data | Yes |
| `AuthError` | 401 | Unauthorized | No |
| `ForbiddenError` | 403 | Forbidden Access | No |
| `DatabaseError` | 500 | Database Error | Yes |
| `RateLimitError` | 429 | Too many requests, please try again later | No |

For example, `throw new NotFoundError('User not found')` creates a 404 error;
it does not send a response by itself. All subclasses currently set
`isOperational` to `true`, including `DatabaseError`. The response handler does
not inspect this flag.

`errorMiddleware` checks `instanceof AppError`, logs the request method, URL,
and error message, then returns the error's status and JSON. Other errors are
logged and mapped to a generic 500 response. The exact
[response formats](../api/api-specification.md#shared-error-handler-auth-service)
belong in the API specification.

**Integration:** auth imports `@microservice-eshop/error-handler`, mapped by
the shared TypeScript `paths` wildcard to `packages/error-handler/index.ts`.
That folder's entry point exports both classes and middleware. Auth's esbuild
target bundles the shared source into its CommonJS output and registers the
four-parameter handler after routes. Folder aliases are not standalone npm
packages; plain Node cannot resolve them without bundling or a resolver.
One workspace package at `packages/` groups the modules for Nx and TypeScript
project references. Nx infers its build from `tsconfig.lib.json`, and auth runs
dependency builds when serving. The gateway does not register the handler.

The workspace manifest still names the grouping `@microservice-eshop/shared`;
folder aliases such as `@microservice-eshop/error-handler` do not correspond to
separate npm packages. The shared config includes `**/*.ts`, excludes `dist`
and `node_modules`, and emits JavaScript and declarations into `packages/dist`.
New folders need only code and an `index.ts` exporting their public API. See
[the development guide](../development/development-guide.md#adding-shared-modules)
for consumer setup. Gateway has no shared-library project reference; Jest has
no explicit alias mapping. Those consumers have not been verified for shared imports.

**Remaining gaps:** the handler does not delegate with `next(err)` when
`res.headersSent` is true.
The handler currently sends application messages and truthy `details` unchanged,
including database details; define safe public values before using it in APIs.
Runtime integration and response handling have not been verified.

## 6. Verification and rollout

Add permanent checks for validation/ownership, credentials, expiry/revocation,
quantity bounds, concurrent cart edits, stock conflicts, duplicate checkout, and
upstream failure with each behavior. Align E2E lifecycle before CI integration.
[Testing guide](../development/testing.md) explains existing coverage.

Persistence rollout needs reviewed schema/index updates, backups/restore,
configuration checks, health checks, and rollback compatible with stored records.
No application, infrastructure, lint, build, or test checks ran for this docs update.
