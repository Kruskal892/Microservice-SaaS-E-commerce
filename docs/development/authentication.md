# Authentication development

[Documentation hub](../README.md) · [Registration sequence diagram](../architecture/request-flows.md#registration-and-otp-delivery)

**Status:** Source implementation, not a verified live integration.
**Reviewed:** 2026-10-21.

## Current registration behavior

`POST /api/user-registration` validates and normalizes input, looks up the email
through Prisma, checks Redis restrictions, increments a counter, and sends an
activation email. After SMTP acceptance it writes OTP and cooldown keys, then
returns 200. It does not create a user or persist the validated password.
Exact fields/responses are in the [API reference](../reference/api.md#registration).

Validation accepts an object only. Name is trimmed to 1–100 characters, email
is trimmed/lowercased and checked for basic format/254-character maximum, and
password must be a string of 8–128 characters. Seller validation exists in the
helper but has no route. Invalid input stops before infrastructure calls.

## OTP storage contract

The [ioredis client](../../packages/libs/redis/index.ts) is a direct module-level
instance. [auth.helper.ts](../../apps/auth-service/src/utils/auth.helper.ts) owns
the following keys using the normalized email:

| Key                         | Value / expiry                 | Current use                                              |
| --------------------------- | ------------------------------ | -------------------------------------------------------- |
| `otp_lock:<email>`          | Writer/TTL absent              | Read to reject a locked account; message says 30 minutes |
| `otp_spam_lock:<email>`     | `'locked'`, 3,600 seconds      | Set when the counter is already at least 2               |
| `otp_request_count:<email>` | Integer string, 3,600 seconds  | GET/SET increment; expiry refreshed each allowed update  |
| `otp_cooldown:<email>`      | `'true'`, 60 seconds           | Written after accepted mail and OTP storage              |
| `otp:<email>`               | Four-digit string, 300 seconds | Generated with `crypto.randomInt(1000, 10000)`           |

Restriction checks run in lock → spam lock → cooldown order. Helpers throw
`ValidationError`, so the controller stops on failure. Two counter increments
are allowed; a later request that passes cooldown checks sets the spam lock.
This is an expiry refreshed on updates, not a fixed calendar-hour quota.

The sequential GET/SET operations can race. Request count is increased before
SMTP, so a mail failure can still consume a request. A partial failure after
SMTP acceptance can leave an email without matching OTP/cooldown state.
No atomic admission, verification attempt counter, or single-use consumption
is implemented. Future behavior belongs in the
[Redis/runtime plan](../future-plans/architecture/redis-and-runtime-plan.md).

## Mail and runtime dependencies

Generate the Prisma client after installation/schema changes. Configure MongoDB,
Redis, and SMTP using [the configuration reference](../reference/configuration.md).
Importing the auth router brings in shared client modules; even a greeting-only
server startup is not fully isolated from infrastructure initialization.

The [mail client](../../apps/auth-service/src/mail/mail.client.ts) resolves
`templates/<name>.ejs` beside the bundle, renders with EJS, and sends through
Nodemailer. It throws on render/send failure, missing accepted recipients, or
any rejected recipient. SMTP acceptance does not guarantee inbox delivery.
The build copies templates to `dist/templates` and the schema to `dist/prisma`.
The current Dockerfile has no explicit Prisma-generation step; inspect the
[packaging limits](../operations/deployment.md#auth-docker-image) before using it.

## Remaining authentication work

`userVerification` is exported but unrouted. It reads required fields and looks
up an existing email, then stops: its `verifyOtp()` line is **commented out**.
There is no active undefined `verifyOtp` call. If mounted unchanged, its valid,
non-existing-user path would not send a success response.

OTP comparison, failed-code limits, single-use consumption, password hashing,
user creation, login, logout, and sessions remain unfinished. Resolve the
schema's required independent `imagesId` scalar before creating users; see
[database design](../architecture/database-design.md).

The [future structure plan](../future-plans/architecture/auth-service-structure-plan.md)
proposes separating app creation, validation, and OTP orchestration. Current code
still uses `routes/`, `controller/`, `utils/`, and `mail/`.
No auth unit-test files are present. See [testing](testing.md) for actual coverage
and [implementation status](../operations/implementation-status.md) for gaps.
