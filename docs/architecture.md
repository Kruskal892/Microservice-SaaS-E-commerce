# Architecture

[Documentation index](README.md)

## Current system

Microservice Eshop uses an Nx monorepo with npm workspaces. Both runtime applications use Express, but they are currently separate scaffolds with no service-to-service calls.

```text
HTTP client ---> auth-service :3000 ---> GET / JSON response

HTTP client ---> api-gateway :3333 ---> GET /api JSON response
                                  ---> /assets static files
```

There are no database reads or writes, Kafka events, login sessions, or persistent state in these request paths.

## Application responsibilities

| Project | Current behavior | Intended responsibility |
| --- | --- | --- |
| Auth service | Returns a fixed message at `GET /` | Authentication; routes and data model remain unimplemented |
| API gateway | Returns a fixed message at `GET /api` and serves assets | Client entry point; forwarding and upstream error handling remain unimplemented |
| Auth E2E | Calls the auth HTTP endpoint | Verify the auth service through its public API |
| Gateway E2E | Still contains the auth scaffold assertion | Verify the gateway once setup and assertions are aligned |

Do not assume gateway routes reach the auth service. There is no proxy, route aggregation, shared database, or authentication middleware between them.

## Source map

| Location | Responsibility |
| --- | --- |
| [apps/auth-service/src/main.ts](../apps/auth-service/src/main.ts) | Auth process configuration, Express app, routes, and listener |
| [apps/api-gateway/src/main.ts](../apps/api-gateway/src/main.ts) | Gateway routes, static assets, listener, and server error logging |
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

The gateway mounts Express static middleware at `/assets`, resolving files from an `assets` directory beside the compiled entry point. The directory currently contains only a placeholder in source.

Unmatched routes have no custom handler. Validation, structured error responses, access control, and application logging conventions have not been established. The gateway logs server errors through `console.error`; this does not provide an upstream retry or recovery strategy.

## Planned platform

The technology overview supplied for this project describes:

- Next.js for the storefront.
- MongoDB with Prisma for persistence and Redis as a secondary store.
- Kafka for event messaging.
- Socket.IO for real-time communication and Firebase for push notifications.
- TensorFlow.js for machine learning.
- Swagger/OpenAPI for API documentation.
- ImageKit for cloud assets, inferred from the supplied logo.
- AWS for deployment and Cloudflare for domain management.

These are planned integrations. Database ownership, event schemas, delivery guarantees, frontend routes, cloud resources, and the ecommerce service breakdown are not defined in this repository.

When a boundary is introduced, document its owner, public contract, reads/writes, and failure behavior here. Describe proposed designs as proposed until code and configuration implement them.
