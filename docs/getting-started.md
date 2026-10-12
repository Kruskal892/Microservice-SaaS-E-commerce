# Getting started

[Documentation index](README.md)

## Requirements

Use Node.js 24, matching [CI](../.github/workflows/ci.yml), and npm. Git is needed to clone the repository. Docker is optional.

No MongoDB, Redis, Kafka, Firebase, AWS, or ImageKit account is needed for the current applications. There is no frontend to start yet.

## Install

Open a terminal in the repository root. In this workspace:

```powershell
Set-Location 'D:\Microservice Eshop'
npm ci
```

The committed lockfile is the installation reference. Run installation at the root because [package.json](../package.json) defines npm workspaces under `apps/*`.

## Run both applications

```sh
npm run dev
```

The script runs `npx nx run-many --target=serve --all`. Each serve target builds its application before starting Node.

| Application | Default address | Expected JSON |
| --- | --- | --- |
| Auth service | http://localhost:3000/ | `{ "message": "Hello API" }` |
| API gateway | http://localhost:3333/api | `{ "message": "Welcome to api-gateway!" }` |

In a second PowerShell terminal, check the responses:

```powershell
Invoke-RestMethod http://localhost:3000/
Invoke-RestMethod http://localhost:3333/api
```

These responses only demonstrate that the scaffolds respond to HTTP. They do not verify authentication, gateway forwarding, or ecommerce functionality. Stop the development command with **Ctrl+C**.

## Run one application

```sh
npx nx serve @microservice-eshop/auth-service
```

Or:

```sh
npx nx serve @microservice-eshop/api-gateway
```

## Environment variables

| Variable | Consumer | Default | Behavior |
| --- | --- | --- | --- |
| `HOST` | Auth service | `localhost` | Bind address |
| `PORT` | Auth service | `3000` | Converted to a number before listening |
| `PORT` | API gateway | `3333` | Passed directly to Express/Node when set |

The gateway does not read `HOST`; its listen call does not specify a bind address. Both applications read the process environment. Neither entry point explicitly loads a `.env` file, and no `.env.example` is provided.

To override the auth service's port in PowerShell:

```powershell
$env:HOST = 'localhost'
$env:PORT = '3001'
npx nx serve @microservice-eshop/auth-service
```

Open http://localhost:3001/ for that session. After stopping it, clear the overrides before running both apps:

```powershell
Remove-Item Env:HOST, Env:PORT -ErrorAction SilentlyContinue
npm run dev
```

A shared `PORT` override is inherited by both apps and makes them compete for one port. Use separate terminals and distinct ports if you need custom values. Port values are not validated by the application code.

## First-day checklist

- Locate both entry points and read their route handlers.
- Get the two default responses locally.
- Read [architecture](architecture.md) and [API reference](api.md).
- Read [testing limitations](testing.md) before interpreting a green test run.
- Check [implementation status](implementation-status.md) before assuming a feature exists.
