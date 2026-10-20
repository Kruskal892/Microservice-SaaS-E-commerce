# Implementation status

[Documentation index](../README.md)

**Updated:** 2026-10-20. Source inspection only; configured is not verified.

## Present in source

- Nx/npm workspace, strict TypeScript, one shared packages manifest and tsconfig.
- Express gateway with local health, auth forwarding, a 16 KB proxy body limit,
  ten-second upstream timeout, and an in-memory IP limiter before body reading.
  Default IP handling includes IPv6 grouping; proxy trust is not enabled.
- Auth registration route with typed input checks, normalized email, Prisma email
  lookup, simple OTP restrictions/counters, and SMTP delivery.
- Restrictions throw so the controller stops; email failures propagate.
- Existing simple ioredis client, string OTPs with 300-second TTL and 60-second
  cooldown. No Lua admission, ownership-token records, or gateway Redis store.
- Swagger UI at /api-docs and JSON at /docs-json.
- MongoDB users/images schema and Prisma 6.19 client generation configuration.
- Shared error middleware in both apps, including headersSent delegation and
  sanitized malformed/oversized body errors.
- Direct app.listen() in each service, with listener error logging. Readiness
  and graceful shutdown are deferred; no shared HTTP module or /ready route.
- Template/schema build assets, declared runtime dependencies, and auth Docker
  generation of platform-compatible Prisma files. Packaging remains unverified.
- Existing greeting E2E projects; no auth unit-test files are currently present. Gateway E2E still needs port/contract/lifecycle alignment.

## Deliberately kept simple

PORT defaults to 6001 for auth and 8080 for gateway. AUTH_SERVICE_URL is a direct
optional gateway override; there is no shared config package or custom port
parser. The Redis client has its original construction and options. Advanced
Redis and runtime work is documented in the
[future plan](../architecture/redis-and-runtime-plan.md).
The [auth folder plan](../architecture/auth-service-structure-plan.md) is proposed,
not an implemented reorganization.

## Known gaps

- Undefined verifyOtp() remains in the unrouted verification controller. Account
  creation, password hashing, OTP verification, login, and sessions are incomplete.
- Sequential OTP checks/counters can race. An email may be accepted before a
  subsequent Redis write fails. Gateway counters are per-process.
- Redis error/retry handling, dependency readiness, and client shutdown remain
  deferred. No custom HTTP draining or resource cleanup is implemented.
- PORT has no explicit range validation. Trusted proxy configuration for a real
  ingress topology remains a deployment task.
- Users.imagesId is required separately from the optional avatar relation.
  Successful database authentication/index synchronization is unconfirmed.
- SMTP acceptance is not guaranteed inbox delivery; transport health is not probed.
- No storefront, commerce APIs, payment flow, Kafka events, or production deployment.
- Existing E2E targets are not explicitly run by CI.

## Verification boundary

No tests, lint, builds, runtime integrations, containers, or CI were executed for
this work. Source and configuration edits do not establish production readiness.
