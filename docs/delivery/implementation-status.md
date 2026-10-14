# Implementation status

[Documentation index](../README.md)

This is a source-inspected snapshot of the current working tree. "Configured" means files and target definitions exist; it does not mean runtime or CI validation passed.

**Updated:** 2026-10-14. Proposed product requirements, database models, and API
contracts in the new documentation are design drafts, not implemented features.

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
| Local runner                 | `npm run dev` invokes all serve targets                                                                                        |
| Build tooling                | Auth esbuild configuration; gateway Webpack configuration                                                                      |
| Tests                        | Auth smoke spec and all auth support defaults aligned to 6001; generated gateway spec still mismatched; Jest/SWC configuration |
| Docker                       | Auth-service Dockerfile and build dependencies                                                                                 |
| CI                           | GitHub Actions install and lint/test/build/typecheck commands                                                                  |
| Debugging                    | Separate VS Code launch configurations                                                                                         |
| Documentation                | Product requirements, features, UI/UX, system/data/technical design, API contracts, delivery plan, and developer guides        |

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
- No database schema, client, migration, cache, event producer/consumer, or external service connection exists.
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

Swagger's UI dependency is installed, but its contract and route are not implemented. The other integrations' adoption details and service contracts are not implemented. This list is not a delivery schedule or evidence of working integrations.

## Suggested implementation sequence

See the [implementation plan](implementation-plan.md) for the proposed sequence,
dependencies, and acceptance criteria. No approved timeline or task completion
is implied by the plan.

## Verification boundary

This update inspects source/configuration and reorganizes documentation. Prior
typecheck results are not evidence for the current working tree. Installation,
startup, lint, typechecks, builds, automated tests, Docker, live CI, databases,
and cloud services were not run or verified during this update.

Earlier in this session, offline installation refreshed the workspace link and
lockfile, and direct no-emit TypeScript inspection found no package compiler
diagnostics. These checks do not verify application builds or runtime responses.
Nx target inspection was blocked by `spawn EPERM`. The IDE's literal-wildcard diagnostic was not reproduced
by the compiler and its resolution in the editor remains unverified.

Update this page when code changes the status, and record actual validation separately from intended behavior.
