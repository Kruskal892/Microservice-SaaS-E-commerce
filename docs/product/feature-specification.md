# Feature Specification

[Documentation index](../README.md)

**Priority:** Critical. **Status:** Current foundation and proposed product behavior.
**Updated:** 2026-10-14. Requirement IDs refer to the [PRD](prd.md); draft paths are
owned by the [API specification](../api/api-specification.md).

## 1. Current foundation

| Feature              | Trigger and result                                             | Limits                                                  |
| -------------------- | -------------------------------------------------------------- | ------------------------------------------------------- |
| Auth scaffold        | Auth GET / returns 200 and Hello API JSON                      | No identity, credentials, state                         |
| Local gateway health | GET /gateway-health returns 200 and gateway JSON               | Not dependency readiness; subject to limiting           |
| Forwarding           | Other gateway paths retain their path and go to localhost:6001 | Auth only implements GET /                              |
| Rate limiting        | Normally 100 requests per raw IP per 15 minutes, then 429 JSON | Memory store and proxy/IP limitations; no verified user |

Auth also registers the shared error handler after routes. Its source defines
application-error and generic 500 response shapes; those responses have not
been runtime-verified. See the [API specification](../api/api-specification.md#shared-error-handler-auth-service).
Configured tests do not validate this handler or the proposed features below.

## 2. Identity (PR-01, PR-07) - proposed

Visitors register with email/password; the server validates and normalizes email,
enforces uniqueness, and stores only a password hash. Invalid input produces no
partial account. Login rejects invalid credentials generically, creates the chosen
session, and exposes no credential material. Current-user lookup returns a public
profile; logout invalidates the session.

Acceptance: duplicate registration cannot create two accounts; invalid login
creates no session; expired/revoked sessions return 401; logout prevents reuse.
Decide credential policy, verification/recovery, session transport/expiry, and
browser security before implementation. No role or tenant model is established.

## 3. Catalog (PR-02) - proposed

Visitors request a bounded, stably paginated active-product list and product detail.
Responses contain name, description, currency, price, and availability. Inactive
products are hidden; missing/inactive detail returns 404. Active out-of-stock items
remain visible but cannot be added to cart.

Acceptance: invalid queries rejected; list/detail prices consistent; pagination
does not lose items with equal timestamps. Search, variants, promotions, reviews,
and categories are deferred until specified.

## 4. Cart (PR-03) - proposed

One authenticated customer has one active cart. Set a positive integer quantity;
an existing product updates its single line. Explicit removal deletes it. Empty
lookup returns an empty collection. Cart pricing reflects current catalog values
and is not a checkout guarantee.

Acceptance: validate quantities and active stock, persist changes, and derive
ownership from the session rather than submitted customer IDs. Select a version
conflict policy for concurrent edits. Guest carts and login merging are deferred.

## 5. Checkout and orders (PR-04) - proposed

The customer reviews and submits with an idempotency key. The server reloads
products, validates stock, computes totals, and snapshots names/prices/quantities/
currency. A price or stock change requires review rather than silent acceptance.

The same key/request returns the original order; conflicting reuse is rejected.
Stock mutation and order creation require an atomic or compensating strategy.
Failure must preserve a recoverable cart and avoid unexplained reservations.
Order confirmation does not establish payment success.

Acceptance: repeated submission cannot duplicate an order; client totals cannot
override pricing; concurrent checkout cannot make stock negative. Decide payment,
stock reservation, tax, shipping, and status transitions before customer checkout.

## 6. Order history (PR-05) - proposed

Customers list/open only their own orders, including stable item snapshots and
status. Empty history returns an empty list. Missing or another customer's order
returns 404 without disclosing ownership. Catalog edits never rewrite history.
Cancellation, fulfillment, refund, and operator transitions remain undecided.

## 7. Shared failures and interface (PR-06 to PR-08)

Proposed product errors: 400 invalid input, 401 absent/expired identity, 404 missing
resource, 409 state conflict, 429 rate rejection, and sanitized server errors.
Final envelope and upstream failure mapping belong in the API contract. Current
scaffold errors remain unchanged.

Prevent repeated submissions while pending, retain safe input on recoverable
failure, and show retry/sign-in actions. See [UI/UX](ui-ux-specification.md) and
[TDD](../architecture/technical-design.md).
