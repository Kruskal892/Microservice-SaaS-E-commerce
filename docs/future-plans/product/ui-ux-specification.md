# UI/UX Specification

[Documentation index](../../README.md)

**Priority:** High. **Status:** Proposed; no frontend, routes, components, or design
assets exist. **Reviewed:** 2026-10-21. Next.js is the documented direction.

## 1. Screens and navigation

| Proposed route   | Screen / user            | Content and actions                                   |
| ---------------- | ------------------------ | ----------------------------------------------------- |
| `/`              | Storefront / visitor     | Catalog entry and navigation                          |
| `/products`      | Catalog / visitor        | Products, pagination, availability, detail links      |
| `/products/[id]` | Product detail / visitor | Description, price, quantity, add to cart             |
| `/register`      | Registration / visitor   | Email/password, validation, sign-in link              |
| `/login`         | Login / visitor          | Credentials, generic failure, return to intended page |
| `/cart`          | Cart / customer          | Lines, quantity edit/removal, current total, checkout |
| `/checkout`      | Review / customer        | Review and submit; payment/shipping fields undecided  |
| `/orders`        | History / customer       | Own orders, dates, status, totals                     |
| `/orders/[id]`   | Order detail / customer  | Immutable item snapshots and status                   |

Use persistent catalog/cart/account navigation. Protected journeys lead to login
and return to a safe local destination afterward. API ownership remains required.
No admin console, tenant switcher, or subscription pages are assumed.

## 2. Core flow

```mermaid
flowchart TD
    Browse[Browse catalog] --> Detail[Open product]
    Detail --> Identity{Signed in?}
    Identity -->|No| Login[Register or sign in]
    Login --> Detail
    Identity -->|Yes| Cart[Add or update cart]
    Cart --> Review[Review checkout]
    Review --> Validate{Server revalidation}
    Validate -->|Price or stock changed| Cart
    Validate -->|Accepted| Order[Order detail and history]
    Validate -->|Temporary failure| Retry[Keep cart and retry safely]
    Retry --> Review
```

Payment redirects and failure/confirmation screens depend on the provider and
order lifecycle. Never label an unverified order as paid or fulfilled.

## 3. Interface states

| Surface        | Proposed states and behavior                                                               |
| -------------- | ------------------------------------------------------------------------------------------ |
| Catalog/detail | Loading, populated, empty, missing, unavailable service, out of stock                      |
| Identity       | Idle, field validation, submitting, generic credentials error, success, rate limited       |
| Cart           | Loading, empty with catalog link, populated, updating, unavailable item, conflict, failure |
| Checkout       | Review, submitting, changed price/stock, recoverable failure, accepted order               |
| Orders         | Loading, empty, populated, not found, expired session, failure with retry                  |

Do not show failure as an empty list or a rejected mutation as success. Disable
repeat submission while pending; server idempotency still matters. On expiry,
prompt sign-in without exposing another user's data. Retain safe form input on
retry; do not persist passwords in browser storage.

## 4. Responsive and accessibility behavior

Use one column on narrow screens and expand grids on wider screens without
changing task order. Keep cart/checkout controls usable without horizontal scroll.
Breakpoints, colors, typography, and spacing are undecided; reuse the chosen
frontend design system when introduced.

Use semantic headings, labels, visible keyboard focus, meaningful link text and
image alternatives. Associate field errors, announce async feedback, and avoid
color-only meaning. Define and verify an accessibility target before launch;
this draft does not establish conformance.

## 5. Content and dependencies

Format money with currency; distinguish estimated cart totals from final order
snapshots. Use concise actions: Sign in, Add to cart, Review changes. Checkout copy
depends on tax/shipping/payment. Branding, imagery, verification/recovery, and guest
checkout need decisions. [Feature specification](feature-specification.md) owns behavior.
