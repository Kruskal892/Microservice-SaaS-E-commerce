# Implementation status

[Documentation index](README.md)

This is a source-inspected snapshot of the current working tree. "Configured" means files and target definitions exist; it does not mean runtime or CI validation passed.

## Present

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
| Documentation                | Onboarding, architecture, API, development, tests, deployment, troubleshooting                                                 |

## Known gaps

- Both apps ignore `HOST` and bind without an explicit host; auth E2E still uses `HOST` as its request destination.
- Auth imports `cors` without declaring it in its own package; align runtime dependencies before validating pruned Docker output.
- The gateway startup log still advertises `/api` instead of `/gateway-health`.

- Gateway upstream is hard-coded; changing auth's host/port or using separate containers requires updating it.
- The gateway E2E defaults and assertion do not match the gateway; see [testing](testing.md).
- No authentication endpoints, token/session handling, or user persistence exist.
- No storefront, product catalog, cart, checkout, orders, or payments exist.
- No database schema, client, migration, cache, event producer/consumer, or external service connection exists.
- No shared JSON error contract, request validation, or token verification exists. Both apps have CORS; rate limiting exists only at the gateway.
- Gateway `trust proxy: 1` and raw `req.ip` rate keys remain in the current source: direct clients can spoof forwarded IPs, and IPv6 subnet grouping is bypassed.
- No middleware sets `req.user`, so the higher 1000-request branch is not an authenticated-user policy.
- Rate counters are process-local; no shared limiter store or proxy retry/timeout policy is configured.
- Static asset serving was removed from the gateway; `/assets` now falls through to auth.
- No gateway container, full local infrastructure stack, deployment workflow, or production environment is configured.
- Unit-test configuration does not yet provide auth behavior coverage; the gateway has no unit-test suite.

## Planned technologies

The [root README stack table](../README.md#technology-stack) records the supplied project direction: Next.js, MongoDB, Redis, Prisma, Kafka, TensorFlow.js, Socket.IO, Firebase, Swagger/OpenAPI, ImageKit (logo interpretation), AWS, and Cloudflare.

Swagger's UI dependency is installed, but its contract and route are not implemented. The other integrations' adoption details and service contracts are not implemented. This list is not a delivery schedule or evidence of working integrations.

## Suggested implementation sequence

This is a proposal, not an agreed milestone plan:

1. Align gateway smoke tests with its real port, route, and response.
2. Define authentication contracts, persistence ownership, and security requirements.
3. Implement authentication behavior and test gateway forwarding, rate limits, trusted client identity, and upstream failures.
4. Introduce the storefront and ecommerce service boundaries.
5. Add events and other integrations as concrete features require them.
6. Establish deployment, observability, and operational procedures.

## Verification boundary

Earlier in this change, direct TypeScript checks passed for the gateway application and auth E2E project after the review fixes. Both E2E Nx typecheck targets and their application dependencies also passed when fixing the E2E ambient types. These checks do not establish runtime or security behavior, and gateway limiter settings have since been edited again.

For this documentation update, source/configuration and documentation links were inspected and Git whitespace checks were performed. Direct TypeScript project builds passed for both runtime applications (`tsc --build apps/auth-service/tsconfig.app.json apps/api-gateway/tsconfig.app.json --pretty false`). Installation, startup, lint, Nx application builds, automated tests, Docker, CI, databases, and cloud services were not run or verified.

Update this page when code changes the status, and record actual validation separately from intended behavior.
