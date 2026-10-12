# API reference

[Documentation index](README.md)

This reference describes the routes in the current entry points. No OpenAPI specification, Swagger UI, API versioning, or shared error envelope exists yet.

## Auth service

Source: [main.ts](../apps/auth-service/src/main.ts). Default base URL: `http://localhost:3000`.

### GET /

Returns the scaffold message. No authentication, query parameters, or request body are required.

**Response: HTTP 200, JSON**

```json
{ "message": "Hello API" }
```

```powershell
Invoke-RestMethod -Method Get -Uri http://localhost:3000/
```

This is not a login endpoint and does not verify dependencies or issue tokens.

## API gateway

Source: [main.ts](../apps/api-gateway/src/main.ts). Default base URL: `http://localhost:3333`.

### GET /api

Returns the gateway scaffold message. No authentication, query parameters, or request body are required.

**Response: HTTP 200, JSON**

```json
{ "message": "Welcome to api-gateway!" }
```

```powershell
Invoke-RestMethod -Method Get -Uri http://localhost:3333/api
```

The handler does not contact another service.

### Static assets under /assets

Express static middleware resolves requested files beneath the compiled application's `assets` directory. File content and content type depend on the requested asset. No actual asset files beyond the source placeholder are included yet.

## Errors and unavailable routes

There is no custom not-found or error middleware. Unmatched requests fall through to Express's default behavior; do not assume JSON error responses.

Registration, login, refresh, logout, password reset, user profiles, catalog, cart, checkout, and order routes are not implemented. No request-body parser, CORS middleware, token verification, or rate limiting is configured in either entry point.

When adding routes, document request validation, successful responses, errors, access requirements, and any persistent effects. Add the OpenAPI contract when that integration is introduced rather than treating this scaffold reference as a complete ecommerce API.
