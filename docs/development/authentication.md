# Authentication development

[Documentation index](../README.md)

**Updated:** 2026-10-20. This describes source, not a verified running system.

## Current registration flow

`POST /api/user-registration` accepts JSON with name, email, and password.
The controller validates and normalizes input, looks up the email through Prisma,
checks OTP restrictions, tracks requests, and sends an activation email.
Success is HTTP 200 with `{ "message": "OTP sent. Please check your account" }`.
It does not create a user or persist a password.

Validation accepts an object only. Name is trimmed and must contain 1-100
characters. Email is trimmed, lowercased, limited to 254 characters, and checked
for basic format. Password must be a string of 8-128 characters. Seller validation
also requires bounded string phone_number and country fields. Invalid input
throws ValidationError and returns 400 before infrastructure calls.

## Simple OTP helpers

The original ioredis client remains at `packages/libs/redis/index.ts`:
`new Redis(process.env.REDIS_DATABASE_URL!)`. No custom connection options,
client factory, gateway Redis store, Lua scripts, or ownership tokens are added.

| Key                         | Value / expiry                                                       |
| --------------------------- | -------------------------------------------------------------------- |
| `otp_lock:<email>`          | Lock checked by registration; verification must implement its writer |
| `otp_spam_lock:<email>`     | One-hour lock after the request limit is reached                     |
| `otp_request_count:<email>` | Sequential request counter; expiry refreshed to one hour             |
| `otp_cooldown:<email>`      | String flag expiring after 60 seconds                                |
| `otp:<email>`               | Four-digit string expiring after 300 seconds                         |

Restrictions throw rather than calling Express next from a helper. The controller
catches once, so a failed restriction stops delivery. Two requests are allowed
before the next request creates a spam lock, subject to cooldown checks.

Mail rendering and SMTP errors propagate. Redis OTP/cooldown writes happen only
after SMTP acceptance. SMTP rejection therefore does not return success or write
an OTP. A later Redis failure can still occur after SMTP accepted the email.
Sequential counters/cooldowns can race under concurrent requests; these are
explicit future tasks in the [Redis and runtime plan](../architecture/redis-and-runtime-plan.md).

## Runtime and packaging

Auth loads dotenv before application imports. Use the root `.env.example` as a
placeholder guide for DATABASE_URL, REDIS_DATABASE_URL, and SMTP variables.
Prisma uses `prisma-client-js` and imports `@prisma/client`; generate the client
after installation/schema changes. Generating a client does not verify MongoDB.

Mail templates from `src/mail/templates` are copied to `dist/templates` and resolved relative to the auth
bundle. Build assets also copy the Prisma schema. Docker installs locked runtime
dependencies and generates Linux Prisma runtime files before its final image.

Auth uses `PORT` with default 6001; gateway defaults to 8080. There is no shared
port parser or per-app port variable. See [setup](getting-started.md).

Each main.ts calls app.listen() directly. There are no /ready probes or custom
signal/drain handlers. Readiness and graceful shutdown are deferred in the
[HTTP lifecycle plan](../architecture/http-lifecycle-plan.md).

## Remaining authentication work

`userVerification` remains unrouted and calls an undefined `verifyOtp()`.
Verification, failed-code attempt handling, single-use consumption, password
hashing, user creation, login, and sessions are not completed. This existing
placeholder prevents a clean typecheck until its separate implementation.
The users schema also requires imagesId independently of the avatar relation;
resolve that model requirement before creating users.

## Configuration and verification

Validation, restriction, and mail-failure unit coverage remains future work;
no auth unit-test files are currently present. Tests, lint, builds, database/Redis/SMTP
requests, Docker, and CI were not run for these changes. See the
[testing guide](testing.md) before interpreting configured checks as proof.

The [auth-service structure plan](../architecture/auth-service-structure-plan.md)
proposes feature ownership and small migration steps; the folder moves are not
implemented.
