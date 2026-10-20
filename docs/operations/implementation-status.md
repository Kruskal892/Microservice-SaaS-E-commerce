# Implementation status

[Documentation hub](../README.md) · [Future implementation plan](../future-plans/implementation-plan.md)

**Reviewed:** 2026-10-21. This inventory reflects source/configuration inspection.

## Capability inventory

| Area                      | Present in source/configuration                                                            | Remaining work                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Workspace                 | Nx/npm, strict TypeScript, shared aliases and project references                           | Verify relevant targets as code changes                                                   |
| Gateway                   | Local health, configurable auth proxy, in-memory quota, body limit, timeout, shared errors | E2E alignment, production identity/proxy policy, explicit upstream failure mapping        |
| Registration              | Input validation/normalization, Prisma email lookup, Redis restrictions/counters, SMTP OTP | Concurrency, partial failures, permanent behavior coverage                                |
| Verification and identity | Unrouted placeholder; commented OTP verification line                                      | OTP comparison/consumption, attempt limits, user creation, hashing, login/logout/sessions |
| Data                      | Prisma 6.19 MongoDB users/images schema, shared client                                     | Resolve imagesId; verify connectivity, applied indexes, and writes                        |
| Redis                     | Simple ioredis instance; string OTP/cooldown/counter keys                                  | Atomic admission, bounded failure policy, lifecycle cleanup                               |
| API docs                  | Swagger 2.0 registration JSON and UI                                                       | Complete implemented validation/error contract; automated contract alignment              |
| Tests                     | Two greeting E2E specs; auth Jest/SWC configuration                                        | Auth unit tests; correct gateway E2E; integration/failure-path coverage                   |
| Packaging                 | Auth esbuild assets, gateway Webpack, prune targets, auth Dockerfile                       | Verify generated dependencies, Prisma runtime and image startup                           |
| CI                        | Node 24, npm ci, lint/test/build/typecheck, always-run nx fix-ci                           | Explicit reliable E2E and delivery pipeline                                               |
| Product                   | Draft requirements and proposed designs                                                    | Storefront, catalog, cart, orders, payments, tenancy decisions                            |
| Operations                | Local greetings and listener error logs/exitCode                                           | Readiness, drain/cleanup, ingress, monitoring, backups, production deployment             |

## Known source limitations

- OTP checks/counters are sequential and can race. SMTP acceptance precedes OTP
  storage; a later Redis failure can leave an email without matching state.
- Gateway counters are process-local; direct auth access bypasses them. Neither
  service authenticates requests or trusts a configured production ingress.
- `userVerification` is unrouted and unfinished. Its `verifyOtp()` line is
  commented out, so the current source has no active undefined call there.
- `users.imagesId` is required separately from the optional avatar relation.
  Database synchronization and successful persistence have no current evidence.
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

This refresh reconciles documentation with tracked source, manifests, schema,
test configuration, Dockerfile, and CI workflow. Documentation checks passed on
2026-10-21:

- Prettier check across the root README and docs: 27 Markdown files.
- Local navigation check: 241 file/heading links, no broken targets or orphaned pages.
- All 23 Mermaid diagrams parsed and rendered with Mermaid 12.2.0 in headless
  Edge; representative architecture, registration, database, and lifecycle
  diagrams were visually inspected.
- Three JSON examples parsed; Git whitespace check passed.

These are documentation checks. Application tests, lint, builds,
MongoDB/Redis/SMTP connections, Docker, and remote CI were not run for this
documentation-only change.

All future plans are grouped in [future-plans](../future-plans/README.md).
They are proposals, not completed capabilities or a committed delivery schedule.
