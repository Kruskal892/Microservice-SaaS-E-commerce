# API reference

[Documentation hub](../README.md) · [Request flow diagrams](../architecture/request-flows.md)

**Status:** Current source contracts; runtime integrations unverified.
**Reviewed:** 2026-10-21.

## Available routes

| Method | Path                       | Handler            | Source-defined result                                      |
| ------ | -------------------------- | ------------------ | ---------------------------------------------------------- |
| GET    | `/gateway-health`          | Gateway, port 8080 | 200 `{ "message": "Welcome to api-gateway!" }`             |
| GET    | `/`                        | Auth, port 6001    | 200 `{ "message": "Hello API" }`                           |
| POST   | `/api/user-registration`   | Auth               | Request activation OTP; no account creation                |
| POST   | `/api/verify-registration` | Auth               | Verify OTP, hash password, and create user account         |
| GET    | `/api-docs`                | Auth               | Swagger UI; Express/Swagger may redirect to trailing slash |
| GET    | `/docs-json`               | Auth               | Committed Swagger 2.0 JSON                                 |

Gateway forwards other paths unchanged to `AUTH_SERVICE_URL`, default
`http://localhost:6001`. Thus gateway `/` serves the auth greeting, and
gateway `/api/user-registration` and `/api/verify-registration` forward
registration and verification. Unmatched auth paths use Express's default 404.
Login, sessions, and commerce remain unavailable.

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

| Field      | Current validation                                                            |
| ---------- | ----------------------------------------------------------------------------- |
| `name`     | Required non-empty field (`!name` returns 400 `ValidationError`)              |
| `email`    | Required non-empty field (`!email` returns 400 `ValidationError`)             |
| `otp`      | Required non-empty field (`!otp` returns 400 `ValidationError`)               |
| `password` | Required non-empty field (`!password` returns 400 `ValidationError`)          |

The controller checks that `email`, `otp`, `password`, and `name` are all present.
If any field is missing, it returns **400** with `'All fields are required!'`.

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
4. **Success:** When the code matches, deletes `otp:${email}` and `otp_attempts:${email}`.

### Persistence and response

After OTP verification succeeds:
- Hashes `password` using `bcrypt.hash(password, 10)`.
- Persists user to MongoDB via `prisma.users.create({ data: { name, email, password: hashedPassword } })`.
- Returns HTTP 200:

```json
{
  "success": true,
  "message": "User registered successfully!"
}
```

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
Swagger 2.0, host `localhost:6001`, and documents `/api/user-registration` and
`/api/verify-registration` with 200 responses. It does not capture the full
validation/error contract above. Swagger's host is fixed, even when the UI is
accessed through the gateway or a custom port.

[swagger.js](../../apps/auth-service/src/swagger.js) is a generator script wired
to the root npm script `npm run auth-docs`. The generated JSON is committed and loaded
by auth at startup. Keep it aligned when implemented contracts change.

The [proposed product API](../future-plans/api/product-api.md) owns all draft
`/v1` paths and future error-envelope ideas. They are not available routes.
