# Implementation status

[Documentation hub](../README.md) · [Future implementation plan](../future-plans/implementation-plan.md)

**Reviewed:** 2026-10-22. This inventory reflects source/configuration inspection.

## Capability inventory

| Area                      | Present in source/configuration                                                                                                                  | Remaining work                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Workspace                 | Nx/npm, strict TypeScript, shared aliases and project references                                                                                 | Verify relevant targets as code changes                                                                           |
| Gateway                   | Local health, configurable auth proxy, in-memory quota, body limit, timeout, shared errors                                                       | E2E alignment, production identity/proxy policy, explicit upstream failure mapping                                |
| Registration              | Input validation/normalization, Prisma email lookup, Redis restrictions/counters, SMTP OTP                                                       | Concurrency, partial failures, permanent behavior coverage                                                        |
| Verification and identity | Routed verification, Redis OTP check, 3-attempt lock, bcrypt hashing, Prisma user persistence                                                    | Consistent validation/normalization, OTP error contract and concurrency coverage                                  |
| Login and JWT cookies     | `POST /api/login`, bcrypt comparison, 15-minute access/7-day refresh signing, HTTP-only JWT cookies, public user response                        | Protected routes/token verification, refresh/rotation, logout/revocation, password reset, browser/CSRF validation |
| Data                      | Prisma 6.19 MongoDB users/images schema (unused imagesId removed), shared client wrapper, active write path                                      | Verify live connectivity, applied indexes, and seed/migration workflow                                            |
| Redis                     | Simple ioredis instance; string OTP, cooldown, attempt count, and lock keys                                                                      | Atomic admission, bounded failure policy, lifecycle cleanup                                                       |
| API docs                  | Swagger 2.0 greeting and all three auth POSTs; mounted `/api` paths, required fields and concrete examples; static `npm run auth-docs` generator | Cookie headers and detailed validation/error contracts; permanent contract-alignment tests                        |
| Tests                     | Two greeting E2E specs; auth Jest/SWC configuration                                                                                              | Auth unit tests; correct gateway E2E; integration/failure-path coverage                                           |
| Packaging                 | Auth esbuild assets, gateway Webpack, prune targets, auth Dockerfile                                                                             | Verify generated dependencies, Prisma runtime and image startup                                                   |
| CI                        | Node 24, npm ci, lint/test/build/typecheck, always-run nx fix-ci                                                                                 | Explicit reliable E2E and delivery pipeline                                                                       |
| Product                   | Draft requirements and proposed designs                                                                                                          | Storefront, catalog, cart, orders, payments, tenancy decisions                                                    |
| Operations                | Local greetings and listener error logs/exitCode                                                                                                 | Readiness, drain/cleanup, ingress, monitoring, backups, production deployment                                     |

## Known source limitations

- OTP checks/counters are sequential and can race. SMTP acceptance precedes OTP
  storage; a later Redis failure can leave an email without matching state.
- Gateway counters are process-local; direct auth access bypasses them. Neither
  service verifies credentials on subsequent requests or trusts a configured
  production ingress. Login issues tokens but does not protect other routes.
- Login checks field truthiness only and does not normalize email. Unknown users
  return 400 while wrong passwords return 401, revealing different failure cases.
  Missing parsed bodies or signing secrets can reach the generic 500 handler.
- Both JWT cookies always use Secure/HttpOnly/SameSite=None and a 7-day lifetime;
  access JWT validity is only 15 minutes. There is no environment override,
  refresh/logout consumer, persisted revocation state, or browser/CSRF verification.
- Verification forwards OTP errors with `next(error)` and then throws its return
  value; input normalization and error propagation need a consistent contract.
- Database synchronization and successful persistence against live MongoDB
  instances have no recorded evidence.
- Auth Jest has no shared-alias mapper or unit-test files. Gateway E2E defaults
  to port 3000 and expects auth's greeting while starting only gateway.
- Docker uses a floating `node:lts-alpine` base and `npm --omit=dev -f install`.
  No explicit Prisma-generation step or non-root user is configured. Pruned
  runtime dependencies and container startup remain unverified.
- Each app directly listens and only sets `exitCode` on listener errors; there
  are no readiness probes or custom client shutdown handlers.

Detailed behavior belongs in [architecture](../architecture/overview.md),
[request flows](../architecture/request-flows.md),
[testing](../development/testing.md), and [deployment](deployment.md).

## Documentation verification boundary

The 2026-10-22 refresh covers current login/cookie source, Swagger changes,
manifests, configuration examples, and the existing schema/tests/build/CI setup.
Passed checks are recorded with the PR description:

- Focused shared-library/auth TypeScript project compilation with
  `node node_modules/typescript/bin/tsc -b packages/tsconfig.lib.json apps/auth-service/tsconfig.app.json --pretty false`.
- `npm run auth-docs`, generated route/request/response example assertions, and
  equivalent generation from the root and source directory.
- Prettier across README/docs/PR description; local file/heading links, JSON
  examples, balanced code fences, and Git whitespace checks.

Application unit/E2E tests, lint, Nx application builds, live login/browser
behavior, MongoDB/Redis/SMTP connections, Docker, and remote CI were not run.
Mermaid source was updated alongside routing/login explanations; diagram rendering
is reported separately in the PR description. These checks do not establish live
authentication or deployment readiness.

All future plans are grouped in [future-plans](../future-plans/README.md).
They are proposals, not completed capabilities or a committed delivery schedule.
