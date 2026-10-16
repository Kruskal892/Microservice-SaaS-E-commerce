# API Specification

[Documentation index](../README.md)

**Priority:** Critical. **Updated:** 2026-10-14. Sections through errors describe
current source; the final section proposes unimplemented product contracts.

This reference describes the current entry points. `swagger-ui-express` is installed,
but no OpenAPI specification, Swagger UI route, or API versioning exists. Shared
error handling is registered in auth; the gateway retains its existing handling.

## Auth service

Source: [main.ts](../../apps/auth-service/src/main.ts). Default base URL: `http://localhost:6001`.

### GET /

Returns HTTP 200 with JSON:

```json
{ "message": "Hello API" }
```

```powershell
Invoke-RestMethod http://localhost:6001/
```

No authentication, query parameters, or request body are required. This is a scaffold response, not a login endpoint or dependency-aware health check.

Auth applies CORS before its route: origin `http://localhost:3000`, credentials allowed, and `Authorization` and `Content-Type` request headers allowed. It has no body parser or rate limiter. Listener errors are logged to stderr and set a nonzero process exit status.

## Registration draft (not exposed)

`userRegistration` exists in auth source but is not registered in `main.ts`.
No registration URL, success status, or OTP response contract is implemented.
The existing `GET /` contract is unchanged. See
[authentication development](../development/authentication.md) for the controller
flow and blockers; proposed auth routes below remain proposals.

## API gateway

Source: [main.ts](../../apps/api-gateway/src/main.ts). Default base URL: `http://localhost:8080`.

### GET /gateway-health

Returns HTTP 200 with JSON, without contacting auth:

```json
{ "message": "Welcome to api-gateway!" }
```

```powershell
Invoke-RestMethod http://localhost:8080/gateway-health
```

The former `GET /api` route is forwarded to auth and returns 404 with the current auth routes. The startup log still prints `/api`; use `/gateway-health` for the local response. This response checks neither auth availability nor other dependencies.

### Forwarded requests

After the local route, the gateway proxies remaining requests to the fixed upstream `http://localhost:6001`. The upstream receives the requested path; no auth prefix is stripped.

With auth running, `GET http://localhost:8080/` returns HTTP 200 and the auth `Hello API` JSON. This is the current forwarding smoke-check path. Other paths are not automatically implemented APIs; auth only defines `GET /`.

There is no gateway static middleware anymore. Requests to `/assets` are forwarded like other unmatched routes.

## Gateway middleware

| Middleware         | Current configuration                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------- |
| CORS               | Origin `http://localhost:3000`; credentials allowed; `Authorization` and `Content-Type` headers allowed |
| Logging            | Morgan `dev`                                                                                            |
| JSON parser        | 100 MB limit                                                                                            |
| URL-encoded parser | 100 MB limit, extended mode                                                                             |
| Cookie parser      | Parses cookies; does not establish authentication                                                       |
| Rate limiter       | 15-minute window; 100 requests per raw IP, or 1000 if `req.user` exists                                 |

CORS runs first and handles preflight requests before the downstream middleware. Body parsing and cookie parsing precede the limiter and route handlers. No middleware currently establishes `req.user`, so normal traffic uses the 100-request limit.

Rate-limit rejection returns **HTTP 429** with:

```json
{ "error": "Too many requests, please try again later" }
```

Both standard and legacy rate-limit headers are enabled. The store is process-local memory, not Redis; restarting the process resets counters.

The gateway currently trusts one proxy hop and uses raw `req.ip` keys. This permits forwarded-header spoofing on direct connections and lacks IPv6 subnet grouping. See [implementation status](../delivery/implementation-status.md) for the outstanding review limitations.

## Errors and unavailable routes

There is no custom proxy error handler, timeout policy, retry policy, or active
shared JSON error envelope. If auth is unavailable, forwarded requests fail through
the proxy's default error handling. A successful `/gateway-health` response does
not prove auth is reachable.

### Shared error handler (auth service)

Source: [error-middleware.ts](../../packages/error-handler/error-middleware.ts).
Auth imports `@microservice-eshop/error-handler` through a source alias and registers its four-parameter handler
after routes. The gateway does not use it. These examples describe source
behavior; runtime error responses have not been verified. No dedicated error
demonstration route exists.

For an `AppError`, the handler uses `err.statusCode` and returns:

```json
{ "status": "error", "message": "User not found" }
```

This example corresponds to `new NotFoundError('User not found')` (404).
Truthy `err.details` is included as a top-level `details` property; falsy values
such as `false`, `0`, or an empty string are omitted. Application messages and
details are passed through without sanitization; the `isOperational` flag does
not affect the response.

For errors that are not an `AppError`, the handler returns HTTP 500 with:

```json
{ "error": "Something went wrong please try again" }
```

The fallback has a different shape from application errors. Neither branch
includes a stack trace in its JSON. Gateway rate-limit responses still use their
existing format above. See [technical design](../architecture/technical-design.md#shared-error-handler-current-source)
for classes and integration gaps. The proposed product envelope below is a
separate design draft.

Registration, login, refresh, logout, password reset, profiles, catalog, cart, checkout, and order APIs remain unimplemented. Neither app verifies tokens. The gateway's body parsers are not input validation, and CORS is not access control.

When adding routes, document request validation, success/error responses, access requirements, and persistent effects. Keep the eventual OpenAPI contract aligned with the implemented routes.

## Proposed product API - not implemented

This draft supports the [feature specification](../product/feature-specification.md).
`/v1` is a proposed public prefix, not an existing route. Requests to these paths
currently forward to auth and have no product handlers. Session transport, exact
limits, service routing, and checkout lifecycle require decisions before implementation.

### Common draft conventions

- JSON request/response bodies; IDs serialized as strings, dates as UTC ISO 8601.
- Money is integer minor units plus currency, calculated by the server.
- Customer identity comes from verified credentials; clients cannot choose an owner.
- Paginated lists return `{ "items": [], "nextCursor": null }`; draft limit defaults
  to 20 with maximum 100. Cursor uses createdAt plus ID for stable descending order.
  Invalid limits, IDs, or cursors return 400. These values are proposals.
- Mutations validate an explicit set of accepted fields rather than accepting
  arbitrary objects. Unexpected failures expose no stack traces or credentials.

### Draft endpoints and contracts

| Method / path                       | Access   | Request                                                                                        | Success                                                       | Main failures                                                              |
| ----------------------------------- | -------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------- |
| POST `/v1/auth/register`            | Public   | `{ email, password }`                                                                          | 201 `{ user: { id, email } }`; does not imply automatic login | 400 invalid input, 409 duplicate, 429 limited                              |
| POST `/v1/auth/login`               | Public   | `{ email, password }`                                                                          | 200 `{ user: { id, email } }` plus chosen session transport   | 400 invalid input, 401 generic credentials failure, 429                    |
| POST `/v1/auth/logout`              | Customer | No body                                                                                        | 204; invalidate current session                               | 401 absent/expired session                                                 |
| GET `/v1/auth/me`                   | Customer | No body                                                                                        | 200 `{ user: { id, email } }`                                 | 401 absent/expired/revoked session                                         |
| GET `/v1/products`                  | Public   | Optional `cursor`, `limit`                                                                     | 200 paginated product summaries                               | 400 invalid query                                                          |
| GET `/v1/products/{id}`             | Public   | Product ID                                                                                     | 200 product detail                                            | 400 invalid ID, 404 missing/inactive                                       |
| GET `/v1/cart`                      | Customer | No body                                                                                        | 200 cart, including empty items                               | 401                                                                        |
| PUT `/v1/cart/items/{productId}`    | Customer | `{ quantity, expectedVersion }`; positive integer quantity                                     | 200 updated cart with new version                             | 400 invalid, 401, 404 missing/inactive product, 409 stock/version conflict |
| DELETE `/v1/cart/items/{productId}` | Customer | `expectedVersion` query                                                                        | 200 updated cart; missing line is a no-op if version matches  | 400, 401, 409 stale version                                                |
| POST `/v1/orders`                   | Customer | `Idempotency-Key` header; `{ cartVersion, expectedTotalMinor, currency }` draft review payload | 201 new order; 200 matching retry with same order             | 400 invalid/empty cart, 401, 409 price/stock/version or conflicting key    |
| GET `/v1/orders`                    | Customer | Optional `cursor`, `limit`                                                                     | 200 paginated own orders                                      | 400, 401                                                                   |
| GET `/v1/orders/{id}`               | Customer | Order ID                                                                                       | 200 own order detail                                          | 400, 401, 404 missing or other owner's order                               |

Registration persists only a normalized email and password hash. Login issues the
chosen credential; logout revokes it. Credential storage/transport and CSRF policy
are undecided, so no cookie names, token fields, lifetimes, or refresh endpoints
are specified. Verification/recovery require separate approved contracts.

Product summary: `{ id, name, priceMinor, currency, stockQuantity }`; detail adds
`description`. Cart: `{ id, version, items, totalMinor, currency }`; each line has
`productId`, `name`, `quantity`, `unitPriceMinor`, and availability. An empty cart
has zero total; its currency policy is decided with catalog configuration.

Order: `{ id, status, currency, totalMinor, items, createdAt }`; lines have
`productId`, `productName`, `quantity`, `unitPriceMinor`. The accepted total is
server-calculated; the client's expected total only detects changes, never sets
the price. Status values and shipping/tax/payment payloads remain blocked on
lifecycle decisions. The draft request must be revised if those add to the total.

Order submission reloads the customer's cart and prices, verifies the review
version/total, and coordinates stock with a durable order write. Matching key and
request returns the original order; mismatching reuse is 409. Clearing the cart
must not prevent recovery after a failed submission. No payment callback or
payment success is implied by an order response.

### Proposed error envelope

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Review the submitted fields.",
    "fields": { "quantity": "Use a positive integer." }
  }
}
```

`fields` is optional. Proposed codes distinguish validation, unauthorized,
not-found, conflict, rate-limit, and internal failures. Proposed gateway upstream
mapping: 502 for failed connections, 504 for upstream timeout, sanitized 500 for
unexpected internal errors. This mapping is not implemented. Existing 429 uses
`{ "error": "Too many requests, please try again later" }`; harmonizing it needs
an explicit compatibility change, not a documentation-only assumption.

### Contract delivery

Implement and test ownership, validation, repeat requests, conflicts, and upstream
failure with each endpoint. Publish executable OpenAPI only for available routes
and align examples with the implementation. See [technical design](../architecture/technical-design.md)
and [implementation plan](../delivery/implementation-plan.md).
