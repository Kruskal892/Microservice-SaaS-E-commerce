# Request and authentication flows

[Documentation hub](../README.md) · [API reference](../reference/api.md)

**Status:** Current source execution paths. **Reviewed:** 2026-10-25.
These diagrams explain code behavior, not a successful end-to-end run.

These are backend execution paths. The Next.js client currently renders its
header with the shared search input and placeholder page with [Tailwind tokens](../reference/design-tokens.md).
It does not initiate these auth/commerce flows. Its local `/api/hello` text route
is independent of the gateway and is described in the [API reference](../reference/api.md).

## Gateway request lifecycle

Source: [gateway main.ts](../../apps/api-gateway/src/main.ts).

```mermaid
flowchart TD
    Request["Incoming HTTP request"] --> CORS["CORS<br/>May finish preflight requests"]
    CORS --> Morgan["Morgan request logging"]
    Morgan --> Health{"GET /gateway-health?"}
    Health -->|Yes| Local["200 gateway JSON<br/>No upstream or quota check"]
    Health -->|No| Limiter{"Within IP quota?<br/>100 requests / 15 minutes"}
    Limiter -->|No| Limited["429 limiter JSON"]
    Limiter -->|Yes| Proxy["Read/proxy body up to 16 KB<br/>Upstream timeout: 10 seconds"]
    Proxy --> Auth["AUTH_SERVICE_URL<br/>Default localhost:6001<br/>Path preserved"]
    Auth --> Reply["Forward upstream response"]
    Proxy -->|Error| Handler["Shared error middleware"]
```

CORS permits the configured browser origin; it does not establish identity.
The limiter is per process and proxy trust is disabled. Gateway error handling
does not implement a dedicated 502/504 policy. Direct auth requests bypass the
gateway quota. See [configuration](../reference/configuration.md).

## Auth request routing

Source: [auth main.ts](../../apps/auth-service/src/main.ts) and
[router](../../apps/auth-service/src/routes/auth.router.ts).

```mermaid
flowchart TD
    Request["Incoming auth request"] --> CORS["CORS"]
    CORS --> Root{"GET /?"}
    Root -->|Yes| Greeting["200 Hello API"]
    Root -->|No| JSON["express.json<br/>16 KB limit"]
    JSON --> Route{"Matched route?"}
    Route -->|"/api-docs or GET /docs-json"| Swagger["Swagger UI or committed JSON"]
    Route -->|"POST /api/user-registration"| Registration["Registration controller"]
    Route -->|"POST /api/verify-registration"| Verification["Verification controller"]
    Route -->|"POST /api/login"| Login["Login controller<br/>bcrypt, JWT signing, cookies"]
    Route -->|"POST /api/forgot-password-user"| Forgot["Recovery helper<br/>Recovery email and OTP storage"]
    Route -->|"POST /api/verify-forgot-password-user"| RecoveryOTP["OTP helper directly<br/>Await verification; no reset proof"]
    Route -->|"POST /api/reset-password-user"| Reset["Reset controller<br/>No verification proof required"]
    Route -->|No| Missing["Express default 404"]
    JSON -->|Parse or size error| Errors["Shared error middleware"]
    Registration -->|Error forwarded| Errors
    Verification -->|Error forwarded| Errors
    Login -->|Error forwarded| Errors
    Forgot -->|Error forwarded| Errors
    RecoveryOTP -->|Error forwarded| Errors
    Reset -->|Error forwarded| Errors
```

Auth mounts registration, registration verification, login, and three recovery
POST routes. Recovery is incomplete and unsafe. Refresh, logout, current-user, protected, and commerce routes
are not implemented. CORS and issuing cookies do not authenticate later requests.

## Registration and OTP delivery

Sources: [controller](../../apps/auth-service/src/controller/auth.controller.ts),
[helpers](../../apps/auth-service/src/utils/auth.helper.ts), and
[mail client](../../apps/auth-service/src/mail/mail.client.ts).

```mermaid
sequenceDiagram
    autonumber
    participant Client
    participant Auth as Registration controller
    participant DB as Prisma / MongoDB
    participant Redis
    participant Mail as EJS / SMTP
    Client->>Auth: POST /api/user-registration (name, email, password)
    Auth->>Auth: Validate body, trim name, normalize email
    Auth->>DB: users.findUnique(normalized email)
    DB-->>Auth: Existing user or null
    alt Existing user
        Auth-->>Client: 400 validation error, stop
    else No existing user
        Auth->>Redis: GET lock, spam lock, cooldown (sequential)
        Redis-->>Auth: Restriction values
        alt Restriction exists
            Auth-->>Client: 400 validation error, stop
        else Not restricted
            Auth->>Redis: GET request counter
            Redis-->>Auth: Current count
            alt Count is already at least 2
                Auth->>Redis: SET spam lock EX 3600
                Auth-->>Client: 400 request-limit error, stop
            else Count below 2
                Auth->>Redis: SET incremented counter EX 3600
                Auth->>Auth: Generate four-digit OTP
                Auth->>Mail: Render activation template and send email
                Mail-->>Auth: SMTP accepted recipient
                Auth->>Redis: SET OTP EX 300
                Auth->>Redis: SET cooldown EX 60
                Auth-->>Client: 200 OTP sent message
            end
        end
    end
```

Invalid input stops before the database lookup. Exceptions from Prisma, Redis,
rendering, or SMTP go through the controller's catch to shared error middleware.
SMTP rejection prevents OTP writes, but the request count has already increased.
SMTP can accept the email before a later Redis write fails; SMTP acceptance also
does not guarantee inbox delivery. The sequential checks/updates are not atomic.

This endpoint does not create a user, store a password, verify a code, or issue a
session. See [authentication development](../development/authentication.md) for
key names, TTLs, and implementation gaps.

## Registration verification and account creation

Sources: [controller](../../apps/auth-service/src/controller/auth.controller.ts),
[helpers](../../apps/auth-service/src/utils/auth.helper.ts), and
[prisma client](../../packages/libs/prisma/index.ts).

```mermaid
sequenceDiagram
    autonumber
    participant Client
    participant Auth as Verification controller
    participant DB as Prisma / MongoDB
    participant Redis
    Client->>Auth: POST /api/verify-registration (name, email, otp, password)
    Auth->>Auth: Validate required fields (name, email, otp, password)
    alt Any missing field
        Auth-->>Client: 400 validation error (All fields are required!)
    else All fields present
        Auth->>DB: users.findUnique(email)
        DB-->>Auth: Existing user or null
        alt Existing user
            Auth-->>Client: 400 validation error (The user is already existed!)
        else No existing user
            Auth->>Redis: GET otp:email
            Redis-->>Auth: Stored OTP or null
            alt Stored OTP absent or expired
                Auth-->>Client: 400 validation error (Expired or invalid OTP!)
            else Stored OTP present
                Auth->>Redis: GET otp_attempts:email
                Redis-->>Auth: Failed attempt count (default 0)
                alt Stored OTP does not match
                    alt Failed attempt count >= 2 (3rd failed attempt)
                        Auth->>Redis: SET otp_lock:email "locked" EX 1800
                        Auth->>Redis: DEL otp:email, otp_attempts:email
                        Auth-->>Client: 400 validation error (Account locked for 30 minutes)
                    else Failed attempt count < 2
                        Auth->>Redis: SET otp_attempts:email (count + 1) EX 300
                        Auth-->>Client: 400 validation error (Incorrect OTP. N attempts left)
                    end
                else Stored OTP matches
                    Auth->>Redis: DEL otp:email, otp_attempts:email
                    Auth->>Auth: bcrypt.hash(password, 10)
                    Auth->>DB: users.create({ name, email, password })
                    DB-->>Auth: User record created
                    Auth-->>Client: 200 User registered successfully!
                end
            end
        end
    end
```

Missing fields and existing users are forwarded with `return next(error)`.
For missing/expired/mismatched OTPs, `verifyOtp` calls `next(ValidationError)`
and then throws the return value; it still stops before account creation, but
this Express-dependent error contract needs cleanup. On match,
the OTP is deleted from Redis (single-use consumption), the password is
hashed with `bcryptjs` (10 rounds), and the user record is written to MongoDB.

## Login and JWT issuance

Sources: [controller](../../apps/auth-service/src/controller/auth.controller.ts)
and [cookie helper](../../apps/auth-service/src/utils/cookies/setCookies.ts).

```mermaid
sequenceDiagram
    autonumber
    participant Client
    participant Auth as Login controller
    participant DB as Prisma / MongoDB
    Client->>Auth: POST /api/login (email, password)
    Auth->>Auth: Check email and password presence
    alt Missing or falsy field in parsed body
        Auth-->>Client: 400 Email and password are required!
    else Fields present
        Auth->>DB: users.findUnique(email unchanged)
        DB-->>Auth: User or null
        alt User absent
            Auth-->>Client: 400 User doesn't exist
        else Password hash absent
            Auth-->>Client: 401 Invalid email or password
        else Password hash present
            Auth->>Auth: bcrypt.compare(password, user.password)
            alt Password does not match
                Auth-->>Client: 401 Invalid email or password
            else Password matches
                Auth->>Auth: Sign access JWT (15m) and refresh JWT (7d)
                Auth->>Auth: Set access_token and refresh_token cookies
                Auth-->>Client: 200 Login success with public user fields
            end
        end
    end
```

Both JWTs contain user ID and fixed `role: 'user'`; each uses its own environment
signing secret. Both cookies use HttpOnly, Secure, SameSite=None, and a 7-day
cookie lifetime. A retained access cookie does not extend the JWT's 15-minute
expiry. No token verification, refresh, logout, or persistent session store
consumes them yet. Unexpected errors, including absent-body destructuring or
missing signing secrets, are forwarded to shared error handling. See the
[API contract](../reference/api.md#login-and-jwt-cookies) for exact responses.

## Password recovery execution paths

Sources: [router](../../apps/auth-service/src/routes/auth.router.ts),
[controller](../../apps/auth-service/src/controller/auth.controller.ts), and
[helpers](../../apps/auth-service/src/utils/auth.helper.ts).

These are independent public endpoints. The diagram shows current defects;
it does not imply an enforced request → verify → reset sequence.

```mermaid
flowchart TD
    Request["POST /api/forgot-password-user<br/>email"] --> Lookup["Check email presence and existing user<br/>Shared OTP limits and request counter"]
    Lookup --> Mail["Render recovery template and send email<br/>Then store OTP EX 300 and cooldown EX 60"]
    Verify["POST /api/verify-forgot-password-user<br/>email, otp"] --> Presence["Check field presence"]
    Presence --> Launch["Await verifyOtp<br/>Validate and consume Redis OTP"]
    Launch -->|Success| Verified["200 verified<br/>No reset authorization issued"]
    Launch -->|Failure| Error["Forward error; no success response"]
    Reset["POST /api/reset-password-user<br/>email, newPassword"] --> User["Check fields and user<br/>Reject same password"]
    User --> Hash["bcrypt hash and Prisma update<br/>No OTP, token, or session check"]
    Hash --> Done["200 Password reset successfully<br/>Existing JWTs not revoked"]
```

The recovery template uses the same responsive layout as activation mail and
displays escaped name/OTP values with a five-minute expiry notice. The request
counter increases before sending, so delivery failures still consume quota.
Registration and recovery share the same unscoped OTP state. See the
[API reference](../reference/api.md#password-recovery-incomplete-and-unsafe)
for exact responses and [recovery blockers](../development/authentication.md#password-recovery-blockers)
for required follow-up work.

## Shared error path

Source: [error-middleware.ts](../../packages/error-handler/error-middleware.ts).

```mermaid
flowchart TD
    Error["next(error)"] --> Sent{"Headers already sent?"}
    Sent -->|Yes| Delegate["Delegate to next(error)"]
    Sent -->|No| Parser{"error.status is 400 or 413?"}
    Parser -->|Yes| Body["Sanitized body-error JSON<br/>400 or 413"]
    Parser -->|No| Known{"instanceof AppError?"}
    Known -->|Yes| Application["error.statusCode<br/>status, message, truthy details"]
    Known -->|No| Unexpected["500 generic error JSON"]
```

The parser-status check precedes `AppError` handling. Unmatched routes use
Express's default 404, and gateway quota rejection has its own envelope.
The [API reference](../reference/api.md#shared-error-handler-auth-service)
owns exact response formats.
