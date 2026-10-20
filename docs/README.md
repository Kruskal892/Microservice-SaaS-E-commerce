# Project documentation

Microservice Eshop is an Nx/npm TypeScript monorepo with an Express API gateway,
an authentication service, and shared infrastructure modules. Registration can
request an email OTP; account creation, login, storefront, and commerce remain
unfinished. **Source reviewed: 2026-10-21.**

## Start here

| Need                                   | Read                                                         |
| -------------------------------------- | ------------------------------------------------------------ |
| Set up and run the project             | [Getting started](development/getting-started.md)            |
| Understand the system                  | [Architecture overview](architecture/overview.md)            |
| Find code and understand dependencies  | [Repository structure](architecture/repository-structure.md) |
| Follow a request or OTP email          | [Request flows](architecture/request-flows.md)               |
| Call an available endpoint             | [API reference](reference/api.md)                            |
| Configure a service                    | [Configuration reference](reference/configuration.md)        |
| Assess what exists and what is missing | [Implementation status](operations/implementation-status.md) |
| Review proposals and upcoming work     | [Future plans](future-plans/README.md)                       |

## Documentation map

```text
docs/
|-- README.md
|-- architecture/                  # Current system and design explanations
|   |-- overview.md                # Components, boundaries, technology
|   |-- repository-structure.md    # Code ownership, workspace and build graph
|   |-- request-flows.md           # HTTP, OTP, and error flow diagrams
|   |-- database-design.md         # Actual Prisma schema and ERD
|   `-- technical-design.md        # Current implementation patterns
|-- reference/                     # Exact current contracts
|   |-- api.md
|   `-- configuration.md
|-- development/                   # Contributor guides
|   |-- getting-started.md
|   |-- development-guide.md
|   |-- authentication.md
|   |-- testing.md
|   `-- troubleshooting.md
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
  delivery behavior, and remaining implementation work.
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

| Change                               | Owning documentation                       |
| ------------------------------------ | ------------------------------------------ |
| Routes, validation, public errors    | API reference and request flows            |
| Environment inputs or defaults       | Configuration reference and setup          |
| Service boundaries or dependencies   | Architecture overview and technical design |
| Files, aliases, build ownership      | Repository structure and development guide |
| Prisma schema or indexes             | Database design                            |
| Packaging, networking, CI            | Deployment and CI                          |
| Coverage or an unresolved limitation | Testing and implementation status          |
| A future capability or refactor      | Future plans and its implementation task   |

Keep current contracts in their owning reference pages and link to them from
guides. When a proposal ships, update the current docs, record validation, and
mark or revise the corresponding plan. New accepted architecture decisions can
be recorded beside the relevant design when a real decision is made.
