# API Specification

[Documentation index](../README.md)

**Updated:** 2026-10-20. Source contracts below are not runtime verification.

## Auth service

Default URL: http://localhost:6001. CORS allows credentialed browser requests
from http://localhost:3000. JSON bodies are limited to 16 KB.

### GET /

HTTP 200: `{ "message": "Hello API" }`. This is a greeting/liveness endpoint.

### POST /api/user-registration

JSON: name, email, password. Name is a trimmed string of 1-100 characters;
email is trimmed/lowercased with basic format and 254-character checks; password
is a string of 8-128 characters. Invalid bodies/fields return HTTP 400.

The controller looks up the normalized email, rejects an existing user, checks
simple Redis restrictions, tracks requests, and sends the activation email.
Restrictions throw, so the controller stops on failure. HTTP 200 returns
`{ "message": "OTP sent. Please check your account" }` after SMTP acceptance and
OTP/cooldown writes. SMTP failures propagate to the error handler. No account is
created, and no password is persisted. Concurrent OTP operations can race;
mail acceptance and Redis writes are not one transaction.

### API documentation

Swagger UI: /api-docs. Swagger JSON: /docs-json. The committed Swagger description
covers registration; it is not a complete contract for future authentication.
Verification, login, sessions, and commerce endpoints remain incomplete/absent.

## API gateway

Default URL: http://localhost:8080.

### GET /gateway-health

HTTP 200 `{ "message": "Welcome to api-gateway!" }`, without calling auth.

### Forwarded requests

Other paths forward unchanged to AUTH_SERVICE_URL, default http://localhost:6001.
There is no gateway static middleware or prefix stripping. The proxy limits bodies
to 16 KB and upstream requests to ten seconds. Errors reach shared middleware;
there is no retry policy or dedicated 502/504 mapping yet.

## Gateway middleware

CORS -> Morgan logging -> local health route -> IP limiter -> body-reading proxy
-> shared error middleware. Credentialed CORS allows http://localhost:3000 and
Authorization/Content-Type headers. CORS does not authenticate callers.

The limiter allows 100 requests per 15 minutes using default IPv4/IPv6 key handling.
It uses in-memory counters, standard draft-8 headers, and no legacy headers.
Rejection is 429 `{ "error": "Too many requests, please try again later" }`.
No middleware establishes an authenticated user or a larger authenticated quota.
Proxy trust is not enabled; forwarded client identities are not trusted by default.
Multiple gateway processes do not share counters. See the
[Redis/runtime plan](../architecture/redis-and-runtime-plan.md) for future work.

## Errors and unavailable routes

### Shared error handler (auth service)

Both auth and gateway register the shared four-argument middleware after routes.
For AppError it uses statusCode and returns
`{ "status": "error", "message": "..." }`, with truthy details included when supplied.
Messages/details must be safe public values. Malformed bodies return 400 with
Invalid request body; oversized bodies return 413 with Request body too large.
Unexpected errors return 500 `{ "error": "Something went wrong please try again" }`.
No stack is returned. If headers were already sent, the error is delegated onward.
Unmatched auth routes keep Express's default 404 handling.

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
