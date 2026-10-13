# Getting started

[Documentation index](README.md)

## Requirements

Use Node.js 24, matching [CI](../.github/workflows/ci.yml), and npm. Git is needed to clone the repository. Docker is optional.

No MongoDB, Redis, Kafka, Firebase, AWS, or ImageKit account is needed for the current applications. There is no frontend to start yet.

## Install

Open a terminal in the repository root. In this workspace:

```powershell
Set-Location 'G:\Projects\Microservice-SaaS-E-commerce'
npm ci
```

The committed lockfile is the installation reference. Run installation at the root because [package.json](../package.json) defines npm workspaces under `apps/*`.

## Run both applications

```sh
npm run dev
```

The script runs `npx nx run-many --target=serve --all`. Each serve target builds its application before starting Node.

| Application  | Default address                      | Expected JSON                              |
| ------------ | ------------------------------------ | ------------------------------------------ |
| Auth service | http://localhost:6001/               | `{ "message": "Hello API" }`               |
| API gateway  | http://localhost:8080/gateway-health | `{ "message": "Welcome to api-gateway!" }` |

In a second PowerShell terminal, check the responses:

```powershell
Invoke-RestMethod http://localhost:6001/
Invoke-RestMethod http://localhost:8080/gateway-health
```

To exercise forwarding with both apps running, also request `http://localhost:8080/`; it should return the auth message. `/gateway-health` is handled locally and does not check auth availability. These checks do not verify authentication or ecommerce functionality. Stop the development command with **Ctrl+C**.

## Run one application

```sh
npx nx serve @microservice-eshop/auth-service
```

Or:

```sh
npx nx serve @microservice-eshop/api-gateway
```

## Environment variables

| Variable | Consumer     | Default | Behavior                                                |
| -------- | ------------ | ------- | ------------------------------------------------------- |
| `port`   | Auth service | `6001`  | Lowercase key; passed directly to Express/Node when set |
| `PORT`   | API gateway  | `8080`  | Passed directly to Express/Node when set                |

The gateway's upstream is hard-coded to `http://localhost:6001`. Changing the auth port does not change the proxy destination. Neither app reads `HOST`; both listen without an explicit bind address. Auth reads lowercase `port`, while the gateway reads uppercase `PORT`. Environment lookup is case-sensitive on Linux and case-insensitive on Windows. Neither entry point explicitly loads a `.env` file, and no `.env.example` is provided.

To override the auth service's port in PowerShell:

```powershell
$env:port = '3001'
npx nx serve @microservice-eshop/auth-service
```

Open http://localhost:3001/ for that standalone auth session. Gateway forwarding still targets port 6001 and will not reach this overridden port. After stopping it, clear the overrides before running both apps:

```powershell
Remove-Item Env:port, Env:PORT -ErrorAction SilentlyContinue
npm run dev
```

On Windows, a shared `PORT`/`port` override makes both apps compete for one port. On Linux the keys differ; Docker and auth E2E still use uppercase `PORT` and need alignment. Use separate terminals and distinct ports if you need custom values. Port values are not validated by the application code.

## Browser requests

Both applications allow credentialed CORS requests from `http://localhost:3000`, with `Authorization` and `Content-Type` request headers. That address is an allowed frontend origin, not the auth port; no frontend is implemented yet. CORS does not authenticate clients or restrict non-browser callers.

## First-day checklist

- Locate both entry points and read their route handlers.
- Get the two default responses locally.
- Read [architecture](architecture.md) and [API reference](api.md).
- Read [testing limitations](testing.md) before interpreting a green test run.
- Check [implementation status](implementation-status.md) before assuming a feature exists.
