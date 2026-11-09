# Authentication development

[Documentation hub](../README.md) · [Registration & verification sequence diagrams](../architecture/request-flows.md#registration-and-otp-delivery)

**Status:** Source implementation, not a verified live integration.
**Auth backend and client reviewed:** 2026-11-06.
**Backend recovery updated:** 2026-11-08.

The Next.js client includes `/login` and `/sign-up` forms with a shared
`AuthCard`, shared `Input type="password"` eye/eye-off controls, and React Hook Form + Zod
validation (`loginSchema`, `signUpSchema`, `otpCodeSchema`, and `verifyOtpSchema`).
Login posts `{ email, password }` through `loginMutation` with cookies enabled,
shows a local server error on failure, and navigates to `/` on success. Its
remember-me checkbox does not change the request or fixed cookie lifetime.
The loading indicator uses React Hook Form's `isSubmitting` rather than mutation
pending state, and server errors are not cleared on retry. These remain limitations.
Sign-up collects name, email, password,
and password confirmation, posts validated details to `/api/user-registration`
via `registrationMutation`, and opens the `OtpInput` verification view on
success. Verification validates a four-digit code, combines it with the
submitted registration variables (normalizing email to lowercase via
`verifyOtpSchema` to match Redis OTP keys), posts to `/api/verify-registration`
via `verifyOtpMutation`, disables conflicting actions while pending or
succeeded, and redirects to `/login` on success. After a failed registration
request, **I received a code** opens OTP entry with the submitted details.
Resend reuses `/api/user-registration` with the submitted registration snapshot.
Success starts a 60-second wall-clock countdown and clears the entered code;
failure preserves it and shows a separate resend error. Server restriction metadata
resynchronizes the countdown, including another tab's cooldown or lockout.
Neither form logs credentials, Google
sign-in is disabled. The forgot-password link opens the connected recovery flow:
request an email code, verify it, enter and confirm a new password, then return to
sign-in from the success message. Requests have mutation pending guards, resend
cooldowns, server error feedback, and recovery after uncertain delivery.
There is no client session handling or cookie consumption yet. Use the
[client README](../../apps/client/README.md) for frontend setup.

## Current registration behavior

`POST /api/user-registration` validates and normalizes input, looks up the email
through Prisma, checks Redis locks, acquires cooldown with `SET NX`, increments
the request counter, and sends an activation email. After SMTP acceptance it
stores the code and refreshes cooldown, then
returns 200. It does not create a user or persist the validated password.
Exact fields/responses are in the [API reference](../reference/api.md#registration).

Validation accepts an object only. Name is trimmed to 1–100 characters, email
is trimmed/lowercased and checked for basic format/254-character maximum, and
password must be a string of 8–128 characters. Seller validation exists in the
helper but has no route. Invalid input stops before infrastructure calls.

## Current verification and account creation

`POST /api/verify-registration` completes user registration by validating the
submitted OTP, hashing credentials, and persisting the user in MongoDB:

1. **Payload validation:** Reuses registration's body, name, email, and password
   checks, including trimming and lowercase email normalization. OTP must be a four-digit string.
2. **Account existence check:** Queries MongoDB via
   `prisma.users.findUnique({ where: { email } })`. If an account already
   exists for that email, returns 400 with `'The user is already existed!'`.
3. **OTP verification (`verifyOtp`):** Validates the four-digit code against Redis,
   tracks failed attempts up to 3 tries, locks the account for 30 minutes on
   exceeded attempts. Matching codes remain available until account creation succeeds.
4. **Password hashing:** Hashes the plaintext password with `bcrypt.hash(password, 10)`
   using `bcryptjs`.
5. **Persistence:** Creates the new user in MongoDB via `prisma.users.create`
   with `name`, `email`, and `password: hashedPassword`.
6. **Cleanup and response:** Atomically deletes OTP/attempt keys only if the stored
   code still matches, then returns HTTP 200 `{ "success": true, "message": "User registered successfully!" }`.

`verifyOtp(email, otp)` throws validation errors; controllers forward them once.
Hashing or database failures leave the OTP available until its original expiry.
The database's unique email index prevents concurrent duplicate accounts; a
duplicate-key error becomes the existing-user validation response. A Redis cleanup
failure after account creation is logged without changing the successful response.

## Current login and cookie issuance

`POST /api/login` is routed to `loginUser`. It checks email/password presence,
queries the supplied email exactly, rejects a missing password hash, and uses
`bcrypt.compare` before signing JWTs. It does not normalize email or perform
string/length validation. An unknown user currently returns 400; a missing hash
or incorrect password returns 401. These responses differ rather than presenting
one generic credentials failure. See the [login contract](../reference/api.md#login-and-jwt-cookies).

Both tokens contain `{ id: user.id, role: 'user' }`. The access JWT is signed
with `JWT_ACCESS_TOKEN_SECRET` for 15 minutes; the refresh JWT uses
`JWT_REFRESH_TOKEN_SECRET` for 7 days. Set both secrets locally: `as string`
assertions are not runtime validation. Missing signing secrets reach the generic
500 error response.

[setCookies.ts](../../apps/auth-service/src/utils/cookies/setCookies.ts) sets
`access_token` and `refresh_token` with `httpOnly: true`, `secure: true`,
`sameSite: 'none'`, and a 7-day `maxAge` for both. The access JWT still expires
after 15 minutes even while its cookie is retained. The 200 body contains only
the login message and `{ id, email, name }`; it excludes tokens and password hash.
No session record or refresh-token state is persisted.

Cookie writing uses Express `res.cookie`; cookie-parser is not required for
writing and is not mounted for incoming requests. Browser callers need
credentials enabled, and the hard-coded Secure policy needs verification in
the intended HTTPS/browser deployment. Current code does not consume or verify
the emitted cookies, enforce protected routes, rotate refresh tokens, or log out.

## Password recovery

The backend exposes a request -> verify -> reset flow. Exact payloads and errors
are in the [API reference](../reference/api.md#password-recovery). The frontend
implements the flow on `/forgot-password`, keeping authorization only in component
memory until completion or restart. Password confirmation is checked before reset.

1. Request a code using `POST /api/forgot-password-user` with normalized email.
   Delivery uses `forgot-password-user-email.ejs` and returns a 60-second cooldown.
   Codes expire after five minutes and are separate from registration. Quota,
   cooldown, and lock keys remain shared. Unknown accounts still return a distinct
   error, and delivery timing is not equalized.
2. Verify the four-digit code with `POST /api/verify-forgot-password-user`.
   One Redis Lua script checks locks, counts wrong guesses, consumes the code,
   and creates a five-minute grant. Three wrong guesses set a 30-minute lock.
   Verification returns a random 256-bit `resetToken` with `Cache-Control: no-store`.
   Redis stores a single SHA-256 digest bound to the account ID and current password hash. A later
   verified code supersedes the previous grant for that email.
3. Submit the same email, token, and an 8-128 character `newPassword` to
   `POST /api/reset-password-user`. The handler hashes with bcrypt cost 10,
   atomically consumes the grant, clears recovery codes/attempts, and conditionally
   updates the account only if its original password hash still matches.
   Concurrent use, replay, expiry, wrong-account tokens, and older grants fail closed.
4. A best-effort email notifies the account owner after a successful write.
   Notification failure is logged without reporting the password change as failed.
   Sign in normally afterward; reset does not issue login cookies.

Hashing failure preserves the grant. Expiry or replacement during hashing prevents
password writes. Consumed grants are never restored, including after a database
failure; obtain a new code. A database timeout may have committed the change,
so try signing in before retrying recovery. Existing JWTs remain valid until
issued expiry; no session consumer or revocation store exists. No migration or
new environment variable is needed. Live delivery, Redis scripts, and MongoDB
writes still require integration verification.

## Swagger maintenance

Run `npm run auth-docs` after route or contract changes. The generator scans
`main.ts`, follows the `/api` router mount, and reads `#swagger` controller/router
annotations for required request fields and concrete request/200-response
examples. Recovery annotations describe expiring single-use reset authorization
and validation/failure responses. These contracts do not prove a live integration. Generation also
documents the greeting and excludes the Swagger UI/JSON routes.
Commit the generated JSON, restart auth, and reload `/api-docs`. Cookie headers
and detailed error/validation contracts remain outside the generated schemas.

## OTP storage contract

The [ioredis client](../../packages/libs/redis/index.ts) is a direct module-level
instance. [auth.helper.ts](../../apps/auth-service/src/utils/auth.helper.ts) owns
the following keys. All recovery endpoints normalize email. Registration uses the
original OTP keys; recovery shares restriction keys and uses separate code/attempt keys:

| Key                                   | Value / expiry                                   | Current use                                                       |
| ------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------- |
| `otp_lock:<email>`                    | `'locked'`, 1,800 seconds                        | Written on 3rd failed OTP verification attempt; blocks new OTP    |
| `otp_spam_lock:<email>`               | `'locked'`, 3,600 seconds                        | Set during OTP requests when counter is already at least 2        |
| `otp_request_count:<email>`           | Integer string, 3,600 seconds                    | `INCR` counter; expiry refreshed on each counted request          |
| `otp_cooldown:<email>`                | `'true'`; 60 seconds                             | Acquired with `SET NX` before SMTP; refreshed after code storage  |
| `otp:<email>`                         | Four-digit string, 300 seconds                   | Generated with `crypto.randomInt(1000, 10000)`; deleted on verify |
| `otp_attempts:<email>`                | Integer string, 300 seconds                      | Failed verification attempts counter; deleted on verify/lock      |
| `password_reset_otp:<email>`          | Four-digit string, 300 seconds                   | Recovery code only                                                |
| `password_reset_otp_attempts:<email>` | Integer string, 300 seconds                      | Atomic recovery failed-attempt counter                            |
| `password_reset_grant:<email>`        | Account/password-bound token digest; 300 seconds | Single-use reset grant                                            |

`checkOtpRestrictions` checks Redis readiness and lock → spam lock → cooldown.
`SET NX` acquires the cooldown atomically so concurrent clicks cannot both proceed.
`trackOtpRequests` uses `INCR` and refreshes the counter expiry. These are separate
commands rather than one Lua transaction. Two deliveries are allowed per counter
window, including initial delivery; a later request
that passes cooldown checks sets the spam lock. Counter expiry is refreshed on
admission rather than using a fixed calendar hour. Restrictions return 400 with
`details.retryAfterSeconds`; successful registration delivery returns
`retryAfterSeconds: 60` for the client countdown.

Registration verification validates the code format and inspects `otp:${email}`. If the key is
absent or expired, it throws `ValidationError('Expired or invalid OTP!')`.
On incorrect OTP entry, it reads
`otp_attempts:${email}`. When failed attempts reach 2 (the 3rd attempt), it
writes `otp_lock:${email}` with a 1,800-second (30-minute) TTL, deletes the OTP
and attempt keys, and returns a 30-minute lockout error. When fewer attempts have
failed, it increments `otp_attempts:${email}` (300-second TTL) and returns the
remaining attempts count. Account registration consumes the matching OTP and
attempt keys after persistence using `consumeOtp`; recovery consumes them after
validation. The atomic comparison prevents cleanup from deleting a newer code.

`sendOtp` now only coordinates restriction checks, counting, email, storage, and
error feedback. Reservation IDs and delivery Lua scripts were removed. Sending
must finish within the 60-second cooldown; ownership checks are needed if email
moves to slower/background jobs. Verification checks the lock before accepting
any code, including a code from a resend that overlapped the lock.
SMTP failure preserves the previous code until its original expiry but still
consumes quota/cooldown; delivery errors return 503 with the remaining wait when
available. Failed verification attempts are not reset by resend. Their updates
remain sequential and can race. SMTP and Redis cannot commit together; a timeout
can leave delivery/storage unconfirmed. Further consistency checks belong in the
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

With registration, verification, and login/token issuance present in source, the remaining authentication
capabilities include:

- Connect future recovery screens to the backend auth endpoints.
- Align login loading/error reset with mutation state, implement remember-me
  behavior if required, and add session-aware UI/current-user state.
- Consistent input validation/normalization and generic login credential failures.
- JWT verification middleware, protected routes, and current-user lookup.
- Refresh-token validation/rotation and persisted revocation policy.
- Align access-cookie retention with token expiry and verify browser/CSRF policy.
- Logout and session/token revocation.
- Complete and secure the routed password recovery/reset flow described above.
- Seller registration and onboarding routes.

The [future structure plan](../future-plans/architecture/auth-service-structure-plan.md)
proposes separating app creation, validation, and OTP orchestration. Current code
still uses `routes/`, `controller/`, `utils/`, and `mail/`.
Focused auth controller/helper regression tests are present but were not run for
this update. See [testing](testing.md) for actual coverage
and [implementation status](../operations/implementation-status.md) for gaps.
