# Project documentation

Microservice Eshop is an Nx/npm TypeScript monorepo with an Express API gateway,
an authentication service, shared infrastructure modules, and a Next.js client
with Tailwind v4 design tokens and `next-themes` light/dark switching. Registration can
request an email OTP, verify it to create an account, and log in to receive JWT
cookies. Three recovery routes support purpose-specific OTP verification and
[expiring single-use reset authorization](development/authentication.md#password-recovery).
Cookie-based [access-token refresh](reference/api.md#access-token-refresh) and shared
access-token verification middleware are implemented. The middleware protects
`GET /api/logged-in-user`. The header and read-only `/profile` share a current-user
query, and Axios handles one access-token refresh and retry. Refresh
rotation/revocation, logout, storefront, and commerce remain unfinished. The client renders a header with sticky navigation and `ThemeToggle`,
a placeholder `/` page, and `/login` and `/sign-up` pages with shared
controls and Zod/React Hook Form validation; `/sign-up` connects registration and
OTP verification to the backend via Axios and TanStack Query. `/login` now posts
credentials with cookies enabled and redirects to `/` on success. OTP resend reuses registration delivery with a server-enforced cooldown.
Google sign-in and shopping flows remain incomplete. Backend
password reset is enabled and connected to `/forgot-password`; existing JWT revocation remains absent. **Auth/client baseline reviewed: 2026-11-06.**
Current-user/header/profile source and documentation updated 2026-11-11;
new regressions, lint, builds, and live browser/API flows were not run for this update.
The 2026-11-10 checkpoint passed 93 mocked auth tests and auth app/spec TypeScript
checks; that historical result does not validate the new changes.
The shared workspace remains `@microservice-eshop/shared`; folder imports such as
`@packages/middleware` resolve through source aliases.

Start with [how login and the current-user API work](development/session-flow.md)
for a beginner walkthrough of cookies, JWTs, refresh, caching, and security limits.
The [client guide](../apps/client/README.md) owns the current `ThemeProvider`
configuration, mounted switch behavior, auth form limits, password reveal
controls, and responsive header behavior. Source and documentation checks are
separate from browser, accessibility, test, and production-build validation.

Shared UI and SVG assets are owned by `packages/ui` and `packages/assets`.
See the [shared UI contract](reference/shared-ui.md),
[assets guide](../packages/assets/README.md), and
[current validation and review findings](operations/implementation-status.md#client-login-and-theme-provider-2026-11-06).

## Shared component library

Use the [common component recipes](reference/common-components.md),
[design contract](design/shared-ui-system.md), and
[Storybook workflow](development/storybook.md) for reusable React controls.
[Figma library](https://www.figma.com/design/SXjnKoIBg4Laj7RqjVgQHo?node-id=7-110).

## Start here

| Need                                   | Read                                                                                                                        |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Set up and run the project             | [Getting started](development/getting-started.md)                                                                           |
| Understand the system                  | [Architecture overview](architecture/overview.md)                                                                           |
| Find code and understand dependencies  | [Repository structure](architecture/repository-structure.md)                                                                |
| Follow a request or OTP email          | [Request flows](architecture/request-flows.md)                                                                              |
| Call an available endpoint             | [API reference](reference/api.md)                                                                                           |
| Configure a service                    | [Configuration reference](reference/configuration.md)                                                                       |
| Run or style the client                | [Client README](../apps/client/README.md), [design tokens](reference/design-tokens.md), [shared UI](reference/shared-ui.md) |
| Assess what exists and what is missing | [Implementation status](operations/implementation-status.md)                                                                |
| Review proposals and upcoming work     | [Future plans](future-plans/README.md)                                                                                      |

## Documentation map

```text
docs/
|-- README.md
|-- architecture/                  # Current system and design explanations
|   |-- overview.md                # Components, boundaries, technology
|   |-- repository-structure.md    # Code ownership, workspace and build graph
|   |-- request-flows.md           # HTTP, OTP, login, and error flow diagrams
|   |-- database-design.md         # Actual Prisma schema and ERD
|   `-- technical-design.md        # Current implementation patterns
|-- reference/                     # Exact current contracts
|   |-- api.md
|   |-- configuration.md
|   |-- design-tokens.md            # Shared Tailwind palette, scales, and theme selectors
|   |-- shared-ui.md                # Shared Input API and cross-app CSS setup
|   `-- common-components.md        # Common control APIs and composition recipes
|-- development/                   # Contributor guides
|   |-- getting-started.md
|   |-- development-guide.md
|   |-- authentication.md
|   |-- testing.md
|   |-- storybook.md                # Isolated component development
|   `-- troubleshooting.md
|-- design/                        # UI design contract and Figma status
|   `-- shared-ui-system.md
|-- operations/                    # Packaging, CI, and current delivery status
|   |-- deployment.md
|   `-- implementation-status.md
`-- future-plans/                  # Proposed work; no availability implied
    |-- README.md
    |-- implementation-plan.md
    |-- architecture/             # Refactors, runtime plans, target designs
    |-- api/                      # Proposed product contracts
    `-- product/                  # Draft requirements, features, UI/UX
```

The structure separates explanations, reference material, contributor guides,
operations, and proposals. The [root README](../README.md) provides a short
introduction and quick start; this index owns documentation navigation.

## Architecture and contributor guides

- [Database design](architecture/database-design.md): current users/images
  fields, relationships, and unresolved constraints.
- [Technical design](architecture/technical-design.md): middleware, shared
  errors, clients, and build/runtime ownership.
- [Development guide](development/development-guide.md): Nx tasks, shared
  imports, debugging, formatting, and commits.
- [Authentication development](development/authentication.md): OTP keys,
  account creation, login/JWT cookies, password recovery, and remaining work.
- [Testing](development/testing.md): existing coverage and E2E lifecycle limits.
- [Troubleshooting](development/troubleshooting.md): setup and runtime diagnosis.
- [Deployment and CI](operations/deployment.md): actual Dockerfile, ports,
  build artifacts, and workflow coverage.

## Evidence and maintenance conventions

**Present in source** means the reviewed files implement the behavior;
**configured** means a tool or target exists; **verified** requires a recorded
command and result. A source review alone does not establish working external
services or production readiness. **Proposed** and **undecided** identify future
designs and open decisions. See [implementation status](operations/implementation-status.md)
for the current verification boundary.

Diagrams use Mermaid and render on GitHub or in a Mermaid-enabled Markdown
preview. Each diagram states whether it describes current source or a proposal.
Keep diagrams next to the explanation and update both when behavior changes.

| Change                                      | Owning documentation                       |
| ------------------------------------------- | ------------------------------------------ |
| Routes, validation, public errors           | API reference and request flows            |
| Environment inputs or defaults              | Configuration reference and setup          |
| Client tokens, themes, or responsive scales | Design tokens and client README            |
| Service boundaries or dependencies          | Architecture overview and technical design |
| Files, aliases, build ownership             | Repository structure and development guide |
| Prisma schema or indexes                    | Database design                            |
| Packaging, networking, CI                   | Deployment and CI                          |
| Coverage or an unresolved limitation        | Testing and implementation status          |
| A future capability or refactor             | Future plans and its implementation task   |

Keep current contracts in their owning reference pages and link to them from
guides. When a proposal ships, update the current docs, record validation, and
mark or revise the corresponding plan. New accepted architecture decisions can
be recorded beside the relevant design when a real decision is made.
