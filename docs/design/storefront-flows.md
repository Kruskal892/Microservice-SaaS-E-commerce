# Page & flow specification

This is the behaviour reference for the proposed customer site. Header, login
and sign-up UI are implemented, including registration, OTP verification, and login
requests. Resend reuses registration delivery with a server-enforced cooldown. Other
storefront routes/APIs, session-aware UI, and recovery
remain planned. Backend password reset supports expiring single-use authorization; frontend email, OTP, password confirmation, and success states are connected.
All product, shop, address, price, policy and order
data is illustrative. Currency and dates must be formatted from the actual
market/data when implemented; this proposal does not establish business policy.

## Screen inventory

Each of these has a 1440 px desktop and a 390 px mobile SVG.

| ID  | Page               | Main purpose                                                         |
| --- | ------------------ | -------------------------------------------------------------------- |
| 01  | Discover           | Product-led introduction, categories, featured finds and shops       |
| 02  | Products           | Filter/sort a catalogue; navigate through result pages               |
| 03  | Search             | Show relevant results for the submitted query                        |
| 04  | Product detail     | Inspect gallery, option, quantity, availability and delivery context |
| 05  | Shop directory     | Discover independent shops                                           |
| 06  | Shop storefront    | Shop identity and its product selection                              |
| 07  | Offers             | Show a real reduced price, original price and saving                 |
| 08  | Login              | Sign in, recover access or open registration                         |
| 09  | Sign-up            | Collect name/email/password/confirmation                             |
| 10  | Verification       | Verify the registration email; change email or request another code  |
| 11  | Forgot password    | Request a recovery email without exposing account existence          |
| 12  | Reset password     | Set a new password after server-verified recovery proof              |
| 13  | Wishlist           | Review saved products and add an available product to cart           |
| 14  | Cart               | Review quantities and subtotal before checkout                       |
| 15  | Checkout           | Contact, address, payment and final total                            |
| 16  | Confirmation       | Order reference, delivery context and order link                     |
| 17  | Profile            | Edit personal details and reach password settings                    |
| 18  | Orders             | Scan order status, items and totals                                  |
| 19  | Order detail       | Delivery status, items and total paid                                |
| 20  | Seller application | Submit a shop introduction; this is not a seller dashboard           |
| 21  | Not found          | Recover through product browsing or search                           |
| 22  | Addresses          | Add, edit, choose a default or remove saved addresses                |
| 23  | Help & contact     | Delivery/returns guidance and contact form                           |

Additional files: dark desktop Discover; dark desktop/mobile Login;
light/dark foundation and component boards; state/overlay board.

Dark versions of every page are not separately drawn. Apply the dark semantic
roles from the boards; do not invert product media. Tablet behaviour is defined
in the main specification, rather than supplied as a third full set of frames.

## Browse to purchase

```text
Discover → Products / Search / Shop / Offers
                         ↓
                    Product detail → Wishlist
                         ↓                ↓
                        Cart ←────────────┘
                         ↓
                      Checkout
                         ↓
                    Confirmation → Order detail
```

Product cards have a product link and a separate save action. Search accepts
Enter and retains its query in the results URL. Filters/sort/page are reflected
in the URL so browser Back and shared links work. Loading retains the layout
with skeletons; zero results offers clear/reset; a fetch failure offers retry.

The product page must describe the selected option and current availability.
Quantity cannot exceed valid stock or fall below one. Add-to-cart shows a
pending state, then a clear success with a View cart action. A failed add keeps
the current selection. An unavailable product replaces the purchase action
with a clear out-of-stock state rather than accepting a misleading click.

The cart retains quantities on errors, recomputes totals from authoritative
data, and distinguishes subtotal from final total. A remove action has an undo
or confirmation path. Empty cart links back to products. Do not show a stock,
delivery or discount promise that has not come from the actual system.

Checkout is one page in this design. Its final action includes the total and
only starts after validation. Payment fields are **visual examples**; the future
implementation must use the chosen provider's supported secure collection
method. Do not collect or store raw card details in app state or logs merely
because the artwork has card-shaped inputs. Preserve contact/address/cart data
after payment failure and provide a useful retry. Show confirmation only after
an authoritative order success.

## Authentication

```text
Login ↔ Sign-up → Registration request → Verification → Account
  ↓                   ↑                      │
Forgot password       └── Change email ──────┘
  ↓
Recovery email → Valid reset proof → Reset password → Login
```

Registration starts with the name/email/password form. Move to verification
only after the server accepts registration and requests email delivery. Keep
the email visible and editable via a back/change action. Preserve the shared
four-box OTP treatment. Code values are strings, so leading zeros survive.

Verification supplies pending, invalid, expired, rate-limited and success states.
Resend starts an actual request when allowed, then a 60-second UI countdown
based on server restrictions. Server-side limits remain authoritative. Do not
claim that an email or code was sent when only local state changed. Timer text
uses tabular figures and does not repeatedly interrupt a screen reader.

Login fields use email and current-password autocomplete. Registration/reset
use new-password. Email and code fields disable autocapitalization/spellcheck.
Allow paste and password managers. Focus the first invalid field. Wrong login
details produce a useful generic error without identifying account existence.

Recovery confirmation uses neutral wording whether or not the email exists.
The reset form requires server-verified, short-lived, single-use recovery proof.
Do not allow an arbitrary email plus new password to establish that proof.
Expired links offer a new recovery request. Success provides a sign-in action.

Google remains disabled in this design until its integration exists. It should
not dominate the primary email path. Social UI does not appear on the code or
password-reset screens. “Remember me” must only appear as an active option once
its session persistence actually works.

## Profile, orders & addresses

Profile updates have saving/saved/failed feedback and retain edits on failure.
Confirm meaningful navigation away from unsaved changes. An email change may
require re-verification; represent that state rather than immediately claiming
the new address is verified. Password changes use their own authenticated flow.

Orders link to addressable detail pages. Status is text plus an optional neutral
badge. Missing tracking has explanatory copy instead of a broken tracking link.
No orders gives a product-browsing action. A missing/unauthorized order does
not disclose another buyer's data.

Address add/edit opens a dialog on desktop or a full-height sheet on mobile.
Fields: full name, street address, optional second line, city, region where
required, postal code and country. Apply market-specific validation rather
than assuming the UK sample fits every country. Default-address state is
explicit. Removal confirms or supports undo; failed saves keep the form open.

## Shops, sellers & support

Shop pages reuse the product grid and source shop identity from actual data.
An empty shop has clear messaging. Do not invent ratings or seller guarantees.
The seller application uses shop name, business email, category and description;
submission shows pending/error/received states and preserves failed input.

Help uses Delivery / Returns / Contact content groups. The example guidance
does not define a returns period, delivery guarantee or response-time promise.
Contact submission has progress and an acknowledgement only after delivery to
the support system. Privacy and legal destinations need real approved content;
their footer labels are navigation placeholders in this proposal.

## Responsive shell & sticky behaviour

The full navigation uses desktop space; the compact header has Menu, Account
and Cart, with Search on its own row. Wishlist, seller entry and theme controls
remain reachable from the menu. Keep all icon hit areas at least 44 px.

If using a sticky navigation row, preserve its document space and set scroll
padding so it does not cover focused fields or anchor headings. Avoid inserting
an extra duplicate theme switch purely because the sticky state changed.
An active dialog covers the header and blocks background interaction.

## Acceptance checks for your later implementation

- Review 320, 390, 768, 1024 and 1440 px widths, and 200% text scaling.
- Review light/dark surfaces, form invalid/autofill/disabled/focus states.
- Navigate all primary flows with keyboard alone and a screen reader.
- Verify long product names, long email addresses, large totals and empty data.
- Verify Back, reload, deep links and a network failure at every request boundary.
- Check actual product media dimensions and layout shift before replacing vectors.
- Test real authentication, persistence and checkout separately from visual checks.

These are future checks, not completed test results. Application lint/build/tests
were not run while producing this design handoff.
