# API reference

[Documentation hub](../README.md) · [Request flow diagrams](../architecture/request-flows.md)

**Status:** Current source contracts; runtime integrations unverified.
**Reviewed:** 2026-11-06.

## Available routes

The table below covers the Express backend. The Next.js client separately serves
`GET http://localhost:3000/api/hello`, returning plain text `Hello, from API!`
from [route.ts](../../apps/client/src/app/api/hello/route.ts). It is a scaffold
handler, excluded from auth Swagger, with no auth, database, or gateway wiring.
The client `/sign-up` form posts validated registration details to
`${NEXT_PUBLIC_API_URL}/api/user-registration`, opens OTP entry on success, and
posts `{ name, email, password, otp }` (with lowercase email normalization) to
`${NEXT_PUBLIC_API_URL}/api/verify-registration` before redirecting to `/login`.
The client login form posts `{ email, password }` to `/api/login` with
`withCredentials: true` and redirects to `/` on success. It does not store the
returned user projection. OTP resend stays disabled. Client-side
schemas and password confirmation are separate from these backend contracts.

| Method | Path                               | Handler            | Source-defined result                                              |
| ------ | ---------------------------------- | ------------------ | ------------------------------------------------------------------ |
| GET    | `/gateway-health`                  | Gateway, port 8080 | 200 `{ "message": "Welcome to api-gateway!" }`                     |
| GET    | `/`                                | Auth, port 6001    | 200 `{ "message": "Hello API" }`                                   |
| POST   | `/api/user-registration`           | Auth               | Request activation OTP; no account creation                        |
| POST   | `/api/verify-registration`         | Auth               | Verify OTP, hash password, and create user account                 |
| POST   | `/api/login`                       | Auth               | Check credentials; issue JWT cookies and return public user fields |
| POST   | `/api/forgot-password-user`        | Auth               | Send recovery OTP email and store OTP/cooldown state               |
| POST   | `/api/verify-forgot-password-user` | Auth               | Await OTP verification and consume the code; no reset proof issued |
| POST   | `/api/reset-password-user`         | Auth               | Disabled; always returns 503 without accessing accounts            |
| GET    | `/api-docs`                        | Auth               | Swagger UI; Express/Swagger may redirect to trailing slash         |
| GET    | `/docs-json`                       | Auth               | Committed Swagger 2.0 JSON                                         |

Gateway forwards other paths unchanged to `AUTH_SERVICE_URL`, default
`http://localhost:6001`. Thus gateway `/` serves the auth greeting, and
gateway `/api/user-registration`, `/api/verify-registration`, and `/api/login`
forward to auth unchanged, as do the three password-recovery routes.
Unmatched auth paths use Express's default 404.
Token refresh, logout, current-user lookup, protected routes, and commerce
remain unavailable.

## Registration

`POST http://localhost:6001/api/user-registration`

Send `Content-Type: application/json` and an object:

```json
{
  "name": "Example Customer",
  "email": "customer@example.com",
  "password": "example-password"
}
```

This example initiates real SMTP delivery when integrations are configured;
use your own test mailbox for an integration check.

| Field      | Current validation                                                     |
| ---------- | ---------------------------------------------------------------------- |
| Body       | Non-null object; arrays rejected                                       |
| `name`     | String, trimmed, 1–100 characters                                      |
| `email`    | String, trimmed/lowercased, basic email format, at most 254 characters |
| `password` | String, 8–128 characters; validated but not persisted                  |

The helper also supports seller phone/country validation, but no seller route is
mounted. Unknown body fields are not explicitly rejected; the controller only
uses the helper's returned name/email.

The controller queries the normalized email, rejects an existing user, checks
Redis restrictions, increments the OTP counter, sends an activation email, then
writes OTP/cooldown state. HTTP 200:

```json
{ "message": "OTP sent. Please check your account" }
```

Success means SMTP accepted the recipient and the Redis writes completed. It
does not guarantee inbox delivery or create a user/session. OTP restrictions
return **400**, including cooldown and request-count rejection; the gateway IP
limiter independently returns **429**. Prisma/Redis/rendering/SMTP errors reach
shared error middleware. Concurrent OTP operations and mail/Redis partial
failures remain unresolved; see [authentication development](../development/authentication.md).

## Registration verification and user creation

`POST http://localhost:6001/api/verify-registration`

Send `Content-Type: application/json` and an object:

```json
{
  "name": "Example Customer",
  "email": "customer@example.com",
  "otp": "1234",
  "password": "example-password"
}
```

| Field      | Current validation                                               |
| ---------- | ---------------------------------------------------------------- |
| `name`     | String; trimmed to 1–100 characters                              |
| `email`    | String; trimmed/lowercased, valid format, at most 254 characters |
| `otp`      | String containing exactly four digits                            |
| `password` | String containing 8–128 characters; preserved unchanged          |

The controller reuses registration validation and normalization. Invalid input
returns **400**; malformed OTPs are rejected before Redis access.

Next, it queries MongoDB via `prisma.users.findUnique({ where: { email } })`. If a
record exists with that email, it returns **400** with `'The user is already existed!'`.

### OTP verification flow (`verifyOtp`)

1. **Existence check:** Reads `otp:${email}` from Redis. If missing or expired
   (key has 300s TTL), returns **400** with `'Expired or invalid OTP!'`.
2. **Attempt tracking:** Reads `otp_attempts:${email}` (integer string, 300s TTL).
3. **Mismatch handling:**
   - If `storedOtp !== otp` and `failedAttempt >= 2` (3rd failed attempt),
     sets `otp_lock:${email}` with value `'locked'` and expiry 1,800s (30 minutes),
     deletes `otp:${email}` and `otp_attempts:${email}`, and returns **400** with:
     `'Too many failed attempts. Your account is locked for 30 minutes'`.
   - If `storedOtp !== otp` and `failedAttempt < 2`, increments `otp_attempts:${email}`
     with a 300-second TTL and returns **400** with:
     `'Incorrect OTP. ${2 - failedAttempt} attempts left'`.
4. **Success:** When the code matches, leaves it available until persistence succeeds.

### Persistence and response

After OTP verification succeeds:

- Hashes `password` using `bcrypt.hash(password, 10)`.
- Persists user to MongoDB via `prisma.users.create({ data: { name, email, password: hashedPassword } })`.
- Atomically consumes matching OTP/attempt keys after persistence. A newer code is preserved.
- Returns HTTP 200:

```json
{
  "success": true,
  "message": "User registered successfully!"
}
```

Hashing or database failures leave the code available until its original expiry.
Duplicate-key errors from concurrent account creation return the existing-user
validation response. Cleanup failure after persistence is logged without changing
the successful response. The OTP helper throws errors; controllers forward them once.

## Login and JWT cookies

`POST http://localhost:6001/api/login`

Send `Content-Type: application/json`:

```json
{
  "email": "customer@example.com",
  "password": "example-password"
}
```

The controller checks field truthiness, looks up the supplied email exactly with
`users.findUnique({ where: { email } })`, and compares the password with
`bcrypt.compare`. It does not normalize email or enforce input types/lengths.
Use the email stored at account creation. An absent parsed body can fail during
destructuring and reach the generic 500 handler rather than field validation.

| Condition                                          | Status | Message                            |
| -------------------------------------------------- | ------ | ---------------------------------- |
| Missing/falsy email or password in a parsed object | 400    | `Email and password are required!` |
| No user for the supplied email                     | 400    | `User doesn't exist`               |
| User has no password or comparison fails           | 401    | `Invalid email or password`        |
| Database, hashing, or JWT signing throws           | 500    | Generic shared error response      |

Application errors use `{ "status": "error", "message": "..." }`. The missing-user
and wrong-password cases currently have different status codes/messages.

On success, two JWTs carry `{ id: user.id, role: 'user' }`. The access token
expires in 15 minutes and uses `JWT_ACCESS_TOKEN_SECRET`; the refresh token
expires in 7 days and uses `JWT_REFRESH_TOKEN_SECRET`. Both secrets must be set;
the TypeScript `as string` assertions do not validate configuration at runtime.

HTTP 200 returns public user fields; token values are sent through `Set-Cookie`:

```json
{
  "message": "Login success",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "customer@example.com",
    "name": "Example Customer"
  }
}
```

| Cookie          | JWT expiry | Cookie settings                                       |
| --------------- | ---------- | ----------------------------------------------------- |
| `access_token`  | 15 minutes | `HttpOnly`, `Secure`, `SameSite=None`, 7-day `maxAge` |
| `refresh_token` | 7 days     | `HttpOnly`, `Secure`, `SameSite=None`, 7-day `maxAge` |

The [cookie helper](../../apps/auth-service/src/utils/cookies/setCookies.ts)
uses the same `604800000` ms lifetime for both cookies. Cookie retention does
not extend JWT validity. The helper has no development/environment override;
verify browser cookie acceptance in the intended HTTPS setup. Browser callers
need credentials enabled, for example `fetch(url, { credentials: 'include' })`.
No handler currently verifies these tokens, refreshes them, revokes them, or
clears the cookies. There is no persistent session/refresh-token store or
role lookup; `role: 'user'` is assigned by the controller.

## Password recovery (incomplete and unsafe)

These routes are mounted without authentication. Password reset always returns
503 without accessing accounts until single-use reset authorization is implemented.
The recovery OTP endpoints do not issue reset authorization; recovery remains incomplete.

All requests use `Content-Type: application/json`. Email is looked up unchanged;
these handlers do not reuse registration's normalization or type/length checks.
Missing parsed bodies can reach generic 500 handling during destructuring.

### Request a recovery OTP

`POST /api/forgot-password-user`

```json
{ "email": "customer@example.com" }
```

The helper checks email truthiness, looks up an existing user, applies the shared
OTP restrictions, increments the request counter, then calls `sendOtp`.
Missing email returns 400 `Email is required!`; unknown email returns 400
`user not found`. Restriction failures also return 400.

The helper calls `sendOtp(user.name, email, 'forgot-password-user-email')`.
The recovery EJS template renders escaped name/OTP values, password reset
instructions, a five-minute validity notice, and an unsolicited-request notice.
The shared sender still uses the subject `Verify your email`. After SMTP
acceptance it stores the OTP for 300 seconds and cooldown for 60 seconds.
Delivery failures still consume a request because counting precedes sending.
HTTP 200 after successful mail/Redis work:

```json
{ "message": "OTP sent successfully. Please check your account." }
```

### Submit a recovery OTP

`POST /api/verify-forgot-password-user`

```json
{ "email": "customer@example.com", "otp": "1234" }
```

The router invokes `verifyForgotPasswordOtp` directly. Missing/falsy fields return 400
`Email and otp are required!`. Otherwise the helper awaits `verifyOtp` and sends
the following only after successful verification:

```json
{ "message": "OTP verified. Password reset is not available yet." }
```

The message is reproduced exactly from source. On a match the shared helper
deletes OTP/attempt keys, but no reset token or authorization state is issued or
stored. OTP errors are thrown and forwarded once by the handler.
OTP keys have no purpose namespace: registration and
recovery use the same OTP, counters, cooldowns, and locks.

### Reset a password

`POST /api/reset-password-user`

```json
{ "email": "customer@example.com", "newPassword": "new-example-password" }
```

The handler always returns **503** without reading or updating an account:

```json
{
  "status": "error",
  "message": "Password reset is unavailable until secure verification is implemented."
}
```

Single-use reset authorization, password validation, and existing-token policy
must be implemented before enabling this endpoint.
See [recovery follow-ups](../development/authentication.md#password-recovery-blockers)
before attempting an integration check.

## Gateway policy

| Concern          | Current source                                                                    |
| ---------------- | --------------------------------------------------------------------------------- |
| Middleware order | CORS → Morgan → local health → IP limiter → body-reading proxy → shared errors    |
| Local health     | Runs before limiter; does not call auth or check dependencies                     |
| IP quota         | 100 requests per 15 minutes; in-memory default store and IPv4/IPv6 key handling   |
| Limit response   | 429 `{ "error": "Too many requests, please try again later" }`                    |
| Rate headers     | Standard draft-8 headers enabled; legacy headers disabled                         |
| Proxy            | Path preserved, 16 KB body limit, ten-second upstream timeout                     |
| Identity         | No session/auth middleware; no `trust proxy` setting                              |
| Failure policy   | Proxy errors forwarded to shared middleware; no explicit retry or 502/504 mapping |

Both services permit credentialed CORS for `http://localhost:3000` and allow
`Authorization` / `Content-Type` request headers. CORS can finish preflight
requests before later handlers; it does not authenticate callers. Direct auth
access has no gateway IP quota. Neither app mounts cookie-parser.

## Errors and unavailable routes

### Shared error handler (auth service)

Both apps use [the same middleware](../../packages/error-handler/error-middleware.ts).
Its branches, in order:

| Error                  | Status           | JSON                                                                         |
| ---------------------- | ---------------- | ---------------------------------------------------------------------------- |
| Headers already sent   | Delegated        | Calls `next(error)`                                                          |
| `error.status === 400` | 400              | `{ "status": "error", "message": "Invalid request body" }`                   |
| `error.status === 413` | 413              | `{ "status": "error", "message": "Request body too large" }`                 |
| `AppError`             | Its `statusCode` | `{ "status": "error", "message": "..." }`, plus truthy `details` if supplied |
| Other error            | 500              | `{ "error": "Something went wrong please try again" }`                       |

The status check catches JSON parse/size errors before the application-error
branch. Application messages and details are returned unchanged; callers must
keep them safe for public output. No stack is returned. The gateway limiter and
Express default 404 responses do not follow the `AppError` envelope.
Class definitions are in [technical design](../architecture/technical-design.md#shared-error-handler-current-source).

## Swagger coverage

[swagger-output.json](../../apps/auth-service/src/swagger-output.json) declares
Swagger 2.0, host `localhost:6001`, and documents all six auth POST routes. Active
routes include required request fields, JSON examples, and 200 response schemas.
Recovery OTP routes describe 400/500 responses and shared OTP state; disabled
reset documents only its 503 response and the required authorization follow-up.
`GET /` also has a greeting
response example. It does not capture cookie response headers or the full
validation/error contract above. Swagger's host is fixed, even when the UI is
accessed through the gateway or a custom port.

[swagger.js](../../apps/auth-service/src/swagger.js) is a generator script wired
to the root npm script `npm run auth-docs`. It scans `main.ts` so mounted router
prefixes such as `/api` are included automatically. Request and response examples
come from `#swagger` comments in the auth controllers and router; update these alongside
contract changes. The Swagger UI and JSON endpoints are excluded from generation.
The generated JSON is committed and loaded by auth at startup. Run
`npm run auth-docs` after changing routes or annotations, then restart the auth
service and reload `/api-docs` to see the updated document.

Generation parses source without starting Express or connecting to
MongoDB/Redis/SMTP. A failed generation sets an unsuccessful process exit code.

The [proposed product API](../future-plans/api/product-api.md) owns all draft
`/v1` paths and future error-envelope ideas. They are not available routes.
