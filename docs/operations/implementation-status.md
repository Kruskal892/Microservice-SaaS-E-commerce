# Implementation status

[Documentation hub](../README.md) · [Future implementation plan](../future-plans/implementation-plan.md)

**Reviewed:** Current-user GET, session-aware header/profile, client refresh,
and related documentation 2026-11-11; other areas retain their dated snapshots.
This inventory reflects source/configuration inspection, not full runtime verification.
The capability inventory and dated client sections describe the current UI.
Older dated sections retain historical implementation and validation records;
their UI details and command results do not verify the current working tree.

## Capability inventory

| Area                            | Present in source/configuration                                                                                                                                                                              | Remaining work                                                                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Workspace                       | Nx/npm, strict TypeScript, shared aliases and project references                                                                                                                                             | Verify relevant targets as code changes                                                                                                |
| Client scaffold                 | Session-aware header/mobile account links, read-only profile, shared current-user query, registration/OTP, login, recovery, home | Storefront, localization, browser/E2E checks |
| Design tokens                   | Tailwind v4 brand/status and light/dark semantic colors, font/type/spacing/radius scales (`--text-callout`), named breakpoints (`desktop:` 1440px auth split), pre-paint `data-theme` initialization         | Component styling across future storefront screens, font/browser and accessibility verification                                        |
| Shared UI                       | `@packages/ui` native/Radix controls, typed props/refs, shared tokens, overridable Button hover/active classes, Storybook states and play checks                                                             | Run authored play/a11y checks, browser verification, complete Figma draft, adoption checks in additional apps                          |
| Shared assets                   | Repo-wide SVG files and exports in `packages/assets` (all monochrome icons use `currentColor`, plus `GoogleIcon`, `SunIcon`, `MoonIcon`, `EyeIcon`, `EyeOffIcon`), typed SVG declarations, client SVGR rules | Additional-app bundler adoption and production validation                                                                              |
| Gateway                         | Local health, configurable auth proxy, in-memory quota, body limit, timeout, shared errors                                                                                                                   | E2E alignment, production identity/proxy policy, explicit upstream failure mapping                                                     |
| Registration                    | Validation/normalization, Prisma lookup, SET NX cooldown, INCR request counter, SMTP delivery, resend countdown                                                                                              | Verify bounded send timing, concurrency, and Redis/SMTP failures                                                                       |
| Verification and identity       | Shared registration validation/normalization, OTP validation, post-persistence matching-code cleanup, bcrypt hashing, unique email persistence                                                               | Run regression tests; verify live database indexes and failure handling                                                                |
| Login and JWT cookies           | Login POST, pending/error feedback, user-cache invalidation before redirect; bcrypt comparison, JWT cookies, public user response | Remember-me, commerce authorization, rotation/revocation, logout, browser cookie/CSRF verification |
| Refresh and access verification | Protected current-user GET/no-store; cookie parsing, shared refresh Promise, one retry, guest state without public-page redirect | Rotation/revocation, live cookie/concurrency verification |
| Password recovery               | Recovery OTPs, atomic verification, five-minute single-use reset grants, conditional password update and notification                                                                                        | Existing JWT revocation, account enumeration mitigation, browser and live integration verification                                     |
| Data                            | Prisma 6.19 MongoDB users/images schema (unused imagesId removed), shared client wrapper, active write path                                                                                                  | Verify live connectivity, applied indexes, and seed/migration workflow                                                                 |
| Redis                           | Bounded ioredis client; native sending commands; Lua matching-code cleanup after account creation                                                                                                            | Atomic failed-verification updates, live checks, lifecycle cleanup                                                                     |
| API docs                        | Swagger 2.0 greeting and auth routes, including enabled single-use password reset                                                                                                                            | Cookie headers and complete validation/error contracts; contract-alignment tests                                                       |
| Tests                           | Greeting E2E specs, auth service regressions, Node client schema tests, Jest client auth message/retry tests                                                                                                 | Run authored tests; correct gateway E2E; integration/failure-path coverage                                                             |
| Packaging                       | Auth esbuild assets, gateway Webpack, prune targets, auth Dockerfile                                                                                                                                         | Verify generated dependencies, Prisma runtime and image startup                                                                        |
| CI                              | Node 24, npm ci, lint/test/build/typecheck, always-run nx fix-ci                                                                                                                                             | Explicit reliable E2E and delivery pipeline                                                                                            |
| Product                         | Draft requirements and proposed designs                                                                                                                                                                      | Storefront, catalog, cart, orders, payments, tenancy decisions                                                                         |
| Operations                      | Local greetings and listener error logs/exitCode                                                                                                                                                             | Readiness, drain/cleanup, ingress, monitoring, backups, production deployment                                                          |

## Known source limitations

- Backend password reset is enabled with expiring single-use authorization.
  The frontend recovery flow is connected; existing JWT revocation and account
  enumeration mitigation remain incomplete. Live delivery remains unverified; see
  [recovery details](../development/authentication.md#password-recovery).
- OTP cooldown uses `SET NX` and request counting uses `INCR`; the overall send
  sequence is not one transaction. Sending must finish within the 60-second cooldown;
  slower/background sending needs ownership checks. Registration failed-verification
  counters remain sequential and can race; recovery verification uses a Lua script. SMTP acceptance precedes OTP storage;
  a later Redis failure can leave delivery/storage unconfirmed.
- Gateway counters are process-local; direct auth access bypasses them. Auth
  mounts access-token verification on current-user GET, but future resource
  routes need their own authentication/authorization. Neither service trusts a
  configured production ingress. Login and refresh do not protect unrelated routes.
- Login checks field truthiness only and does not normalize email. Unknown users
  return 400 while wrong passwords return 401, revealing different failure cases.
  Missing parsed bodies or signing secrets can reach the generic 500 handler.
- Both JWT cookies always use Secure/HttpOnly/SameSite=None and a 7-day lifetime;
  access JWT validity is only 15 minutes. There is no environment override,
  refresh rotation, logout, persisted revocation state, or browser/CSRF verification.
  Refresh validates the existing refresh cookie and replaces only the access
  cookie without extending the refresh JWT expiry.
- Client login's remember-me checkbox is not submitted. Pending state now locks
  submission through the user-query invalidation; server errors clear on retry.
  The five-minute user cache drives UI only and is not authorization proof.
- The theme provider's executable-server/inert-client bootstrap workaround is
  present in `src/app/providers.tsx`; no browser/hydration verification followed it.
- Database synchronization and successful persistence against live MongoDB
  instances have no recorded evidence.
- Auth Jest has a shared-alias mapper and focused controller/helper regression
  and middleware tests; all 93 passed on 2026-11-10 with mocked infrastructure. Gateway E2E defaults to port 3000 and expects
  auth's greeting while starting only gateway.
- Docker uses a floating `node:lts-alpine` base and `npm --omit=dev -f install`.
  No explicit Prisma-generation step or non-root user is configured. Pruned
  runtime dependencies and container startup remain unverified.
- Each backend app directly listens and only sets `exitCode` on listener errors; there
  are no readiness probes or custom client shutdown handlers.

Detailed behavior belongs in [architecture](../architecture/overview.md),
[request flows](../architecture/request-flows.md),
[testing](../development/testing.md), and [deployment](deployment.md).

## Session-aware header and profile: 2026-11-11

- Current-user GET mounts `isAuthenticated`, returns only `{ id, email, name }`,
  and sets no-store. Header account actions show the user's initial and link to
  `/profile`; the compact menu also changes to a profile link.
- `currentUserQuery`/`useUser` share a five-minute cache, validate public fields,
  and map only final 401 to signed out. Login invalidates that cache before
  navigating. Profile has loading, read-only details, guest, and retry states.
- Axios shares one refresh Promise and retries each original request once.
  Guest current-user checks never force public pages to login; transient errors
  stay errors. Login/refresh bypass refresh interception.
- Permanent API/cache/refresh/controller regressions were added or updated but
  not run. Tests, lint, builds, and live browser verification remain unrun for
  this update. Historical counts below do not validate the new behavior.
- [Beginner session walkthrough](../development/session-flow.md) explains the
  requests, cookies, JWT expiry, cache, and remaining security work.

## Access-token refresh and shared middleware: 2026-11-10

- `POST /api/refresh-token` validates the `refresh_token` cookie, checks the user
  by ID, and returns 201 with a replacement 15-minute access JWT cookie. The
  refresh JWT/cookie is unchanged. Missing/rejected tokens or deleted users return
  401; infrastructure/configuration/signing failures use shared 500 handling.
- Auth mounts `cookieParser()` before routes. Shared `isAuthenticated` prefers
  the access cookie, then a header token, verifies claims, loads `req.user`, and
  calls `next()`. It returns 401 for rejected credentials and forwards unexpected
  errors. It is exported through `@packages/middleware` and the aggregate barrel.
- At this historical checkpoint the middleware was not mounted and frontend
  refresh/session restoration was absent; the 2026-11-11 update above adds both.
  Refresh rotation/revocation, logout, and role authorization remain absent.
  Existing JWTs, including refresh JWTs, are not invalidated by password reset.
- The workspace npm name remains `@microservice-eshop/shared`, consistent across
  the shared manifest, backend dependencies, and lockfile. `@packages/*` remains
  a source alias. No schema or environment-variable additions are required.
- Validation: 93 tests across three auth Jest suites and auth app/spec TypeScript
  project compilation passed. Swagger generation, documentation formatting,
  local links/anchors, JSON examples, and balanced source fences are checked in
  this refresh. Mermaid rendering was not rerun; local renderer dependencies
  are unavailable.
  No clean install, Nx application build, lint, E2E, browser, live MongoDB/Redis/SMTP,
  Docker, or remote CI verification is claimed.

## Registration OTP resend: 2026-11-06

Current simplified implementation:

- Resend reuses `/api/user-registration` through a separate registration mutation
  instance, preserving the submitted registration snapshot. Successful requests
  start a 60-second wall-clock countdown; server restriction waits resynchronize it.
  Background-tab catch-up, cleanup, pending-state guards, status/error feedback,
  and success-only code clearing are present in source.
- `sendOtp` coordinates private restriction and request-count helpers, then sends
  email and stores the code. Native Redis `SET NX` and `INCR` replace the reservation
  lifecycle and delivery Lua scripts. SMTP failure preserves the previous code and
  consumes quota/cooldown. The two-request limit and countdown are unchanged.
  Verification checks active locks before accepting even a matching code.
- Auth message/retry parsing now lives in `src/api/auth.ts`; `messages.ts` was
  removed. Its permanent tests moved to `auth.test.ts` with a small client Jest/SWC
  config for alias resolution. No dependency was added; tests remain unrun.
- Added backend resend and client retry-metadata regression tests; they were not
  run. Source-only auth/client TypeScript checks passed. Swagger was regenerated.
  No lint, builds, tests, browser flow, or live Redis/SMTP checks were run.

## Client login and theme provider: 2026-11-06

- `loginMutation` posts credentials to `/api/login` with `withCredentials: true`,
  `retry: false`, and the shared Axios timeout. The login page uses
  `next/navigation`, stores a server error locally, and redirects to `/` on success.
  It does not store the user projection, implement remember-me behavior, or protect routes.
- Query and theme providers now live in `src/app/providers.tsx`, mounted by the
  root layout. Theme bootstrap uses `text/javascript` on the server and
  `application/json` in the browser to avoid a client-created executable script.
  Theme preferences, system tracking, and cross-tab updates remain provider-owned.
- Updated current documentation and proposal baselines. Documentation formatting,
  stale-claim searches, and local link/diff inspection are static checks only.
  Tests, lint, builds, browser checks, and external services were not run for this refresh.
  Static checks passed across 39 Markdown files: 411 local file/heading links,
  13 JSON examples, balanced code fences, documentation formatting, and
  `git diff --check`. External URLs and Mermaid rendering were not checked.

## Signup reliability and safety: 2026-11-06

- Verification reuses registration validation and normalization. OTP helpers throw
  errors directly, and matching codes are consumed atomically after persistence.
  Hashing/database failures preserve the OTP; cleanup failure after account creation
  is logged without changing the successful response. Duplicate email writes are rejected.
- At this historical review, password reset returned 503 pending secure verification;
  the 2026-11-08 backend reset implementation supersedes that restriction. Removed the
  unused recovery controller wrapper and updated Swagger/API documentation.
- Failed registration requests offer **I received a code**, using submitted details.
  Removed the resend preview timer; resend remains disabled with an explanation.
- Added permanent auth regression tests; they were not run. Source-only auth/client
  TypeScript validation passed at that stage; later login/theme edits were not
  covered by those results. No lint, build, browser, or live API checks ran.

## Client registration/OTP verification and design token updates: 2026-11-05

Historical implementation record; current behavior is described in the
2026-11-06 sections above.

- Added `apps/client/src/api/` (`client.ts`, `auth.ts`, `messages.ts`, and
  `messages.test.ts`). `client.ts` configures an Axios instance with
  `NEXT_PUBLIC_API_URL` and a 15-second timeout. `auth.ts` exports
  `registrationMutation` (`POST /api/user-registration`) and `verifyOtpMutation`
  (`POST /api/verify-registration`), both with `retry: false`. `messages.ts`
  extracts validated non-empty server messages and provides `ECONNABORTED` /
  `ETIMEDOUT` timeout guidance and operation-specific fallbacks.
- Extended `apps/client/src/schemas/auth.schema.ts` with `verifyOtpSchema` and
  `VerifyOtpPayload` (trimming `name`/`email`, normalizing `email` to lowercase
  to match Redis OTP storage keys, and validating the 4-digit `otpCodeSchema`),
  with permanent tests in `auth.schema.test.ts`.
- Connected OTP verification in `apps/client/src/app/(routes)/sign-up/page.tsx`:
  registration success displays the server message and resets OTP verification
  state; OTP submission uses `signUpMutation.variables` so mid-flight form edits
  cannot mismatch the verified email, disables OTP/resend/change-email controls
  while verification is pending or succeeded, focuses `OtpInput` on error, and
  redirects to `/login` on success. Resend and `/login` submission remain
  unavailable previews.
- Added `--text-callout: 1.625rem` (`26px`) to `packages/ui/theme.css` and
  applied `text-callout` in `OtpInput` and `AuthCard`. Updated `AuthCard` to use
  the named `desktop:` (`1440px`) breakpoint for its split layout.

## Client theme toggle and dark-mode UI/UX improvements: 2026-11-03

The sign-up OTP preview now uses shared `OtpInput`, exported from `@packages/ui`.
It wraps the `input-otp` primitive with one visual box per digit, active-slot
styling, and a caret, while preserving one accessible underlying control.
It supports numeric filtering, configurable length, controlled/uncontrolled
string values, autocomplete, keyboard editing, paste, and native form/refs.
The page no longer manages digit arrays, input refs, or
focus/Backspace handlers. Unused resend/timer/user-data state was removed;
delivery, verification, and resend API integration remain unimplemented, and the
page retains its current OTP-preview flag. The page now has a four-digit-guarded
Verify code submit button and a Resend code button with a 60-second wall-clock
countdown, cleanup, and tab-visibility catch-up. Both actions show explicit
unavailable feedback while backend calls remain unwired. Permanent schema
checks for four-digit OTP submission were added but not run. Permanent Storybook checks were
added but not run.

For the OTP submit/resend change, the client/shared UI source typecheck passed
with project references disabled in memory and no emitted files. The normal
client project check remains blocked by `TS6305` for missing generated
`OtpInput` declarations. No build was run to generate them. Schema tests,
countdown behavior, browser rendering, and backend integration remain unverified.

The focused Storybook no-emit TypeScript check passed after adding `OtpInput`.
Formatting and Git whitespace checks passed. This does not verify story play
functions, browser autofill, real-device keyboards, or the full signup flow.

The auth pages now share `AuthCard` and use shared `Input type="password"` with
built-in eye/eye-off controls. The app-specific password wrapper and barrel were
removed. Password fields use normal flex flow, keep native props/refs and values,
follow disabled state, and suppress the native Edge reveal button. Permanent
Password and DisabledPassword Storybook play checks were added but not run.
The focused Storybook no-emit TypeScript check passed for this shared Input
migration; it does not run interaction checks or typecheck the entire client.
`/sign-up` validates name, email, password length, and
password confirmation using `signUpSchema`; a focused Node schema test was
added but not run. Neither auth form logs credentials. Signup posts validated
details to `/api/user-registration`, keeps submission busy during requests,
shows server/network errors, and opens OTP entry only on success. Login, OTP
verification, and resend remain unavailable previews. Google sign-in is disabled until
integration is implemented. Theme selection uses the shared `Switch` with
sun/moon indicators. Header actions are shared between the top row and sticky
navigation, with one sign-in link per group, quieter search styling, active-page
links, and wishlist access in the mobile menu. CSS sticky positioning replaces
the fixed scroll threshold; the disabled Departments button and empty badges
are omitted. No lint, build, test, or browser checks were run.

Documentation cleanup checked 36 Markdown files and 397 local file/heading
links, with no missing targets or unclosed code fences. Formatting was applied
to the 28 updated Markdown files, and Git whitespace checks passed. The
temporary `.nx/npm-cache` and old `debug-storybook.log` were removed. Permanent
schema tests, shared icon exports, and active app components were retained;
the schema test has not been run. External links and runtime behavior were not
verified by these documentation checks.

Added client light/dark mode switching, pre-paint theme initialization, new
`SunIcon` and `MoonIcon` assets, and dark-mode contrast fixes across the client
and shared SVG icons.

Key implementation details:

- Added `ThemeToggle` (`apps/client/src/components/common/ThemeToggle`) using
  `@packages/ui` `Switch`, `Icon` (`SunIcon` and `MoonIcon`), and
  `next-themes` `useTheme()` so multiple toggle instances stay synchronized.
  The switch is disabled until mounted to keep hydration markup consistent.
- `ThemeProvider` in `apps/client/src/app/layout.tsx` replaces the custom
  initialization script and DOM observer. It uses `data-theme`, the existing
  `theme` storage key, and a system default, with cross-tab synchronization and
  live system updates while that default is selected. `<html>` retains
  `suppressHydrationWarning`.
- Added `sun.svg` (`SunIcon`) and `moon.svg` (`MoonIcon`) to
  `packages/assets/icons/` and updated `profileIcon.svg`, `heartIcon.svg`, and
  `cartIcon.svg` from hardcoded `#000000` to `currentColor` so header icons
  adapt automatically in light and dark modes.
- Updated `Login` (`apps/client/src/app/(routes)/login/page.tsx`) to use the
  semantic `primary` `Button` variant instead of hardcoded black classes and
  added `dark:text-focus` on action links for dark-surface contrast.
- Added `border-b border-border` to the sticky `HeaderBottom` bar for clear
  separation on dark backgrounds. No lint, build, or test commands were run.

## Client login UI and Button hover override fix: 2026-11-02

Added the client `/login` page (`apps/client/src/app/(routes)/login/page.tsx`),
reusable `GoogleButton` component (`apps/client/src/components/common/GoogleButton`),
`GoogleIcon` asset (`packages/assets/icons/google-icon.svg`), client Zod auth
schema (`apps/client/src/schemas/auth.schema.ts`), and a lightweight Zod v4
resolver (`apps/client/src/utils/zod-resolver.ts`) for `react-hook-form`.

Key implementation details:

- `Login` uses `@packages/ui` `Card`, `Field`, `Label`, `Input`, `FieldError`,
  `Checkbox`, and `Button` with semantic theme tokens.
- Replaced `<Input type="checkbox" />` with `@packages/ui` `Checkbox` (`onCheckedChange`)
  to resolve the React controlled/uncontrolled input warning and avoid wrapping
  a checkbox inside the text-field flex container.
- Updated `@packages/ui` `Button` variants from `enabled:hover:bg-*` / `enabled:active:bg-*`
  to `hover:bg-*` / `active:bg-*` with `disabled:pointer-events-none` on the base
  button so consumer `hover:bg-*` and `active:bg-*` classes merge and override
  cleanly via `cn` (`tailwind-merge`).
- `onSubmit` and `GoogleButton` remain UI-only; `/sign-up` and `/forgot-password`
  routes are not yet implemented. No lint, build, or test commands were run.

## Common component library: 2026-10-27

Added Button, Badge, Card, Field/Label, Textarea, Checkbox, Switch, Select,
DropdownMenu, Modal, Tabs and Tooltip to the existing UI folder. Native props,
refs, class overrides and Radix controlled/uncontrolled APIs are preserved.
Shared action/foreground/overlay tokens are additive; app typography stays local.

Storybook uses React/Vite, Tailwind, SVG transforms, autodocs, controls,
accessibility tools, theme/RTL switches and Button pseudo-state previews.
Permanent play checks are authored but were not run. The Storybook index lists
56 stories and 16 autodocs pages; local documentation links and manifest/lockfile
consistency checks pass. Focused Storybook
TypeScript checking passed and the local development server started. No lint,
production build or test suite was run. Browser/accessibility conformance and
full application integration remain unverified. Figma quota blocked the reserved
cover/token sheets and post-fix visual checks; Code Connect is unavailable for
the current plan/seat. The design document records those limitations.

See [design and Figma](../design/shared-ui-system.md),
[component recipes](../reference/common-components.md) and
[Storybook workflow](../development/storybook.md). The workspace advisory check
still reports existing framework/tooling vulnerabilities; no unrelated dependency
upgrade or automatic audit fix was applied.

## Client and conflict resolution: 2026-10-27

Historical snapshot; current fonts, routes, and header behavior are documented
in the [client guide](../../apps/client/README.md).

Resolved the stash conflicts by keeping the Header folder move, new SVG exports,
and automatic icon registry. Restored shared Input, `cn`, theme, SVG types,
SVGR rules, client aliases, shared TSX configuration, and manifest/lockfile
entries from the existing shared-UI commit. Removed the duplicate old Header.
Header barrels use extensionless exports; the layout barrel explicitly forwards
a named Header. The body uses Roboto, the header input uses Poppins, and metadata
uses MicroShop. `HeaderBottom` is now rendered inside `Header` with sticky scroll
behavior, navigation links, and mobile menu.

Verification recorded for that snapshot: no unmerged Git index entries or conflict markers remain;
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
At the time of this dated review, there was no shared UI rendering spec or
configured UI test target. The later common-component section records Storybook.

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
