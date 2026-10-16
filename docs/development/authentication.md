# Authentication development

[Documentation index](../README.md)

Source snapshot: **2026-10-17**, branch `feat/auth-controller`, including its
uncommitted and untracked changes relative to local `develop`.

## Current implementation

The [controller](../../apps/auth-service/src/controller/auth.controller.ts) now
lives under `src/controller/`, replacing the earlier empty controller outside
`src`. `userRegistration` validates input, attempts a unique-user lookup by email,
passes a `ValidationError` to Express for an existing user, and calls the OTP
restriction helper. It does not create a user, send an OTP, or return a success
response.

The [helpers](../../apps/auth-service/src/utils/auth.helper.ts) currently provide:

| Helper                     | Current behavior                                                                                                                                                                                                       |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `validateRegistrationData` | Requires name, email, password; sellers also require phone_number and country. Throws for missing fields or a failed email regex. Input is still typed as `any`; password policy and field-type validation are absent. |
| `checkOtpRestrictions`     | Returns `null`; no Redis lookup, cooldown, expiry, or attempt restriction.                                                                                                                                             |
| `sendOtp`                  | Generates a local numeric string with `crypto.randomInt(1000, 9999)` (upper bound excluded). Does not return, store, or deliver it.                                                                                    |

The [auth entry point](../../apps/auth-service/src/main.ts) does not import or
register the controller and has no JSON body parser. Only `GET /` is exposed;
there is no registration endpoint to call yet.

## Shared clients and dependencies

[Prisma wrapper](../../packages/libs/prisma/index.ts) creates a client and reuses
`globalThis.prismadb` during development. Production creates a module-local
instance. The [libs barrel](../../packages/libs/index.ts) exposes named `prisma`,
and `packages/index.ts` re-exports it. The controller currently uses the direct
default import `@microservice-eshop/libs/prisma`.

The shared alias maps `@microservice-eshop/*` to `packages/*/index.ts`, so that
nested path resolves to `packages/libs/prisma/index.ts`. `@microservice-eshop/libs`
instead uses the barrel and requires a named import. These are source aliases,
not independently published packages.

Root dependencies now explicitly include `dotenv`, `ioredis`, `nodemailer`, and
`ejs`, with lockfile updates. The [Redis module](../../packages/libs/redis/index.ts)
is empty and is not exported. No Redis connection, mail transport, template,
SMTP settings, or OTP persistence is implemented. Do not infer environment
variable names for those integrations from installed dependencies.

## Blockers before wiring registration

1. Align the Prisma wrapper with the schema generator. The schema uses
   `prisma-client` with output `generated/prisma`, while the wrapper imports
   `@prisma/client`. The locally installed default client is a placeholder typed
   as `any`, which hides model autocomplete and query errors. Generate the
   configured client and use its entry point; account for generated source in
   the shared project's `rootDir`/references and application bundling. A direct
   import outside `packages/` needs compiler ownership changes.
2. Change the lookup from `findUnique({ where: email })` to
   `findUnique({ where: { email } })`. The current code supplies a string where
   a unique-filter object is expected.
3. Complete restriction checks and OTP delivery/storage before exposing the flow.
   Add request types, field validation, deliberate error propagation, and an
   explicit success response. Wire JSON parsing and the chosen route in auth.
4. Resolve unused `name` and `otp` values as their behavior is implemented.
   The configured TypeScript build currently reports TS6133 for both.

## Configuration and verification

Use the root `.env` and placeholder connection string in
[database setup](getting-started.md#prisma-and-mongodb). Prisma CLI loads dotenv;
the application entry point still does not explicitly load it. A service-local
`.env` is not evidence that runtime receives `DATABASE_URL`. URL-encode password
characters (for example `@` becomes `%40`) without encoding URI separators.
Keep credentials out of tracked files.

Verification for this snapshot:

- `node node_modules/typescript/bin/tsc -b packages/tsconfig.lib.json apps/auth-service/tsconfig.app.json --pretty false`
  failed with the two TS6133 diagnostics above; the shared project compiled.
- No Prisma generation, database synchronization, MongoDB/Redis requests, email
  delivery, application startup, lint, Nx builds, automated tests, or Docker
  validation was performed. Generated declarations do not establish working
  Prisma model types when the imported client is `any`.

Future behavior tests should cover missing/invalid fields, duplicate email,
OTP cooldown and expiry, delivery failures, and a complete HTTP response. The
existing root smoke test does not exercise this controller.
