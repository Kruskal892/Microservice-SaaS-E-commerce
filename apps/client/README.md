# Client

Next.js App Router scaffold with React and Tailwind CSS v4. The current UI
includes `Header` (with desktop navigation, product search,
account/wishlist/cart links, and a light/dark `ThemeToggle`), a placeholder `/`
page, and `/login` and `/sign-up` forms built with shared `@packages/ui`
controls, `AuthCard`, React Hook Form, and Zod validation. Registration, OTP
verification, resend, and login requests are connected. A shared current-user
query drives signed-in header navigation and a read-only `/profile` page. Storefront screens,
commerce flows, and localization are not implemented.

## Run and check

Install dependencies at the repository root with `npm ci`, then run:

```sh
npm run client
```

Open `http://localhost:3000`. `npm run dev` starts the backend `serve` targets;
the client uses a separate `dev` target. The placeholder UI renders without backend
credentials. To use registration or login, set `NEXT_PUBLIC_API_URL` to the API gateway
origin (for example, `http://localhost:8080`) in `apps/client/.env`, and start the
backend services with their required MongoDB, Redis, and SMTP configuration.

```sh
npx nx build @microservice-eshop/client
npx nx start @microservice-eshop/client
node node_modules/typescript/bin/tsc -p apps/client/tsconfig.json --noEmit
```

Run these commands from the repository root. Use `npm.cmd` or `npx.cmd` if
PowerShell blocks the `.ps1` wrappers. Build before using `start`.

## API requests and TanStack Query

Use [`src/utils/axiosInstance.ts`](src/utils/axiosInstance.ts) for HTTP requests.
It configures `NEXT_PUBLIC_API_URL`, credentials, and a 15-second timeout once.
API feature modules such as [`src/api/auth.ts`](src/api/auth.ts) own request payloads, response data, and
TanStack options. Define each request inline in its `mutationFn` or `queryFn`,
return the response data, and let failures reject so TanStack can track the error
state.

Every auth mutation follows one schema-driven pattern:
`payload: z.input<typeof schema>` derives its TypeScript input, and
`schema.parse(payload)` validates/transforms the body before Axios sends it.
Registration uses `registrationSchema` without the form-only confirmation field.
Named form-value types remain available for React Hook Form; API request types
come directly from their request schemas.

Export `mutationOptions({ mutationKey, mutationFn, ... })` for writes, and
`queryOptions({ queryKey, queryFn, ... })` for reads. Consumers pass those options
to `useMutation` or `useQuery`; a custom hook is only needed when it adds shared
behavior. Include the resource and operation in keys, and include request
parameters in query keys. Never put passwords or OTP codes in keys.

The sign-up page spreads `registrationMutation` and `verifyOtpMutation` into
`useMutation` and owns its OTP transitions, form errors, and `/login` redirect.
Resend uses a separate `useMutation` instance with the same `registrationMutation`
options and submitted details. This preserves the original registration snapshot
and reuses `/api/user-registration` rather than adding a duplicate endpoint.
The login page uses `loginMutation` to post `{ email, password }` to `/api/login`
with `withCredentials: true`, then navigates to `/` with `next/navigation`.
The mutation returns a validated message. On success, the page cancels an older
lookup and invalidates the
shared `currentUserQuery` (`['user']`), awaits the active refetch, then navigates
home. `useUser` shares this query between header actions, the mobile menu, and
`/profile`. It validates the public user response, caches it for five minutes,
and maps a final 401 to `null`. Stale queries can refetch on focus; no polling or
localStorage token storage is used. Network/server errors stay errors.
On a protected request's 401, the
Axios interceptor shares one `POST /api/refresh-token` call across waiting requests
and retries each request once. Refresh failure rejects every waiter. A refresh
401 redirects other protected requests to `/login`; current-user checks leave
public pages open and show signed-out state. Server/network failures never force
that redirect. Login and refresh preserve their own errors without starting
another refresh. See the [session walkthrough](../../docs/development/session-flow.md) and
[refresh contract](../../docs/reference/api.md#access-token-refresh). The page currently owns a
`serverError` message and reads the Axios response message with a fallback.
Use `getApiErrorMessage` from [`src/api/auth.ts`](src/api/auth.ts) for
validated server messages, timeout guidance, and an operation-specific fallback.
The helper preserves the original error for status/code checks and does not
expose arbitrary error text.

Keep shared cache invalidation in the feature's mutation options. For page-only
navigation or messages, `mutate(variables, { onSuccess, onError })` adds callbacks
without replacing shared callbacks; these run only while the consumer remains
mounted. If overriding callbacks through an options spread, call the shared
callback explicitly when one exists. Use `onMutate` for optimistic updates only
when the feature needs them, with rollback in `onError`. All three auth mutations
set `retry: false` so failed requests are not automatically repeated.

Permanent API message regression tests can be run explicitly:

```sh
node node_modules/jest/bin/jest.js --config apps/client/jest.config.cts --runInBand
```

## Styling and theme switching

[global.css](src/app/global.css) imports the supplied design tokens from
[the shared theme](../../packages/ui/theme.css) and registers `packages/ui` as a
Tailwind source. The root layout imports it; [postcss.config.mjs](postcss.config.mjs) uses `@tailwindcss/postcss`.
Use semantic utilities such as `bg-background`, `bg-surface`, `text-text`,
`text-muted`, and `border-border`. They follow `data-theme="dark"` or `.dark`
on the document root.

`providers.tsx` wraps the app in `next-themes` `ThemeProvider` with
`attribute="data-theme"` and `defaultTheme="system"`. The provider supplies the
startup script, persists the preference under the existing `localStorage`
`theme` key, and synchronizes browser tabs. System changes are followed while
the preference is `system`. Selecting a mode with the theme button saves an
explicit preference. There is no System option in the current UI; use
`setTheme('system')` to resume following the OS.
The startup script is executable in server HTML and inert on client remounts;
the provider's effects apply theme changes in the browser.
[`ThemeToggle`](src/components/common/ThemeToggle/ThemeToggle.tsx) uses
`useTheme().resolvedTheme` to display the effective mode and `setTheme()` to
select `"light"` or `"dark"`. The button is disabled until mounted to keep the
server and initial browser markup consistent. Existing CSS tokens and
`dark:*` selectors continue to work without a custom DOM observer.

The shared theme bundles DM Sans from `packages/assets/fonts/` with its OFL
licence. The client and Storybook use the same `font-sans` family, including
headings, controls and wordmark; no Google font download is needed. See the
[monochrome design specification](../../docs/design/eshop-monochrome.md).

See the [complete token reference](../../docs/reference/design-tokens.md) for
colors, type, spacing, radii, breakpoints, and utility examples. Use the client
`@/*` alias for `src/*`; keep server-only Prisma/Redis modules out of client code.

## Reusable components and Storybook

The shared UI library includes common buttons, form controls, menus, modals,
tabs, tooltips, badges and cards. Import from `@packages/ui`. App-level common
components live in `src/components/common` (`AuthCard`, `GoogleButton`, and `ThemeToggle`,
exported through `@/components`). Run `npm run storybook` from the
repository root and open port 6006 for examples, state previews and controls.
See [component recipes](../../docs/reference/common-components.md),
[design contract](../../docs/design/shared-ui-system.md), and
[Storybook workflow](../../docs/development/storybook.md).

## Shared input and form validation

`OtpInput` is exported from `@packages/ui` and displays one box per digit, with
active-slot highlighting and a caret. Its `input-otp` primitive owns keyboard
editing, selection, paste, and one-time-code autocomplete. The
sign-up page uses a controlled string value and `onValueChange` with a single string;
it no longer keeps an array of digits, input refs, or focus/Backspace handlers.
Registration is the initial state. Validated details are posted to
`${NEXT_PUBLIC_API_URL}/api/user-registration`; a successful response opens
the OTP UI automatically. The submit button stays busy during the request, and server errors
appear on the registration form with a fallback for network failures. A successful
response supplies the visible OTP status message, with fallback text if the
server omits a usable message. Both
branches remain in the sign-up route. Change email returns to the preserved
registration details. The OTP description and verification payload use the
submitted mutation variables, so edits made while registration is pending do not
change the email or credentials being verified. OTP submission validates exactly four numeric digits,
focuses invalid input and preserves leading zeros. Verification posts name, email,
password, and OTP to `/api/verify-registration`. It normalizes email to match the
backend's OTP storage key, disables conflicting actions while pending, displays
request errors, and redirects to `/login` on success.
After a failed registration request, **I received a code** opens OTP entry using
the submitted details, so a lost response does not strand an emailed code.
Successful initial delivery and resend start a 60-second wall-clock countdown.
The timer catches up after background tabs and cleans up on leaving OTP entry.
When enabled, **Resend code** posts the submitted registration details. Verification,
OTP editing, resend, and change-email actions cannot conflict while a request is
pending. Success clears the previous code and asks for the latest emailed code;
failure keeps the entered code and displays a separate error. Server cooldown/lock
responses include `details.retryAfterSeconds`, which resynchronizes the countdown.
Timeout feedback asks users to check email because delivery may still have completed.
The server permits two admitted requests per counter window, including initial
delivery. Resend does not reset failed verification attempts.
See the [OTP recipe](../../docs/reference/common-components.md#otp-input).

Import `Input`, `Field`, `Label`, `FieldError`, and `Checkbox` from `@packages/ui`.
`Input` supports native input props, React 19 refs, and token-based light/dark
defaults. `className` styles the flex field wrapper; `inputClassName` styles the
native input. Optional icons occupy their own flex space at the start or end.
`iconContainerClassName` styles the icon container; `iconClassName` styles
registered SVG icons. The header uses it in a labelled search form; the results route/backend
remain unimplemented. See [shared UI](../../docs/reference/shared-ui.md)
for examples and setup in other apps.

Client form schemas live in `src/schemas/` (`loginSchema`, `signUpSchema`,
`otpCodeSchema`, and `verifyOtpSchema` in
[auth.schema.ts](src/schemas/auth.schema.ts)) using `zod`, paired with the local
[`zodResolver`](src/utils/zod-resolver.ts) for `react-hook-form`.

Shared SVG files live in `packages/assets/icons/`; use `icon="SearchIcon"`,
`icon="LockIcon"`, or render `<Icon name="GoogleIcon" />`, `<Icon name="SunIcon" />`,
or `<Icon name="MoonIcon" />`. The Next config uses
the installed SVGR loader in Turbopack and Webpack. Restart development after
config changes; see the shared UI guide to register more icons.

The current standalone client typecheck stops at `TS6305` when shared-library
declaration output is missing. This source-only review did not build it. The
shared `Icon` supplies an overridable `size-5` default; see
[review status](../../docs/reference/shared-ui.md#review-status).

## Header and common components

The root layout renders the default export from `components/layout/Header`.
Its folder contains `Header.tsx` (sticky wordmark/search/actions shell),
`HeaderBottom.tsx` (desktop links and a compact Radix dialog navigation), and
`HeaderActions.tsx` (account/cart/wishlist/theme actions). Full navigation starts
at 1024px. Below 390px, the account shortcut moves into the navigation menu.
The mobile dialog closes after navigation or Escape and restores focus through
the shared Modal. There is one theme action, a native toggle
button with a stable Dark mode label and `aria-pressed`. `AuthCard` uses a split
introduction/form at desktop widths and one column on mobile.
`GoogleButton` remains disabled until OAuth is implemented.
Both `common` and `layout` are re-exported from `src/components/index.ts`.

The account action shows a user's initial and links to `/profile` when signed in,
or to `/login` when signed out. The compact menu follows the same state. While
checking, the action is not a sign-in link. Errors open `/profile` for retry.
Wishlist/cart links are unchanged. `/login` renders the
login form with backend submission and `/sign-up` renders registration and OTP verification.
`/forgot-password` connects email submission, recovery OTP verification, and new-password
confirmation to the backend. Resend respects server cooldowns and conflicting actions
are disabled while pending. Success provides a link back to sign in.
`/wishlist` and `/cart` do not exist yet and return the not-found page.
Wishlist/cart are not connected to data. Search submits `q` to `/products`, which is still a planned route. Metadata and
visible branding both use Eshop. No search backend is connected.

## Routes

| Route              | Current response                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `/`                | Placeholder page with the header, `ThemeToggle`, and sticky `HeaderBottom` navigation                               |
| `/login`           | Validated credential POST to `/api/login`, server error feedback, and redirect to `/` on success                    |
| `/profile`         | Current account name/email, initial loading state, retryable errors, or a sign-in prompt |
| `/sign-up`         | Registration and 4-digit `OtpInput` verification flow with Zod/RHF validation, TanStack Query mutations, and reveal |
| `/forgot-password` | Recovery email, four-digit OTP verification, new-password confirmation, and success with a sign-in link             |
| `/api/hello`       | Plain text `Hello, from API!` from a Next.js route handler                                                          |

Both auth forms validate locally. Signup sends validated registration details
to request an email code and verifies the 4-digit OTP to create the account and
redirect to `/login`. Login submits credentials with cookies enabled and redirects
to `/`. OTP resend reuses the registration request after its cooldown. Neither form logs credentials. Google sign-in is visibly
unavailable. `AuthCard` shares the page shell. Both pages use the shared
`<Input type="password" />`, which retains native input props and refs while
adding an accessible `EyeIcon`/`EyeOffIcon` button in the field's flex layout.
Sign-up enforces matching passwords and the backend's name, email, and password
length limits.

`signUpSchema` trims name/email, requires a name of 1–100 characters and a valid
email of at most 254 characters, and accepts passwords of 8–128 characters.
Confirmation must match the password; password whitespace is preserved.
`verifyOtpSchema` re-validates name, email, password, and the 4-digit `otpCodeSchema`
while normalizing email to lowercase. Client validation does not replace backend
validation.

For password fields, shared `Input` suppresses Edge's native `::-ms-reveal`
button so it does not duplicate the custom eye control. Other input types keep
their existing rendering. The reveal button follows `disabled` and never submits
the form. Keyboard access, password-manager overlays, and rendering still need
browser verification. The app-specific password wrapper has been removed.

A permanent focused schema test is available:

```sh
node --experimental-strip-types --test apps/client/src/schemas/auth.schema.test.ts
```

Login's **Remember me** checkbox is not included in the request and does not
change the backend's fixed cookie lifetime. Its loading indicator includes
mutation pending state through the post-login current-user refetch. Server
errors are stored locally and clear when another attempt starts.
The backend login lookup does not normalize email case. Browser cookie acceptance,
redirect behavior, and the theme script remount workaround remain unverified.

Recovery uses `forgotPasswordSchema`, `verifyRecoveryOtpSchema`, and
`resetPasswordSchema` for normalized email, four-digit codes, and matching 8-128
character passwords. The five-minute reset token stays in component memory and is
cleared after completion or restart. Sensitive mutation cache entries are discarded
when unused; no token is stored in a URL or browser storage. A failed reset requires
a fresh code, and a timeout advises trying sign-in first. Email-delivery failures
allow **I received a code** to open verification if a code arrived. Existing JWTs
are not revoked. Browser and live Redis/MongoDB/SMTP checks remain unrun.
The hello handler is separate from the Express gateway and auth endpoints.

Project-wide setup, architecture, checks, and limitations live in the
[documentation hub](../../docs/README.md).
