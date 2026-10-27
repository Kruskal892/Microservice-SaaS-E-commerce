# Implementation status

[Documentation hub](../README.md) · [Future implementation plan](../future-plans/implementation-plan.md)

**Reviewed:** Backend snapshot 2026-10-25; client/shared UI/assets source 2026-10-27.
This inventory reflects source/configuration inspection, not full runtime verification.

## Capability inventory

| Area                      | Present in source/configuration                                                                                                                     | Remaining work                                                                                                                  |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Workspace                 | Nx/npm, strict TypeScript, shared aliases and project references                                                                                    | Verify relevant targets as code changes                                                                                         |
| Client scaffold           | Next.js App Router, Header folder with search/account/wishlist/cart links, placeholder page, local hello handler, client aliases                    | Storefront routes/components, backend integration, state, localization, client tests                                            |
| Design tokens             | Tailwind v4 brand/status and light/dark semantic colors, font/type/spacing/radius scales, named breakpoints                                         | Theme controls/persistence, component styling, font/browser and accessibility verification                                      |
| Shared UI                 | `@packages/ui` flex Input, native refs/props, four styling hooks, typed start/end SVG icons, shared theme/source                                    | Browser/state/accessibility verification and adoption checks in additional apps                                                 |
| Shared assets             | Repo-wide SVG files and exports in `packages/assets`, typed SVG declarations, client SVGR rules for both bundlers                                   | Additional-app bundler adoption and production validation                                                                       |
| Gateway                   | Local health, configurable auth proxy, in-memory quota, body limit, timeout, shared errors                                                          | E2E alignment, production identity/proxy policy, explicit upstream failure mapping                                              |
| Registration              | Input validation/normalization, Prisma email lookup, Redis restrictions/counters, SMTP OTP                                                          | Concurrency, partial failures, permanent behavior coverage                                                                      |
| Verification and identity | Routed verification, Redis OTP check, 3-attempt lock, bcrypt hashing, Prisma user persistence                                                       | Consistent validation/normalization, OTP error contract and concurrency coverage                                                |
| Login and JWT cookies     | `POST /api/login`, bcrypt comparison, 15-minute access/7-day refresh signing, HTTP-only JWT cookies, public user response                           | Protected routes/token verification, refresh/rotation, logout/revocation, browser/CSRF validation                               |
| Password recovery         | Three public routes; recovery email template, corrected mail arguments, awaited OTP verification, and bcrypt password update                        | Critical: reset requires no verification proof; validation, purpose separation, token invalidation, live delivery, and coverage |
| Data                      | Prisma 6.19 MongoDB users/images schema (unused imagesId removed), shared client wrapper, active write path                                         | Verify live connectivity, applied indexes, and seed/migration workflow                                                          |
| Redis                     | Simple ioredis instance; string OTP, cooldown, attempt count, and lock keys                                                                         | Atomic admission, bounded failure policy, lifecycle cleanup                                                                     |
| API docs                  | Swagger 2.0 greeting and all six auth POSTs; required fields/examples; recovery defects and 400/500 responses; static `npm run auth-docs` generator | Cookie headers and complete validation/error contracts; permanent contract-alignment tests                                      |
| Tests                     | Two greeting E2E specs; auth Jest/SWC configuration                                                                                                 | Auth unit tests; correct gateway E2E; integration/failure-path coverage                                                         |
| Packaging                 | Auth esbuild assets, gateway Webpack, prune targets, auth Dockerfile                                                                                | Verify generated dependencies, Prisma runtime and image startup                                                                 |
| CI                        | Node 24, npm ci, lint/test/build/typecheck, always-run nx fix-ci                                                                                    | Explicit reliable E2E and delivery pipeline                                                                                     |
| Product                   | Draft requirements and proposed designs                                                                                                             | Storefront, catalog, cart, orders, payments, tenancy decisions                                                                  |
| Operations                | Local greetings and listener error logs/exitCode                                                                                                    | Readiness, drain/cleanup, ingress, monitoring, backups, production deployment                                                   |

## Known source limitations

- Recovery reset accepts a known email and replacement password without OTP,
  token, or session authorization. Verification now awaits the OTP result but
  creates no reset proof. Recovery mail arguments/template are corrected;
  live delivery remains unverified. Missing reset authorization is a release blocker; see
  [recovery details](../development/authentication.md#password-recovery-blockers).
- OTP checks/counters are sequential and can race. SMTP acceptance precedes OTP
  storage; a later Redis failure can leave an email without matching state.
- Gateway counters are process-local; direct auth access bypasses them. Neither
  service verifies credentials on subsequent requests or trusts a configured
  production ingress. Login issues tokens but does not protect other routes.
- Login checks field truthiness only and does not normalize email. Unknown users
  return 400 while wrong passwords return 401, revealing different failure cases.
  Missing parsed bodies or signing secrets can reach the generic 500 handler.
- Both JWT cookies always use Secure/HttpOnly/SameSite=None and a 7-day lifetime;
  access JWT validity is only 15 minutes. There is no environment override,
  refresh/logout consumer, persisted revocation state, or browser/CSRF verification.
- Verification forwards OTP errors with `next(error)` and then throws its return
  value; input normalization and error propagation need a consistent contract.
- Database synchronization and successful persistence against live MongoDB
  instances have no recorded evidence.
- Auth Jest has no shared-alias mapper or unit-test files. Gateway E2E defaults
  to port 3000 and expects auth's greeting while starting only gateway.
- Docker uses a floating `node:lts-alpine` base and `npm --omit=dev -f install`.
  No explicit Prisma-generation step or non-root user is configured. Pruned
  runtime dependencies and container startup remain unverified.
- Each backend app directly listens and only sets `exitCode` on listener errors; there
  are no readiness probes or custom client shutdown handlers.

Detailed behavior belongs in [architecture](../architecture/overview.md),
[request flows](../architecture/request-flows.md),
[testing](../development/testing.md), and [deployment](deployment.md).

## Client and conflict resolution: 2026-10-27

Resolved the stash conflicts by keeping the Header folder move, new SVG exports,
and automatic icon registry. Restored shared Input, `cn`, theme, SVG types,
SVGR rules, client aliases, shared TSX configuration, and manifest/lockfile
entries from the existing shared-UI commit. Removed the duplicate old Header.
Header barrels use extensionless exports; the layout barrel explicitly forwards
a named Header. The body uses Roboto, the header input uses Poppins, and metadata
uses MicroShop. `HeaderBottom` is exported but not rendered.

Remaining source findings:

- `/login`, `/wishlist`, and `/cart` are links only; route pages do not exist.
  Counts are static zeros and search has no submit handler or API.
- Wishlist/cart links expose only `0` as accessible text because icons are
  decorative; they need meaningful labels before release.
- New profile/heart/cart SVGs hardcode black, so text-color utilities cannot
  recolor them for dark mode.
- The header has no responsive layout variants. Narrow widths need browser
  verification.

Static verification: no unmerged Git index entries or conflict markers remain;
Git whitespace checks pass. All 31 documentation files were checked for local
file links (none missing); changed JSON parses and shared manifest dependency
versions match the lockfile. No lint, builds, typechecks, tests, or browser checks
were run for this refresh. Historical validation below applies only to its dated
snapshot.

## Shared UI review: 2026-10-26

The current source adds a reusable flex Input, named decorative start/end icons,
repo-wide SVG assets, shared Tailwind theme imports, `cn` dependencies, client
aliases/source inclusion, SVG typings, and SVGR configuration for Turbopack and
Webpack. `className` styles the field wrapper, `inputClassName` the input,
`iconContainerClassName` the icon area, and `iconClassName` the registered SVG.
There is currently no shared UI rendering spec or configured UI test target.

This pass reviewed the complete working diff, including existing configuration
edits. `nx.json` changes are formatting only, while `next-env.d.ts` points at the
dev-generated route declarations. Those files were preserved. The root shared
barrel now also exports UI; browser and Node consumers should use specific
folder entries to avoid mixing infrastructure with SVG/React dependencies.

Review comments addressed in source:

- The shared `Icon` merges a `size-5` default before caller classes. Input forwards
  `iconClassName` without duplicating the default, so custom sizes can override it.
- The header uses `bg-surface`, preserving contrast with inherited themed text.
  Its undefined Poppins class was replaced with the supplied `font-sans` token.
- Documentation now reflects the absence of rendering specs and removes the
  obsolete parent SVG size-selector restriction. Automated UI coverage remains
  unimplemented.

Validation for this pass:

- The standalone no-emit client typecheck was attempted with its cache directed
  to a temporary file. It stopped at `TS6305` for missing shared-library
  declaration output; this is not a successful typecheck of the implementation.
- Documentation formatting, JavaScript config syntax, and whitespace checks
  passed. All 357 local documentation links resolve to existing files; eight JSON
  configs/manifests parse, and shared dependency versions match the lockfile.
  These checks do not prove generated CSS or browser behavior.
- No lint, build, test suite, browser, backend runtime, or external-service check
  was run. Earlier successful checks below apply to their dated snapshots.

CI follow-up on 2026-10-26: the supplied GitHub Actions log showed 15 successful
tasks, including the client build, with only client lint failing. Local reproduction
identified `@typescript-eslint/triple-slash-reference` in `apps/client/index.d.ts`.
Replacing the path directive with `import '@packages/assets/svg'` fixed the error;
`npx.cmd nx run @microservice-eshop/client:lint --output-style=static --skip-nx-cache`
passed locally. The full CI pipeline, builds, and tests were not rerun for this fix.

See the [shared UI contract](../reference/shared-ui.md),
[assets guide](../../packages/assets/README.md), and
[testing instructions](../development/testing.md#client-styling-checks).

## Documentation verification boundary

The 2026-10-25 refresh adds the Tailwind token configuration and synchronizes
project documentation with the existing Next.js scaffold. The original header,
page, and layout are retained. No storefront, authentication UI, commerce flow,
or frontend API integration is implemented. The following checks passed on
Node.js 22.22.2 locally (CI is configured for Node.js 24):

- Client TypeScript check with
  `node node_modules/typescript/bin/tsc -p apps/client/tsconfig.json --noEmit`,
  using a temporary build-info path.
- Production client build with `node ../../node_modules/next/dist/bin/next build`
  from `apps/client`. Next.js 16.1.7 compiled `/`, `/_not-found`, and `/api/hello`.
  It emitted its warning that TypeScript project references are not fully
  supported and used incremental mode; the build completed successfully.
- Nx client target inspection confirmed `dev`, `build`, `start`, `serve-static`,
  `lint`, and dependency targets; no client `test` target was present.
- A temporary PostCSS/Tailwind check compiled 48 representative token utilities.
  Headless Edge checked computed background/text values for default light,
  `data-theme="dark"`, explicit light reset, and `.dark`, plus sample font size,
  radius, and spacing values.
- Prettier across 29 Markdown documents and the token CSS; 321 local file/heading
  links, balanced fences, and 12 JSON examples checked without errors.
- All 26 Mermaid diagrams rendered with Mermaid 12.2.0 in headless Edge.
- The original header content and single placeholder page were verified, and
  `git diff --check` passed.

No backend build, lint, unit/E2E suite, live MongoDB/Redis/SMTP/authentication,
Docker, remote CI, or deployment check was run for the token change. Browser
checks above validate CSS values and documentation diagrams, not a storefront
journey. Historical results below remain separate.

The 2026-10-23 recovery refresh reviews the entire working-tree diff, adds the
three routed contracts and known blockers to current documentation, and updates
Swagger annotations/generated JSON. It changes no runtime authentication logic.
Swagger generation, formatting, and Git whitespace inspection are documentation
checks only. No lint, builds, application tests, or live integrations were run
for this refresh. A follow-up adds the recovery email template and corrects the mail argument order; OTP verification is now awaited in the current source. No live mail or application checks were run. The historical checks below were not rerun.

The 2026-10-22 refresh covers current login/cookie source, Swagger changes,
manifests, configuration examples, and the existing schema/tests/build/CI setup.
Passed checks are recorded with the PR description:

- Focused shared-library/auth TypeScript project compilation with
  `node node_modules/typescript/bin/tsc -b packages/tsconfig.lib.json apps/auth-service/tsconfig.app.json --pretty false`.
- `npm run auth-docs`, generated route/request/response example assertions, and
  equivalent generation from the root and source directory.
- Prettier across README/docs/PR description; local file/heading links, JSON
  examples, balanced code fences, and Git whitespace checks.

Application unit/E2E tests, lint, Nx application builds, live login/browser
behavior, MongoDB/Redis/SMTP connections, Docker, and remote CI were not run.
Mermaid source was updated alongside routing/login explanations; diagram rendering
is reported separately in the PR description. These checks do not establish live
authentication or deployment readiness.

All future plans are grouped in [future-plans](../future-plans/README.md).
They are proposals, not completed capabilities or a committed delivery schedule.
