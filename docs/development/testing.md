# Testing

[Documentation index](../README.md)

**Updated:** 2026-10-20. No tests, lint, builds, or runtime integrations were run
for this work. The commands below are available for an explicitly requested check.

## Existing coverage

- Auth has no unit-test files currently; validation and error-path coverage remains future work.
- Auth E2E: GET / returns 200 and the Hello API greeting; it does not test auth.
- Gateway E2E: generated port-3000/root assertion remains mismatched with gateway
  port 8080 and local /gateway-health. It is not a reliable gateway check yet.

The added Redis integration suites and gateway configuration suite were removed
with the deferred Redis/port implementation. No Lua or custom-store tests remain.
The simple OTP operations still have a concurrency race; mocks do not prove Redis
atomicity. See the [future plan](../architecture/redis-and-runtime-plan.md).

## Unit checks

```sh
npx nx test @microservice-eshop/auth-service
npx nx typecheck @microservice-eshop/auth-service
npx nx typecheck @microservice-eshop/api-gateway
```

Auth Jest maps @packages/\* to the shared source and transforms TypeScript with
SWC. Tests mock infrastructure rather than contacting real services. Add permanent regression tests with future behavior changes.

The existing unrouted verification controller calls undefined verifyOtp(), so a
clean auth typecheck remains blocked by unfinished verification. It is not fixed
by the Redis/port revert. Shared error behavior,
HTTP registration, templates, and Docker still need broader requested validation.

## E2E lifecycle

Auth E2E depends on its build/serve targets. Setup waits for HOST/PORT (default
localhost:6001), Axios requests the same port, and teardown kills that port.
Use a dedicated unused port. An unrelated listener can otherwise satisfy setup
or be terminated. Keep a PORT override aligned between service and test setup.

Gateway E2E defaults to port 3000, expects the auth greeting at /, and only starts
the gateway. Fix setup, Axios URL, teardown, and assertions together. Forwarding
checks must explicitly start auth. Do not run it against an unidentified listener.

## Integration checks still needed

When authorized, check SMTP failure, Redis write failure after mail acceptance,
concurrent OTP requests, verification/lockout, MongoDB uniqueness and required
fields, template availability in dist, Linux Prisma generation, and future lifecycle behavior. Use isolated test infrastructure and never production data.
The Prisma schema's required imagesId remains a user-creation design issue.

## CI coverage boundary

CI runs lint test build typecheck across projects, but not the explicit e2e
targets. A configured workflow is not a successful CI result. No live MongoDB,
Redis, SMTP, application startup, Docker, or remote CI result was checked here.

The shared HTTP lifecycle module and its runtime tests are removed. Future
readiness/shutdown checks belong to the [HTTP lifecycle plan](../architecture/http-lifecycle-plan.md).
