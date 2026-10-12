# API reference

[Documentation index](README.md)

This reference describes the current entry points. `swagger-ui-express` is installed, but no OpenAPI specification, Swagger UI route, API versioning, or shared error envelope exists.

## Auth service

Source: [main.ts](../apps/auth-service/src/main.ts). Default base URL: `http://localhost:6001`.

### GET /

Returns HTTP 200 with JSON:

```json
{ "message": "Hello API" }
```

```powershell
Invoke-RestMethod http://localhost:6001/
```

No authentication, query parameters, or request body are required. This is a scaffold response, not a login endpoint or dependency-aware health check.

## API gateway

Source: [main.ts](../apps/api-gateway/src/main.ts). Default base URL: `http://localhost:8080`.

### GET /api

Returns HTTP 200 with JSON, without contacting auth:

```json
{ "message": "Welcome to api-gateway!" }
```

```powershell
Invoke-RestMethod http://localhost:8080/api
```

### Forwarded requests

After the local route, the gateway proxies remaining requests to the fixed upstream `http://localhost:6001`. The upstream receives the requested path; no auth prefix is stripped.

With auth running, `GET http://localhost:8080/` returns HTTP 200 and the auth `Hello API` JSON. This is the current forwarding smoke-check path. Other paths are not automatically implemented APIs; auth only defines `GET /`.

There is no gateway static middleware anymore. Requests to `/assets` are forwarded like other unmatched routes.

## Gateway middleware

| Middleware | Current configuration |
| --- | --- |
| CORS | Origin `http://localhost:3000`; credentials allowed; `Authorization` and `Content-Type` headers allowed |
| Logging | Morgan `dev` |
| JSON parser | 100 MB limit |
| URL-encoded parser | 100 MB limit, extended mode |
| Cookie parser | Parses cookies; does not establish authentication |
| Rate limiter | 15-minute window; 100 requests per raw IP, or 1000 if `req.user` exists |

CORS runs first and handles preflight requests before the downstream middleware. Body parsing and cookie parsing precede the limiter and route handlers. No middleware currently establishes `req.user`, so normal traffic uses the 100-request limit.

Rate-limit rejection returns **HTTP 429** with:

```json
{ "error": "Too many requests, please try again later" }
```

Both standard and legacy rate-limit headers are enabled. The store is process-local memory, not Redis; restarting the process resets counters.

The gateway currently trusts one proxy hop and uses raw `req.ip` keys. This permits forwarded-header spoofing on direct connections and lacks IPv6 subnet grouping. See [implementation status](implementation-status.md) for the outstanding review limitations.

## Errors and unavailable routes

There is no custom proxy error handler, timeout policy, retry policy, or shared JSON error envelope. If auth is unavailable, forwarded requests fail through the proxy's default error handling. A successful `/api` response does not prove auth is reachable.

Registration, login, refresh, logout, password reset, profiles, catalog, cart, checkout, and order APIs remain unimplemented. Neither app verifies tokens. The gateway's body parsers are not input validation, and CORS is not access control.

When adding routes, document request validation, success/error responses, access requirements, and persistent effects. Keep the eventual OpenAPI contract aligned with the implemented routes.
