# API reference

[Documentation hub](../README.md) · [Request flow diagrams](../architecture/request-flows.md)

**Status:** Current source contracts; runtime integrations unverified.
**Reviewed:** 2026-11-10 (refresh and middleware); other contracts retain their source baseline.

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
returned user projection. OTP resend reuses `/api/user-registration` with the
submitted details after its countdown. Client-side
schemas and password confirmation are separate from these backend contracts.

| Method | Path                               | Handler            | Source-defined result                                              |
| ------ | ---------------------------------- | ------------------ | ------------------------------------------------------------------ |
| GET    | `/gateway-health`                  | Gateway, port 8080 | 200 `{ "message": "Welcome to api-gateway!" }`                     |
| GET    | `/`                                | Auth, port 6001    | 200 `{ "message": "Hello API" }`                                   |
| POST   | `/api/user-registration`           | Auth               | Request activation OTP; no account creation                        |
| POST   | `/api/verify-registration`         | Auth               | Verify OTP, hash password, and create user account                 |
| POST   | `/api/login`                       | Auth               | Check credentials; issue JWT cookies and return public user fields |
| POST   | `/api/forgot-password-user`        | Auth               | Send recovery OTP email and store OTP/cooldown state               |
| POST   | `/api/verify-forgot-password-user` | Auth               | Verify recovery OTP and issue a five-minute single-use reset token |
| POST   | `/api/reset-password-user`         | Auth               | Consume reset token and conditionally update the verified password |
| POST   | `/api/refresh-token`               | Auth               | Validate refresh cookie; set access cookie; 201                    |
| GET    | `/api-docs`                        | Auth               | Swagger UI; Express/Swagger may redirect to trailing slash         |
| GET    | `/docs-json`                       | Auth               | Committed Swagger 2.0 JSON                                         |

Gateway forwards other paths unchanged to `AUTH_SERVICE_URL`, default
`http://localhost:6001`. Thus gateway `/` serves the auth greeting, and
gateway `/api/user-registration`, `/api/verify-registration`, and `/api/login`
forward to auth unchanged, as do `/api/refresh-token` and the three password-recovery routes.
Unmatched auth paths use Express's default 404.
Logout, current-user lookup, protected routes, and commerce remain unavailable.
Shared access-token middleware exists but is not mounted on production routes.

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

The same endpoint handles initial delivery and resend. The controller queries the
normalized email and rejects existing users. `sendOtp` checks Redis locks, acquires
cooldown with `SET NX`, and counts requests with `INCR` before sending an activation
email. After SMTP acceptance it stores the code and refreshes cooldown. Sending
must finish within the 60-second cooldown. HTTP 200:

```json
{ "message": "OTP sent. Please check your account", "retryAfterSeconds": 60 }
```

Success means SMTP accepted the recipient and the Redis writes completed. It
does not guarantee inbox delivery or create a user/session. OTP restrictions
return **400**, including cooldown and request-count rejection, with
`details.retryAfterSeconds` containing the remaining wait. The client uses that
value to resynchronize its countdown. Initial delivery and resend share a
two-admission counter window. Failed delivery still consumes quota/cooldown and
returns **503** with the remaining wait when available; an SMTP failure preserves
the previous code. Storage timeouts may be ambiguous. Resend preserves failed
verification attempts. The gateway IP limiter independently returns **429**.
Redis unavailability returns 503 before admission; unexpected database/Redis
errors use shared middleware. See [authentication development](../development/authentication.md).

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
The refresh endpoint below verifies the refresh cookie and replaces the access
cookie. Shared middleware can verify access tokens but has no production route
consumer. There is no persistent session/refresh-token store, logout, revocation,
or role lookup; login assigns `role: 'user'`.

## Access-token refresh

`POST http://localhost:6001/api/refresh-token` (also forwarded by the gateway).
Send the existing `refresh_token` cookie; no JSON body is required. Access tokens
and Authorization headers are not accepted as refresh-token input. Browser
callers must enable credentials and satisfy the configured CORS/cookie policy.

The handler verifies the refresh JWT, requires truthy `id`/`role` claims, checks
that the user still exists, and signs a new 15-minute access JWT using those
claims. It sets `access_token` through the existing cookie helper and returns:

```json
{ "message": "Access token refreshed successfully", "success": true }
```

| Scenario                                        | Status | Response                                         |
| ----------------------------------------------- | ------ | ------------------------------------------------ |
| Valid refresh token and existing user           | 201    | Success body above; `access_token` Set-Cookie    |
| Missing refresh cookie                          | 401    | `Unauthorized: Refresh token is missing`         |
| Invalid, expired, or not-yet-active JWT         | 401    | `Unauthorized: Invalid or expired refresh token` |
| Missing truthy ID or role                       | 401    | `Unauthorized: Invalid refresh token`            |
| User no longer exists                           | 401    | `Unauthorized: User not found`                   |
| Database, JWT configuration, or signing failure | 500    | Generic shared error response                    |

401 responses use `{ "status": "error", "message": "..." }`. The access cookie
has HttpOnly/Secure/SameSite=None and seven-day retention; its JWT still expires
after 15 minutes. The refresh cookie and original seven-day JWT expiry are
unchanged. No token is returned in JSON, and there is no rotation, revocation,
logout, or frontend automatic refresh. Existing refresh JWTs survive password reset.

## Password recovery

All three endpoints are public and accept JSON objects. Email is trimmed,
lowercased, checked for basic format, and limited to 254 characters. Invalid
bodies, emails, codes, passwords, and tokens return 400. Use HTTPS and keep
reset tokens out of URLs and logs.

### Request a recovery OTP

`POST /api/forgot-password-user`

```json
{ "email": "customer@example.com" }
```

The helper looks up normalized email. Unknown users currently return 400
`user not found`, so account enumeration remains a limitation. It applies shared
registration/recovery locks, a 60-second cooldown, and a two-request quota, then
sends the recovery email. Failed delivery still consumes quota. Recovery OTPs
use `password_reset_otp:<email>` and expire after five minutes. Registration
codes cannot authorize password reset. HTTP 200:

```json
{
  "message": "OTP sent successfully. Please check your account.",
  "retryAfterSeconds": 60
}
```

### Submit a recovery OTP

`POST /api/verify-forgot-password-user`

```json
{ "email": "customer@example.com", "otp": "1234" }
```

A Redis script atomically checks the shared lock and recovery code, counts wrong
attempts, consumes a matching OTP, and stores a five-minute reset grant. The third
wrong attempt removes the recovery code and sets a 30-minute lock. Registration
OTP keys are never read by this path. HTTP 200 uses `Cache-Control: no-store`:

```json
{
  "message": "OTP verified. You can now reset your password.",
  "resetToken": "<64 lowercase hexadecimal characters>",
  "expiresInSeconds": 300
}
```

The token contains 32 cryptographically random bytes. Redis stores a single
SHA-256 digest bound to the account ID and current password hash under
`password_reset_grant:<email>`. A new verified code replaces the previous grant
for that email. Replayed, expired, incorrect, or locked codes return 400.

### Reset a password

`POST /api/reset-password-user`

```json
{
  "email": "customer@example.com",
  "resetToken": "<token returned by recovery verification>",
  "newPassword": "new-example-password"
}
```

The replacement password must contain 8-128 characters, matching registration.
The handler looks up the normalized email and recomputes the account/password-bound
digest. It checks the stored digest, hashes the password with bcrypt
(cost 10), then atomically consumes the matching grant and clears outstanding
recovery code/attempt keys. A conditional MongoDB update matches the verified
user ID, normalized email, and original password hash. An older grant cannot
overwrite a newer password change. Missing, expired, wrong-account, consumed,
or superseded authorization returns 400. HTTP 200:

```json
{
  "message": "Password reset successfully. Please sign in with your new password."
}
```

A password-change notification is attempted after the write; notification failure
is logged without changing the successful response. There is no automatic login.
Redis/hash/database failures reach generic 500 handling. If a database failure
occurs after grant consumption, the grant is not restored: request a new code.
A database timeout may have committed; try signing in before retrying recovery.
Existing JWTs are not revoked and retain their issued expiry; session enforcement
is not implemented elsewhere in this repository. The frontend connects the flow
on `/forgot-password`; browser and live Redis, MongoDB, and SMTP behavior remain unverified.

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
access has no gateway IP quota. Auth mounts `cookieParser()` after the 16 KB
JSON parser and before Swagger/routes; the gateway forwards cookies without parsing them.

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
Swagger 2.0, host `localhost:6001`, and documents all seven auth POST routes.
JSON-body routes include required request fields, examples, and 200 responses.
Refresh documents cookie input, a 201 response, and 401/500 errors.
Recovery routes describe validation, purpose-specific OTPs, single-use reset authorization,
and 200/400/500 responses; delivery also documents 503 failures.
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
