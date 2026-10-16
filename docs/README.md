# Project documentation

Microservice Eshop is an Nx/npm TypeScript workspace. Current code is an Express
gateway and auth scaffold, with generated E2E projects. Start with
[getting started](development/getting-started.md) to run it, or
[architecture](architecture/architecture.md) for the system overview, tech stack,
project structure, data flow, and future considerations.

For the shared `packages/` library, start with
[adding modules and folder imports](development/development-guide.md#adding-shared-modules).
[Technical design](architecture/technical-design.md#shared-error-handler-current-source)
describes the error classes; the
[API specification](api/api-specification.md#shared-error-handler-auth-service)
owns their response formats. Auth registers the handler; the gateway does not.

## Core documents

| #   | Document                                                   | Main purpose                                                 | Priority |
| --- | ---------------------------------------------------------- | ------------------------------------------------------------ | -------- |
| 1   | [PRD](product/prd.md)                                      | Define what is being built and why                           | Critical |
| 2   | [Feature specification](product/feature-specification.md)  | Define feature behavior                                      | Critical |
| 3   | [System architecture](architecture/architecture.md)        | Explain frontend, backend, database, and service interaction | Critical |
| 4   | [Database design (ERD)](architecture/database-design.md)   | Define collections, relationships, constraints, and indexes  | Critical |
| 5   | [API specification](api/api-specification.md)              | Define frontend/backend communication                        | Critical |
| 6   | [UI/UX specification](product/ui-ux-specification.md)      | Define screens, navigation, flows, and states                | High     |
| 7   | [Technical design (TDD)](architecture/technical-design.md) | Define patterns and technical decisions                      | High     |
| 8   | [Implementation plan](delivery/implementation-plan.md)     | Turn the design into development tasks                       | Critical |

## Supporting guides

| Area        | Guides                                                                                                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Development | [Setup](development/getting-started.md), [workflow and formatting](development/development-guide.md), [testing](development/testing.md), [troubleshooting](development/troubleshooting.md) |
| Delivery    | [Implementation status](delivery/implementation-status.md), [deployment and CI](delivery/deployment.md)                                                                                    |

## Organization and status conventions

```text
docs/
|-- product/          # Why, feature behavior, customer interface
|-- architecture/     # System, data model, implementation decisions
|-- api/              # HTTP contracts
|-- delivery/         # Tasks, status, packaging and operations
|-- development/      # Contributor setup and workflow
`-- README.md         # This index
```

**Current / implemented** means inspected source contains the behavior.
**Configured** means tooling exists without implying a successful run.
**Proposed / draft** means suggested design, not an approved requirement or available
feature. **Undecided** marks input needed before dependent implementation.
Future product requirements are drafts because no approved product brief exists here.

Aligned to source on **2026-10-17**. See
[authentication development](development/authentication.md) for the branch review,
registration scaffolding, shared clients, and actual verification results.

Prisma 6.19 MongoDB tooling and the initial users/images schema are now configured.
Read [database setup](development/getting-started.md#prisma-and-mongodb) and
[current schema](architecture/database-design.md#current-prisma-schema) separately
from the proposed commerce ERD. The draft controller uses a wrapper with a mismatched client import;
successful database connectivity remains unverified.

## Where to update documentation

| Change                         | Update                                     |
| ------------------------------ | ------------------------------------------ |
| Product goals or scope         | PRD, features, plan                        |
| Screens or interface states    | UI/UX and related feature                  |
| Service boundaries             | System architecture and TDD                |
| Persistence or constraints     | Database design and API effects            |
| HTTP behavior                  | API specification, features, related tests |
| Setup, Nx, formatting, tests   | Relevant development guide and root README |
| Packaging or infrastructure    | Deployment and system architecture         |
| Capability becomes implemented | Implementation status and root stack table |

The [root README](../README.md) remains the introduction. Keep contracts in their
owning documents and link to them rather than maintaining duplicate snapshots.
