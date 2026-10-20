# Request and authentication flows

[Documentation hub](../README.md) · [API reference](../reference/api.md)

**Status:** Current source execution paths. **Reviewed:** 2026-10-21.
These diagrams explain code behavior, not a successful end-to-end run.

## Gateway request lifecycle

Source: [gateway main.ts](../../apps/api-gateway/src/main.ts).

```mermaid
flowchart TD
    Request["Incoming HTTP request"] --> CORS["CORS<br/>May finish preflight requests"]
    CORS --> Morgan["Morgan request logging"]
    Morgan --> Health{"GET /gateway-health?"}
    Health -->|Yes| Local["200 gateway JSON<br/>No upstream or quota check"]
    Health -->|No| Limiter{"Within IP quota?<br/>100 requests / 15 minutes"}
    Limiter -->|No| Limited["429 limiter JSON"]
    Limiter -->|Yes| Proxy["Read/proxy body up to 16 KB<br/>Upstream timeout: 10 seconds"]
    Proxy --> Auth["AUTH_SERVICE_URL<br/>Default localhost:6001<br/>Path preserved"]
    Auth --> Reply["Forward upstream response"]
    Proxy -->|Error| Handler["Shared error middleware"]
```

CORS permits the configured browser origin; it does not establish identity.
The limiter is per process and proxy trust is disabled. Gateway error handling
does not implement a dedicated 502/504 policy. Direct auth requests bypass the
gateway quota. See [configuration](../reference/configuration.md).

## Auth request routing

Source: [auth main.ts](../../apps/auth-service/src/main.ts) and
[router](../../apps/auth-service/src/routes/auth.router.ts).

```mermaid
flowchart TD
    Request["Incoming auth request"] --> CORS["CORS"]
    CORS --> Root{"GET /?"}
    Root -->|Yes| Greeting["200 Hello API"]
    Root -->|No| JSON["express.json<br/>16 KB limit"]
    JSON --> Route{"Matched route?"}
    Route -->|"/api-docs or GET /docs-json"| Swagger["Swagger UI or committed JSON"]
    Route -->|"POST /api/user-registration"| Registration["Registration controller"]
    Route -->|No| Missing["Express default 404"]
    JSON -->|Parse or size error| Errors["Shared error middleware"]
    Registration -->|Error forwarded| Errors
```

Verification is exported in the controller but is not mounted in the router.
There are no login, session, or commerce routes.

## Registration and OTP delivery

Sources: [controller](../../apps/auth-service/src/controller/auth.controller.ts),
[helpers](../../apps/auth-service/src/utils/auth.helper.ts), and
[mail client](../../apps/auth-service/src/mail/mail.client.ts).

```mermaid
sequenceDiagram
    autonumber
    participant Client
    participant Auth as Registration controller
    participant DB as Prisma / MongoDB
    participant Redis
    participant Mail as EJS / SMTP
    Client->>Auth: POST /api/user-registration (name, email, password)
    Auth->>Auth: Validate body, trim name, normalize email
    Auth->>DB: users.findUnique(normalized email)
    DB-->>Auth: Existing user or null
    alt Existing user
        Auth-->>Client: 400 validation error, stop
    else No existing user
        Auth->>Redis: GET lock, spam lock, cooldown (sequential)
        Redis-->>Auth: Restriction values
        alt Restriction exists
            Auth-->>Client: 400 validation error, stop
        else Not restricted
            Auth->>Redis: GET request counter
            Redis-->>Auth: Current count
            alt Count is already at least 2
                Auth->>Redis: SET spam lock EX 3600
                Auth-->>Client: 400 request-limit error, stop
            else Count below 2
                Auth->>Redis: SET incremented counter EX 3600
                Auth->>Auth: Generate four-digit OTP
                Auth->>Mail: Render activation template and send email
                Mail-->>Auth: SMTP accepted recipient
                Auth->>Redis: SET OTP EX 300
                Auth->>Redis: SET cooldown EX 60
                Auth-->>Client: 200 OTP sent message
            end
        end
    end
```

Invalid input stops before the database lookup. Exceptions from Prisma, Redis,
rendering, or SMTP go through the controller's catch to shared error middleware.
SMTP rejection prevents OTP writes, but the request count has already increased.
SMTP can accept the email before a later Redis write fails; SMTP acceptance also
does not guarantee inbox delivery. The sequential checks/updates are not atomic.

This endpoint does not create a user, store a password, verify a code, or issue a
session. See [authentication development](../development/authentication.md) for
key names, TTLs, and implementation gaps.

## Shared error path

Source: [error-middleware.ts](../../packages/error-handler/error-middleware.ts).

```mermaid
flowchart TD
    Error["next(error)"] --> Sent{"Headers already sent?"}
    Sent -->|Yes| Delegate["Delegate to next(error)"]
    Sent -->|No| Parser{"error.status is 400 or 413?"}
    Parser -->|Yes| Body["Sanitized body-error JSON<br/>400 or 413"]
    Parser -->|No| Known{"instanceof AppError?"}
    Known -->|Yes| Application["error.statusCode<br/>status, message, truthy details"]
    Known -->|No| Unexpected["500 generic error JSON"]
```

The parser-status check precedes `AppError` handling. Unmatched routes use
Express's default 404, and gateway quota rejection has its own envelope.
The [API reference](../reference/api.md#shared-error-handler-auth-service)
owns exact response formats.
