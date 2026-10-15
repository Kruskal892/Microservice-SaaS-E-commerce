# Testing

[Documentation index](../README.md)

## Existing coverage

| Project      | Current check                                              | Limitation                                             |
| ------------ | ---------------------------------------------------------- | ------------------------------------------------------ |
| Auth service | Jest configuration with `passWithNoTests`                  | No unit test files                                     |
| Auth E2E     | HTTP 200 and exact JSON at `GET /`                         | Scaffold response only                                 |
| Gateway E2E  | Generated auth-style assertion                             | Wrong default port, route, and message for the gateway |
| API gateway  | No unit-test configuration or unit tests currently present | No isolated behavior coverage                          |

A passing target with no tests does not establish behavior coverage. No tests were run during the documentation update.

## Auth API smoke test

Stop any development process using the test port before running:

```sh
npx nx e2e @microservice-eshop/auth-service-e2e
```

The configured lifecycle is:

1. Nx builds and serves the auth service through target dependencies.
2. Jest global setup waits for `HOST`/`PORT` (defaults `localhost:6001`).
3. Test setup configures Axios's base URL.
4. The spec sends `GET /` and asserts HTTP 200 and `{ "message": "Hello API" }`.
5. Global teardown calls `killPort` for the selected port.

Auth and its E2E setup both read uppercase `PORT`. Auth ignores `HOST` and listens without an explicit bind address; E2E uses `HOST` as the request destination.

Use a dedicated free port if overriding defaults. Teardown terminates the process on that port; an existing listener can also make the readiness check succeed for the wrong application.

The [project configuration](../../apps/auth-service-e2e/package.json), [spec](../../apps/auth-service-e2e/src/auth-service/auth-service.spec.ts), and [Jest configuration](../../apps/auth-service-e2e/jest.config.cts) define this behavior.

## Gateway E2E mismatch

The target exists:

```sh
npx nx e2e @microservice-eshop/api-gateway-e2e
```

It is not a reliable gateway check in its current form:

| Setting      | Test currently uses | Gateway implements                                            |
| ------------ | ------------------- | ------------------------------------------------------------- |
| Default port | `3000`              | `8080`                                                        |
| Route        | `GET /`             | Local `GET /gateway-health`; root proxies to auth             |
| JSON message | `Hello API`         | `Welcome to api-gateway!` locally; `Hello API` via root proxy |

With no port-3000 listener, setup may wait or fail. An unrelated listener can be tested or terminated instead. Setting `PORT=8080` does not create a complete gateway test: root forwarding requires auth running separately on 6001, but the gateway E2E target only starts the gateway. The current root assertion also does not verify the gateway's local `/gateway-health` contract.

A future fix must choose the intended contract, align global setup, Axios setup, teardown, and the spec, and start auth when testing forwarding. This documentation change does not modify those files.

## Gateway behavior to cover

No dedicated tests currently cover CORS, HTTP 429 responses, proxy failure behavior, or client-IP handling. Future checks should distinguish local `/gateway-health` behavior from root forwarding, exercise the limiter, and verify the chosen proxy-trust policy. Do not treat the generated root assertion as coverage of these features.

## Unit tests and type checks

```sh
npx nx test @microservice-eshop/auth-service
npx nx typecheck @microservice-eshop/auth-service
npx nx typecheck @microservice-eshop/api-gateway
```

Jest uses the workspace preset and SWC transforms. E2E coverage output is configured under each E2E project's `test-output/jest/coverage`; a configured path is not evidence that coverage was generated.

## Shared-module and error-handler coverage

Auth registers the error handler, but its existing E2E assertion covers only
the successful `GET /` response. There are no permanent shared-module tests or
checks of custom error status codes, optional details, generic 500 responses,
or errors after headers have been sent.

`@microservice-eshop/<folder>` is a TypeScript source alias. Auth's esbuild
target bundles it; that does not configure Jest's resolver. The existing
Jest/SWC configuration has no explicit mapping for these folder aliases.
Before adding unit tests that import them, configure the test resolver for
`packages/<folder>/index.ts` and check its behavior. Test compilation may also
need the shared-library project reference. See
[compiler ownership](development-guide.md#build-and-compiler-ownership).

Build output, runtime alias resolution, Docker, and Nx target inference remain
unverified. The earlier direct, no-emit TypeScript diagnostic inspection found
no errors in `packages/tsconfig.lib.json`; it was not a test or application build.

## Prisma verification boundary

The schema and CLI configuration are present; no database integration tests exist.
Schema validation, client generation, database synchronization, and runtime CRUD
were not run during this documentation update. The user-reported `db push` failed
Atlas authentication, so it cannot establish index or relation behavior.
[Database setup](getting-started.md#prisma-and-mongodb) lists explicit validation
and generation commands for a requested check. Once persistence is integrated,
cover unique email/image ownership, required fields, and password handling with
permanent behavior tests rather than treating schema generation as runtime proof.

## CI coverage boundary

CI runs `lint test build typecheck` across projects. The E2E directories are excluded from Jest target inference and use explicit `e2e` targets. CI does not explicitly run either E2E target.

For new behavior, add focused tests around the contract or failure mode being introduced. Record commands, results, and unverified integrations in the handoff. Keep permanent tests; remove temporary verification artifacts only after their relevant checks pass.
