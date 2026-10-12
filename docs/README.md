# Developer documentation

Start here if you are new to Microservice Eshop. This is an Nx/npm workspace for an ecommerce platform; the current code consists of an Express gateway forwarding to an Express auth service and their generated E2E projects.

## Reading order

1. [Getting started](getting-started.md) — prerequisites, installation, running apps, environment variables, and first requests.
2. [Architecture](architecture.md) — application responsibilities, request paths, repository layout, and planned technologies.
3. [Development](development.md) — Nx tasks, TypeScript configuration, debugging, and how to make changes.
4. [API reference](api.md) — endpoints that actually exist.
5. [Testing](testing.md) — test lifecycle, coverage boundaries, and the gateway test mismatch.
6. [Deployment and CI](deployment.md) — build outputs, Docker packaging, CI, and production gaps.
7. [Troubleshooting](troubleshooting.md) — common setup, port, task, and debugger issues.
8. [Implementation status](implementation-status.md) — implemented scaffolding versus unfinished product features.

## Where to update documentation

| Change | Update |
| --- | --- |
| Installation, scripts, or environment variables | Getting started and the root README |
| Application ownership or service communication | Architecture |
| Routes or response contracts | API reference and related tests |
| Task configuration, compiler settings, or debugging | Development |
| Test setup, assertions, or coverage | Testing |
| Packaging, CI, or deployment | Deployment and CI |
| A planned capability becomes implemented | Implementation status and the root stack table |

The [root README](../README.md) introduces the project. These documents explain how to work in it. Source files linked throughout the guides are the authority when implementation and documentation diverge.

The documentation describes the working tree inspected during this update, including the newly added gateway. Commands are documented from configuration; application startup, builds, lint, tests, Docker, and CI were not executed as part of this documentation work.
