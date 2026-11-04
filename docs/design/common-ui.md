# Component specification

This is the target design contract, not a claim that the existing components
already implement it. Compose the existing `packages/ui` primitives when
implementing. Keep native/Radix props, refs, accessible names, caller classes
and controlled/uncontrolled APIs. Apps own routing, validation and fetching.

## Common dimensions & states

| Property             | Specification                                                   |
| -------------------- | --------------------------------------------------------------- |
| Control radius       | 8 px                                                            |
| Default field height | 48 px                                                           |
| Compact control      | 36 px visual height; 44 px hit area on touch                    |
| Medium button        | 44 px height, 16 px horizontal padding                          |
| Large button         | 48 px height, 24 px horizontal padding                          |
| Icon button          | 44 × 44 hit area, 20–24 px icon                                 |
| Field label          | 14/20, weight 500, 8–12 px above field                          |
| Input value          | 16/24, weight 400, 14–16 px horizontal inset                    |
| Hint/error           | 12/16 or 14/20, 8 px below field                                |
| Field group spacing  | 24 px default; 16 px for compact related fields                 |
| Focus                | 2 px `focus` ring, 2 px surrounding-surface gap                 |
| Disabled             | Semantic disabled fill or 50% opacity; keep label readable      |
| Invalid              | `error` boundary plus useful text; preserve the entered value   |
| Hover                | Increase contrast; never rely on movement alone                 |
| Loading              | Preserve size/name, show progress, prevent duplicate activation |

The SVGs show representative pixel positions. When rebuilding, use content
flow and gaps rather than absolute positions. Input labels and help text grow
vertically when they wrap. A two-line label must not overlap the next control.

## Button

**Axes:** variant `primary / secondary / ghost / danger`; size
`small / medium / large / icon`; state `default / hover / pressed / focus /
disabled / loading`.

Primary uses `action` + `on-action`. Secondary uses `surface`, `control` border
and `text`. Ghost has no resting fill or border, and gains a subtle hover fill.
Danger is reserved for consequential destructive actions; use a readable
error-colour outline/text treatment or a tested destructive fill with a white
label. Do not recolour every routine “Remove” link red.

Default native type is `button`; forms explicitly use `submit`. Pressed is an
interaction state, not a separate product variant. Keep loading labels stable;
an icon-only button retains an accessible name while the icon is replaced by
a spinner. Allow wrapping or a contextual full-width treatment for long labels.

## Input

**Types:** text, email, search, password and other native input types.
**States:** empty, filled, hover, focus, invalid, disabled, read-only, autofill.

The wrapper contains optional decorative icon areas, the native input and an
optional password-reveal action in normal flex flow. The value must shrink
without pushing the reveal button outside the field. `className` styles the
wrapper; `inputClassName` styles the input; keep the existing icon hooks.

Password reveal toggles masking only. It has a changing “Show password” /
“Hide password” name, follows disabled state and never submits. Keep password
manager support and `current-password` / `new-password` autocomplete. Do not
block paste. Email/search/code fields should not spellcheck or autocapitalize.

## OtpInput

Four 60 × 64 px digit cells in the verification layout, separated by 12 px.
The shared primitive also supports other lengths, including six digits; shrink
cells/gaps to fit the available width rather than overflowing. Each cell has
an 8 px radius and 1 px `control` border. Active cell uses an explicit focus
boundary and caret. Invalid appearance includes a text error below the group.

Use one accessible native control underlying the separate visual boxes.
Preserve leading zeros, paste, selection, arrow keys, delete/backspace and
one-time-code autocomplete. Native input value is a string. Keep submit enabled
for validation; disable while verification is in progress. Expiry, resend,
attempt limits and email changes belong to the application/server.

## Textarea

Match Input colours, radius, padding, invalid and disabled states. Minimum
height is 120 px for a product contact/application message; grow vertically
and permit vertical resizing. A visible label remains outside the value area.
Long words and pasted content must not widen the page.

## Field / Label / FieldDescription / FieldError

Field is a layout grouping, not a form engine. Label is explicitly associated
with its control. Description supplies requirements before failure. Error
explains the correction and is connected through `aria-describedby`.

Examples: “Enter an email address, like alex@example.com.”;
“Use between 8 and 128 characters.”; “The passwords don’t match. Enter the same
password again.” Announce errors that appear while focus remains in a control;
avoid duplicate announcements from multiple nested live regions.

## Checkbox

20 × 20 visual box, 4 px radius, with a minimum 44 px-high label row as the
touch target. States: unchecked, checked, mixed, focus, disabled, invalid.
Checked/mixed fills use `action` and a contrasting mark. Mixed uses a horizontal
dash. The full label activates the control; avoid empty gaps in the hit area.
Expose the indicator class hook without replacing the Radix state model.

## Switch

44 × 24 visual track, 20 px thumb, 2 px internal inset. On: `action` track and
contrasting thumb. Off: muted track with a visible thumb. Use logical movement
for RTL. Keep a stable accessible label such as “Dark mode”; the checked state
communicates whether it is on. The surrounding label row provides a 44 px
touch target. A custom track/thumb size must also update travel distance.

## Select

48 px trigger, 16 px value, 20 px trailing chevron. Trigger text wraps or
truncates within a shrinking content area; the chevron remains visible.
Menu is at least the trigger width, bounded by available viewport height,
with 8 px radius and 8 px outer collision padding. Selected items have a
checkmark. Focus/highlight, selected and disabled are distinct states.

Use Radix for focus and selection. Provide a visible label. Use non-empty item
values; a placeholder represents the unset state. Allow scrolling on small
viewports and use a native select when a platform picker is the requirement.

## DropdownMenu

Use for account actions and compact action lists. Minimum width 200 px;
8 px outer padding; item rows have a 44 px target where touch is expected.
Support checked, mixed and radio markers without losing text space. Long item
labels wrap; checked markers and trailing shortcuts do not shrink.

Radix owns keyboard navigation, Escape, outside dismissal, selected state and
focus return. Keep `onSelect` semantics. Dropdowns are bounded by viewport
height and contain overscroll. They are not substitutes for page navigation
links when link behaviour is expected.

## Modal

12 px radius, 24 px mobile / 32 px desktop padding, maximum width 512 px.
On mobile leave 20 px outside insets, accounting for safe areas. Keep title,
description, content and action groups distinct with 16–24 px gaps.
Backdrop: black at 60%; dialog sits above all page chrome.

Provide an accessible title, useful description and visible close/cancel action.
Trap focus, support Escape and return focus to the trigger. Bound height to
the dynamic viewport and contain scrolling. Keep the dialog open if saving
fails. Destructive decisions must have a clear confirmation or an undo path.
For small screens, allow action buttons to stack rather than overflow.

## Tabs

Related local content, such as product details/delivery/reviews or profile
sections. Use 44 px trigger targets, 8 px group radius and a clear active fill.
Active and keyboard-focus indicators remain separate. Provide an accessible
name for the tab list. Horizontal tabs may scroll on narrow screens rather
than clipping their labels. Vertical orientation remains available.

Use manual activation for costly panels. Use links with an active-page state
for actual route navigation; the account navigation artwork does not require
the shared Tabs component. Route state should remain addressable by URL.

## Tooltip

Use only for supplementary information. Maximum width 256 px or available
viewport width minus 16 px. Padding 12 × 8 px, radius 8 px, contrasting surface.
Wrap long words. Open on keyboard focus and pointer hover. Essential labels,
instructions and error messages remain visible elsewhere. Do not put buttons
inside a tooltip or rely on one attached to an unfocusable disabled control.

## Badge

12/16 text, weight 500, 8–12 px horizontal and 4 px vertical padding. Neutral
pills for “New”, inventory and filters. Status tones are optional functional
exceptions to the monochrome system. Wording always communicates meaning.
Wrap long text instead of stretching the card. A badge is not interactive
unless composed with an appropriate button/link by the caller.

## Card

12 px radius, 1 px structural border, no resting shadow. Content padding
24 px desktop / 20 px mobile. Header, title, description, content, footer and
actions remain composable. CardTitle is a heading, not a fixed page heading;
maintain the surrounding document hierarchy when composing it.

Product cards are **application compositions**, not a new generic Card API.
They use a square neutral media stage, a separate save action, shop metadata,
up to two product-name lines and a visible price. The whole product link must
not contain nested buttons. Show the original price with a strikethrough for
discounts; also state the saving. Never use colour alone for a discount.

## Icon

Keep the existing registered SVG pattern and caller size/colour overrides.
Decorative SVGs are hidden from assistive technology. Meaningful standalone
icons require an accessible name or adjacent visible text. An icon's path size
is not its click target; use a labelled button/link around it.

## Application compositions

| Composition   | Layout and behaviour                                                                                                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header        | Desktop wordmark, search and account/save/cart/theme actions; second navigation row. Compact header uses a menu control and full-width search. Keep active-page styling visible.                              |
| Mobile menu   | Dialog/drawer semantics if it blocks the page; otherwise a disclosure. Escape closes it and returns focus. Close after navigation. Include wishlist, theme and seller entry when omitted from compact chrome. |
| Search        | Search form with a label and submit action; Enter opens results with the query in the URL. Empty and failed searches have explicit recovery.                                                                  |
| Auth shell    | Introduction and form split on desktop, one column on mobile. Email verification has its own title/content and no social sign-in separator.                                                                   |
| Google action | Disabled and visibly unavailable until OAuth is real. When implemented, use the correct provider branding and preserve the button name/loading state.                                                         |
| Order summary | Stable item/price alignment, subtotal/delivery/tax/total, clear final action; no hardcoded business totals in implementation.                                                                                 |
| Toast/status  | Clear result + next action where useful. Polite live announcement; actionable messages remain keyboard reachable. Never use a toast as the only field error.                                                  |
| Filter drawer | Preserve applied state; show active count; clear/reset and apply actions; bounded scrolling and focus restoration.                                                                                            |

## Map to the existing library

The design corresponds to every current family under `packages/ui`: Button,
Input, OtpInput, Textarea, Field, Checkbox, Switch, Select, DropdownMenu, Modal,
Tabs, Tooltip, Badge, Card and Icon. No new dependency or wrapper is required
merely to adopt the visual language. App-specific Header/AuthCard/GoogleButton/
ThemeToggle remain in the client. Keep registration and verification workflow
ownership in the sign-up route while reusing the shared digit control.

Use the repository's TV rule when implementation starts: static structure and
behaviour classes stay in JSX; only customisable/variant classes need slots.
