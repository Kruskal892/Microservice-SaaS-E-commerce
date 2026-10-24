# Product Requirements Document

[Documentation index](../../README.md)

**Priority:** Critical. **Status:** Proposed baseline based on repository direction,
not an approved business brief. **Reviewed:** 2026-10-25.

## 1. Product context and problem

Microservice Eshop aims to offer an ecommerce storefront backed by service APIs.
Customers need to find products, manage a cart, and place and review orders.
Developers need an Nx workspace with explicit service ownership and contracts.
Today gateway/auth source includes greetings, registration/OTP delivery,
verification/account persistence, and login with access/refresh JWT cookies.
Protected requests, refresh/logout, and the customer purchase journey remain
unfinished; live identity integrations are unverified. See
[current implementation status](../../operations/implementation-status.md).

The repository name includes SaaS, but tenant isolation, subscriptions, merchant
onboarding, and billing are undefined. This draft assumes one storefront for the
first increment; multi-tenancy requires a separate product/security decision.

## 2. Users and goals

| User                 | Proposed goal                                         | Current availability                                                                          |
| -------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Visitor              | Browse products and prices/availability               | Next.js scaffold and Tailwind tokens only; no storefront/catalog features                     |
| Customer             | Register, sign in, manage cart, place/view own orders | OTP/account creation and login/JWT issuance in source; identity lifecycle/commerce incomplete |
| Catalog operator     | Maintain sellable products and stock                  | Role/interface undecided                                                                      |
| Developer / operator | Run services and deploy safely                        | Local tooling configured; production absent                                                   |

## 3. Scope and requirements

| ID    | Proposed requirement                                          | Priority | Completion evidence                                                   |
| ----- | ------------------------------------------------------------- | -------- | --------------------------------------------------------------------- |
| PR-01 | Registration, login, logout, current-user lookup              | Critical | Valid credentials work; duplicates and unauthorized requests rejected |
| PR-02 | Product list/detail with authoritative price and availability | Critical | Discoverable products and missing/unavailable states                  |
| PR-03 | Customer-owned persistent cart with validated quantities      | Critical | Add/update/remove works; cross-user access denied                     |
| PR-04 | Checkout creates orders with immutable item/price snapshots   | Critical | Revalidation and retries prevent incorrect totals/duplicates          |
| PR-05 | Own order history/detail                                      | Critical | Ownership enforced; catalog edits cannot rewrite orders               |
| PR-06 | Responsive and keyboard-accessible interface                  | High     | Core flows and failure states verified on narrow/wide screens         |
| PR-07 | Explicit API contracts, validation, consistent failures       | Critical | Routes and failure cases match the contract                           |
| PR-08 | Reproducible setup, meaningful checks, production operations  | High     | Setup and release/rollback procedures validated when implemented      |

The first proposed slice is one customer account, catalog, cart, and order journey.
Catalog management may start with a controlled seed/operator process; public admin
APIs are not assumed. Payment collection is needed before claiming paid checkout,
but its provider and lifecycle are undecided.

## 4. Deferred capabilities

Redis already stores OTP state. Additional caching/shared-counter uses, Kafka,
Socket.IO, Firebase, TensorFlow.js, cloud assets, AWS, and Cloudflare remain
directions. Add each for an agreed use case. No ML benefit, payment
success, tenant isolation, sales volume, or deployment capability is claimed today.

## 5. Quality requirements

- Enforce authentication and resource ownership on the server; protect secrets
  and never expose password hashes.
- Calculate money on the server in integer minor units with an explicit currency.
- Make order creation safe under retries and concurrent stock changes.
- Provide loading, empty, validation, unavailable, and recoverable retry states.
- Agree measurable latency, availability, capacity, retention, and accessibility
  targets before launch; numerical targets have not been supplied.

## 6. Measures and dependencies

Proposed measures: register-to-order completion, checkout failure rate,
duplicate-order count, and customers' ability to retrieve their orders. Targets,
analytics consent, measurement windows, and launch dates are undecided.

Dependencies: identity/session strategy, data ownership, catalog data, currency
and stock policy, payments/shipping/tax, and operational ownership. See
[features](feature-specification.md) and [plan](../implementation-plan.md).

## 7. Decisions needed

Confirm audience and single-store/tenant scope, account verification/recovery,
guest checkout, catalog ownership, currency, tax, shipping, cancellation/refunds,
payment provider, production region, and retention. These are implementation gates.
