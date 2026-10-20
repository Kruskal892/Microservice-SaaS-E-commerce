# Auth-service folder structure plan

[Documentation index](../README.md) · [Current authentication flow](../development/authentication.md)

**Date:** 2026-10-20. **Status:** Proposed refactor; these moves have not been made.
This plan reorganizes existing ownership without changing public endpoints.
Advanced Redis and port configuration are deferred; see the
[Redis and runtime plan](redis-and-runtime-plan.md).

## Goal and boundaries

Keep the existing Nx applications and one shared `packages/` workspace. Auth owns
registration, OTP policy, identity, and activation email presentation. The gateway
owns public routing, trusted proxies, and its traffic limits. Errors and database clients keep their existing owners. HTTP lifecycle is
[deferred](http-lifecycle-plan.md); there is no shared HTTP module currently.
Keep environment reads local and use the existing PORT convention.

The current issue is mixed responsibilities: `main.ts` builds and starts Express,
`auth.helper.ts` combines validation with Redis policy and mail orchestration, and
the controller performs database access. Adding directories alone will not solve
those responsibilities. Move them in small, behavior-preserving steps.

## Proposed target

```text
apps/auth-service/
|-- package.json                 # App dependencies, Nx build/assets targets
|-- Dockerfile
|-- jest.config.cts
`-- src/
    |-- main.ts                  # Start Express directly; keep bootstrap small
    |-- app.ts                   # Create Express app; CORS, parsing, routes, errors
    |-- auth/
    |   |-- auth.router.ts       # Existing /api routes; verification only when ready
    |   |-- auth.controller.ts   # HTTP input/output and error forwarding
    |   |-- registration.service.ts  # Email lookup and OTP delivery orchestration
    |   |-- registration.validation.ts # unknown -> validated, normalized input
    |   |-- otp.service.ts       # Existing OTP rules; future atomicity when needed
    |   |-- registration.validation.spec.ts
    |   |-- registration.service.spec.ts
    |   `-- otp.integration.spec.ts
    |-- mail/
    |   |-- mail.client.ts       # Nodemailer, template rendering, SMTP acceptance
    |   |-- mail.client.spec.ts
    |   `-- templates/
    |       `-- user-activation-mail.ejs
    |-- docs/
    |   |-- swagger.js          # Generation input/script
    |   `-- swagger-output.json # Only implemented HTTP contracts
    `-- app.spec.ts             # HTTP contracts without a production listener

packages/                        # Existing single workspace and tsconfig
|-- error-handler/               # Shared errors and safe response handling
`-- libs/
    |-- prisma/                  # Prisma client lifecycle
    `-- redis/                   # Redis connection lifecycle
```

Create files as responsibilities move; do not create empty folders or placeholder
modules. Future login, sessions, and verification stay in `auth/` until their size
and independent ownership justify another feature folder. There is no need for
per-folder `package.json`, `tsconfig.json`, generic repository interfaces,
dependency-injection containers, or base controllers.

## Responsibility rules

| File / owner            | Receives                                   | Returns / side effects                                 |
| ----------------------- | ------------------------------------------ | ------------------------------------------------------ |
| Router                  | Express requests                           | Routes to controllers; no database or OTP operations   |
| Controller              | Untrusted request body                     | Validates input, invokes service, sends HTTP response  |
| Registration validation | `unknown`                                  | Normalized typed data or `ValidationError`; no I/O     |
| Registration service    | Validated registration data                | Looks up email and orchestrates OTP; no Express `next` |
| OTP service             | Normalized email, name, template           | Owns OTP TTLs, limits, and delivery flow               |
| Mail client             | Recipient, template, render data           | Throws on rendering/SMTP failure; owns transport close |
| App                     | App configuration                          | Express app without listening or signal handlers       |
| Main                    | Startup configuration and concrete clients | Starts listener; logs listener errors                  |

Use concrete modules and functions. Inject a dependency only when a focused HTTP
test needs to replace it; do not build a generic service registry. Keep Prisma
queries in the owning service until multiple queries justify a dedicated data
module. Never share auth business rules through `packages/libs`.

## Migration sequence

1. **Separate app creation from startup.** Move CORS, parsers, Swagger, router,
   error middleware into `app.ts`. Keep app.listen() in `main.ts`.
   Add readiness/shutdown only through the separate future lifecycle work. Keep greeting and health contracts intact.
2. **Move the feature together.** Move `routes/auth.router.ts` and
   `controller/auth.controller.ts` into `auth/`; update imports. Keep
   `POST /api/user-registration` unchanged. Do not expose incomplete verification.
3. **Split the helper by responsibility.** Move validation into
   `registration.validation.ts`, OTP restrictions/storage into `otp.service.ts`, and email
   lookup/orchestration into `registration.service.ts`. Add focused tests with each responsibility; no current auth unit tests need moving. Delete the old helper after all callers have moved.
4. **Move mail and API docs.** Move the mail module/templates and Swagger files.
   Update build asset inputs, bundled template resolution, Swagger imports, and
   generator paths in the same change. Keep runtime `dist/templates` and
   `dist/prisma/schema.prisma` contracts stable for Docker.
5. **Verify the move when authorized.** Run targeted unit/Redis integration tests,
   typechecking, builds, and a container OTP check. Inspect generated manifests,
   Linux Prisma generation and normal listener startup. Update documentation
   only with actual results.

## Separate functional follow-ups

Verification completion is a different change: implement OTP comparison,
failed-attempt lockout, atomic single-use consumption, password hashing, user
creation, unique-email race handling, route wiring, and success/failure responses.
The existing `verifyOtp()` placeholder is unresolved. Do not describe a folder
refactor as working authentication.

The OTP record remains a string at `otp:<normalized-email>`, expiring after
300 seconds. Cooldown expires after 60 seconds. No Lua scripts, ownership tokens,
Redis hash migration, or gateway Redis store are currently introduced. Future
verification must use the same normalization and storage format unless a separate
migration is explicitly implemented. Registration does not persist passwords.

## Acceptance checklist for the future refactor

- [ ] One dependency direction: router -> controller -> service -> infrastructure.
- [ ] No Express `Request`, `Response`, or `next` in OTP or registration services.
- [ ] No listener or signal-handler side effects when importing `app.ts`.
- [ ] Current URLs, response bodies, validation limits, and OTP TTLs preserved.
- [ ] Validation and error-propagation tests retained; future atomicity covered when implemented.
- [ ] Template and Prisma assets present in the deployable output.
- [ ] App manifests, project references, Jest aliases, and documentation aligned.
- [ ] Relevant checks actually run and results recorded before claiming success.

## Broader workspace direction

Keep gateway policy in `apps/api-gateway`; do not create a separate microservice
for each future entity. Add catalog/cart/order owners only with concrete workflows
and data boundaries. Keep pure shared modules separate from client barrels that
instantiate connections. Add shared code when two real consumers need it.

No new framework or folder-per-layer hierarchy is needed to follow this plan.
