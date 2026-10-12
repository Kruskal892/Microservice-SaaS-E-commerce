# Architecture

[Documentation index](README.md)

## Current system

Microservice Eshop uses an Nx monorepo with npm workspaces. Both runtime applications use Express. The gateway now forwards requests to the auth service unless its local `/api` route handles them.

```text
HTTP client ---> auth-service :6001 ---> GET / JSON response

HTTP client ---> api-gateway :8080 ---> CORS / logging / body & cookie parsing
                                  ---> IP rate limiter
                                  ---> GET /api: local gateway JSON
                                  ---> other requests: proxy to localhost:6001
```

There are no database reads or writes, Kafka events, login sessions, or persistent state in these request paths.

## Application responsibilities

| Project | Current behavior | Intended responsibility |
| --- | --- | --- |
| Auth service | Returns a fixed message at `GET /` | Authentication; routes and data model remain unimplemented |
| API gateway | Returns local `GET /api` JSON; forwards other requests to auth after middleware | Client entry point; authentication and explicit upstream failure handling remain unimplemented |
| Auth E2E | Calls the auth HTTP endpoint | Verify the auth service through its public API |
| Gateway E2E | Still contains the auth scaffold assertion | Verify the gateway once setup and assertions are aligned |

The proxy is mounted at `/` after the local route and targets `http://localhost:6001`. There is no path prefix removal or separate service routing table. Overriding the auth port does not update this target. There is no authentication middleware or shared database.

## Source map

| Location | Responsibility |
| --- | --- |
| [apps/auth-service/src/main.ts](../apps/auth-service/src/main.ts) | Auth process configuration, Express app, routes, and listener |
| [apps/api-gateway/src/main.ts](../apps/api-gateway/src/main.ts) | Gateway middleware, local route, proxy, listener, and server error logging |
| [apps/auth-service/package.json](../apps/auth-service/package.json) | esbuild, serve, pruning, and Docker target configuration |
| [apps/api-gateway/package.json](../apps/api-gateway/package.json) | Gateway serve and pruning configuration |
| [apps/api-gateway/webpack.config.js](../apps/api-gateway/webpack.config.js) | Gateway Node build and asset copying |
| [nx.json](../nx.json) | Plugin-inferred targets, task defaults, caching inputs, and default base |
| [tsconfig.base.json](../tsconfig.base.json) | Shared TypeScript rules |
| [tsconfig.json](../tsconfig.json) | References to all four projects |
| [package.json](../package.json) | Workspace dependencies and root development script |
| [jest.config.ts](../jest.config.ts) | Jest project discovery |
| [.github/workflows/ci.yml](../.github/workflows/ci.yml) | CI commands |

There is no shared library directory or established controller/service/repository layering yet. The current handlers live directly in the entry points.

## Request behavior

For the auth root endpoint, Express sends the fixed JSON object with HTTP 200. For the gateway API endpoint, Express sends its own fixed JSON object with HTTP 200. Neither handler accepts a request body or updates state.

Middleware runs in this order: CORS, Morgan `dev` logging, JSON parsing (100 MB), URL-encoded parsing (100 MB, extended mode), cookie parsing, and the rate limiter. Both the local route and proxied requests pass through the limiter. Static asset serving has been removed; `/assets` now falls through to the auth proxy.

The limiter uses a 15-minute window, a raw `req.ip` key, and process-local memory. Its limit is 100 requests unless `req.user` is present, when it becomes 1000. No middleware currently populates `req.user`, so ordinary requests use 100. A rejected request returns HTTP 429 and the configured JSON error.

The current code sets `trust proxy` to one hop. On a direct connection, forwarded headers can therefore change the rate-limit identity. The raw-IP key also bypasses the library's IPv6 subnet grouping. These are current limitations, not verified security guarantees; see [implementation status](implementation-status.md).

Unmatched auth routes use Express defaults; unmatched gateway routes are proxied to auth. Request validation, a shared error contract, and access control have not been established. Gateway logging uses Morgan; rate-limit errors have their own JSON response. The gateway logs server errors through `console.error`; this does not provide an upstream retry or recovery strategy.

## Planned platform

The technology overview supplied for this project describes:

- Next.js for the storefront.
- MongoDB with Prisma for persistence and Redis as a secondary store.
- Kafka for event messaging.
- Socket.IO for real-time communication and Firebase for push notifications.
- TensorFlow.js for machine learning.
- Swagger/OpenAPI for API documentation; `swagger-ui-express` is installed, but no documentation route or specification exists.
- ImageKit for cloud assets, inferred from the supplied logo.
- AWS for deployment and Cloudflare for domain management.

These are planned integrations. Database ownership, event schemas, delivery guarantees, frontend routes, cloud resources, and the ecommerce service breakdown are not defined in this repository.

When a boundary is introduced, document its owner, public contract, reads/writes, and failure behavior here. Describe proposed designs as proposed until code and configuration implement them.
