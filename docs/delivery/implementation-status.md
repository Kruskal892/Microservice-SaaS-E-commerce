# Implementation status

[Documentation index](../README.md)

This is a source-inspected snapshot of the current working tree. "Configured" means files and target definitions exist; it does not mean runtime or CI validation passed.

**Updated:** 2026-10-17. Proposed product requirements, database models, and API
contracts are design drafts except for the initial users/images Prisma schema described in the database design.

## Present

The shared module setup is rooted directly at `packages/`: one manifest,
`tsconfig.json`, and `tsconfig.lib.json` cover all module folders. Folder imports
use `@microservice-eshop/<folder>` via the shared wildcard; no per-folder configs
are required. Auth references that library, bundles shared source, and registers
the error handler after routes. The internal workspace manifest is named
`@microservice-eshop/shared`; folder aliases are not separate npm packages.

| Area                         | Evidence and scope                                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Workspace                    | Nx, npm workspaces, root lockfile, TypeScript project references                                                               |
| Auth scaffold                | Express listener on default port 6001, CORS, fixed `GET /` response, and server error logging                                  |
| Gateway                      | Default port 8080, local `GET /gateway-health`, catch-all proxy to localhost:6001                                              |
| Gateway middleware           | CORS, Morgan logging, JSON/URL-encoded parsers, cookie parsing, and in-memory rate limiting                                    |
| API documentation dependency | `swagger-ui-express` installed; no UI route or specification                                                                   |
| Persistence tooling          | Prisma/client 6.19.0 locked; MongoDB users/images schema; root CLI config loads DATABASE_URL; generated output ignored         |
| Local runner                 | `npm run dev` invokes all serve targets                                                                                        |
| Build tooling                | Auth esbuild configuration; gateway Webpack configuration                                                                      |
| Tests                        | Auth smoke spec and all auth support defaults aligned to 6001; generated gateway spec still mismatched; Jest/SWC configuration |
| Docker                       | Auth-service Dockerfile and build dependencies                                                                                 |
| CI                           | GitHub Actions install and lint/test/build/typecheck commands                                                                  |
| Debugging                    | Separate VS Code launch configurations                                                                                         |
| Documentation                | Product requirements, features, UI/UX, system/data/technical design, API contracts, delivery plan, and developer guides        |

## Registration work in progress

2026-10-19 startup correction: Prisma's generator now matches the shared
`@prisma/client` import and generation succeeded. Inspector ports are assigned
per service, without inherited `NODE_OPTIONS`. Nx's disabled daemon state was
reset. No build, tests, database requests, or application startup were run for
this correction. The registration and integration gaps below are an earlier
snapshot; consult current source before relying on them.

See [authentication development](../development/authentication.md) for the review
of `feat/auth-controller` against local `develop`, including working-tree changes.
The controller moved under `src`, validates registration fields, and attempts an
email lookup. A shared Prisma singleton/barrel and OTP helper stubs were added.
Redis has an empty module; dotenv, ioredis, nodemailer, and ejs are dependencies.
Registration is not routed and does not create users or deliver OTPs. Client
generation/import mismatch, an incorrect unique-filter argument, and unused
values remain blockers.

## Known gaps

- Shared [error classes and response handler](../architecture/technical-design.md#shared-error-handler-current-source)
  form an npm workspace library registered after auth routes. The gateway does
  not use it. The handler has no `headersSent` delegation. Runtime integration
  and error-response checks are not verified.
- Gateway does not reference the shared library, and Jest has no explicit
  folder-alias mapping. Imports are not verified across every application or
  test runner. The empty `packages/middleware` folder has no public `index.ts` yet.

- Both apps ignore `HOST` and bind without an explicit host; auth E2E still uses `HOST` as its request destination.
- Auth imports `cors` without declaring it in its own package; align runtime dependencies before validating pruned Docker output.
- The gateway startup log still advertises `/api` instead of `/gateway-health`.

- Gateway upstream is hard-coded; changing auth's host/port or using separate containers requires updating it.
- The gateway E2E defaults and assertion do not match the gateway; see [testing](../development/testing.md).
- No authentication endpoints, token/session handling, or user persistence exist.
- No storefront, product catalog, cart, checkout, orders, or payments exist.
- Prisma schema and client generation are configured, but services do not import or instantiate the client. No migrations, seeds, cache, event producer/consumer, or working external integration exists.
- The reported Atlas `db push` failed SCRAM authentication; schema/index deployment remains unconfirmed. `users.imagesId` is required but separate from the avatar relation; resolve this before user persistence.
- `prisma.config.ts` imports `dotenv/config`, but dotenv is only a transitive dependency.
- Auth registers the shared handler, which defines two different response
  shapes; the gateway retains its existing handling. Request validation and token
  verification are absent. Both apps have CORS; rate limiting exists only at the gateway.
- Gateway `trust proxy: 1` and raw `req.ip` rate keys remain in the current source: direct clients can spoof forwarded IPs, and IPv6 subnet grouping is bypassed.
- No middleware sets `req.user`, so the higher 1000-request branch is not an authenticated-user policy.
- Rate counters are process-local; no shared limiter store or proxy retry/timeout policy is configured.
- Static asset serving was removed from the gateway; `/assets` now falls through to auth.
- No gateway container, full local infrastructure stack, deployment workflow, or production environment is configured.
- Unit-test configuration does not yet provide auth behavior coverage; the gateway has no unit-test suite.

## Planned technologies

The [root README stack table](../../README.md#technology-stack) records the supplied project direction: Next.js, MongoDB, Redis, Prisma, Kafka, TensorFlow.js, Socket.IO, Firebase, Swagger/OpenAPI, ImageKit (logo interpretation), AWS, and Cloudflare.

Swagger's UI dependency is installed, but its contract and route are not implemented. Prisma/MongoDB tooling is now configured; its application integration and the other technologies' service contracts remain unimplemented. This list is not a delivery schedule or evidence of working integrations.

## Suggested implementation sequence

See the [implementation plan](implementation-plan.md) for the proposed sequence,
dependencies, and acceptance criteria. No approved timeline or task completion
is implied by the plan.

## Verification boundary

Reviewed branch `feat/auth-controller` against local `develop`, including its
uncommitted/untracked files. The TypeScript project build failed on unused `name`
and `otp` (TS6133); shared-library compilation completed. Database, Redis, email,
startup, lint, Nx application builds, automated tests, Docker, and CI were not
verified. See [the branch review](../development/authentication.md#configuration-and-verification)
for the command and scope. Prior checks do not validate this working tree.

Update this page when code changes the status, and record actual validation separately from intended behavior.
