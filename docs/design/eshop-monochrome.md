# Eshop monochrome design

The uploaded Penpot project is the visual reference. Runtime tokens live in
[`packages/ui/theme.css`](../../packages/ui/theme.css). The shared theme loads
DM Sans from [`packages/assets/fonts`](../../packages/assets/fonts/), including
its licence. Product reference vectors live in
[`apps/client/public/images/products`](../../apps/client/public/images/products/).

Use [common-ui.md](common-ui.md) for component contracts and
[storefront-flows.md](storefront-flows.md) for the planned customer flows.
The current implementation covers the header, login, sign-up and shared UI;
other storefront routes and authentication requests remain outside this change.

## Colour tokens

Use semantic names in components. Neutral primitives support the palette;
semantic values identify the job of a colour. Both light and dark sets use
the same role names. Never swap just a background without its foreground.

| Role                  | Light     | Dark      | Use                                     |
| --------------------- | --------- | --------- | --------------------------------------- |
| `color.canvas`        | `#FFFFFF` | `#0A0A0A` | Page background                         |
| `color.surface`       | `#FFFFFF` | `#171717` | Controls, overlays, content surfaces    |
| `color.subtle`        | `#F5F5F5` | `#242424` | Quiet sections and grouped information  |
| `color.muted-surface` | `#EBEBEB` | `#333333` | Disabled fills, secondary blocks        |
| `color.text`          | `#000000` | `#FFFFFF` | Main text and icons                     |
| `color.muted`         | `#595959` | `#B3B3B3` | Secondary copy                          |
| `color.border`        | `#DEDEDE` | `#404040` | Decorative dividers and card boundaries |
| `color.control`       | `#858585` | `#858585` | Essential input/control boundaries      |
| `color.action`        | `#000000` | `#FFFFFF` | Primary button and selected control     |
| `color.on-action`     | `#FFFFFF` | `#000000` | Primary action label/checkmark          |
| `color.hover`         | `#292929` | `#DEDEDE` | Primary hover fill                      |
| `color.pressed`       | `#404040` | `#CCCCCC` | Primary pressed fill                    |
| `color.focus`         | `#000000` | `#FFFFFF` | Keyboard focus ring                     |
| `color.error`         | `#B42318` | `#FDA29B` | Error text and invalid boundary         |
| `color.success`       | `#166534` | `#86EFAC` | Confirmed success text                  |
| `color.warning`       | `#854D0E` | `#FDE68A` | Warnings requiring attention            |

The brand remains monochrome. The three status hues are small functional
exceptions, always paired with words or icons. If a fully greyscale interface
is preferred, status labels and icons can carry those meanings; never remove
the message itself. Product imagery has a stable neutral stage in both modes;
do not invert product images when switching themes.

Use `border` for structure, **not** as the sole boundary of an interactive
control. Use `control` for the latter. Focus is a 2 px ring separated from the
element by 2 px of its surrounding surface. This keeps focus visible on black
and white actions.

The design names `canvas`, `subtle`, `control`, `hover`, `pressed` and `error`
map to runtime roles `background`, `surface-alt`, `control-border`,
`action-hover`, `action-active` and `danger-foreground` respectively.

## Font & typography

**DM Sans** is the only family: rounded details give the storefront some warmth
while the neutral structure keeps product information clear. The variable font
is bundled in [fonts](../../packages/assets/fonts/). Use 400 for reading, 500 for labels, 600 for
headings/actions and 700 for the wordmark. Do not add a separate monospace font
for prices or order references. Use tabular figures for changing totals/timers.

| Role                    | Desktop size / line height | Weight  | Mobile  |
| ----------------------- | -------------------------- | ------- | ------- |
| Display / shopping hero | 64 / 78                    | 600     | 46 / 48 |
| Auth introduction       | 54 / 60                    | 600     | 32 / 40 |
| Heading 1               | 48 / 56                    | 600     | 32 / 40 |
| Heading 2               | 36 / 44                    | 600     | 28 / 36 |
| Heading 3               | 24 / 32                    | 600     | 24 / 32 |
| Heading 4               | 20 / 28                    | 600     | 20 / 28 |
| Large body              | 18 / 28                    | 400     | 16 / 24 |
| Body / input value      | 16 / 24                    | 400     | 16 / 24 |
| Small / label / button  | 14 / 20                    | 400–600 | 14 / 20 |
| Caption                 | 12 / 16                    | 400–500 | 12 / 16 |

Headlines use negative letter spacing, approximately −2 px at 64, −1.5 px at
48 and −0.75 px at 24–36. Smaller type has normal tracking. The SVG wordmark
uses 700 weight with tighter tracking. Keep headings left aligned except for
the order confirmation. Keep paragraphs below 65 characters where practical;
never exceed 80 characters for reading copy. Wrap long titles rather than
shrinking all text. The artwork includes a few optical size adjustments for
long headings; choose the nearest named role when making a reusable style.

The type tokens include line heights and letter spacing. SVG text stores
baseline positions; recreate text boxes with the specified line heights in
Figma rather than treating those baselines as a text-style definition.

## Spacing, grid & responsive layout

Base increment: **4 px**. The 2 px value is reserved for borders, focus offsets
and optical corrections. Layout uses `gap`; component padding defines its hit
area. Avoid accumulating child margins.

| Space         | Typical use                                        |
| ------------- | -------------------------------------------------- |
| 4 / 8         | Icon gap, compact internal spacing                 |
| 12 / 16       | Label groups, control padding, mobile grid gutters |
| 20 / 24       | Mobile page inset, card padding, desktop gutters   |
| 32 / 40       | Form groups, section introductions                 |
| 48 / 64       | Page sections, desktop content separation          |
| 80 / 96 / 128 | Large desktop section spacing                      |

| Width     | Layout rules                                                                                                |
| --------- | ----------------------------------------------------------------------------------------------------------- |
| 320–767   | One main column; 20 px insets where space allows, 16 px at 320; two product columns; menu/drawer navigation |
| 768–1023  | 32 px insets; two or three product columns; retain compact menu when the full navigation cannot fit         |
| 1024–1439 | 48 px insets; desktop navigation; catalog sidebar appears; three or four product columns                    |
| 1440+     | Max content 1280 px; 80 px insets at the supplied frame; centre container beyond 1440                       |

Desktop reference grid: 12 columns, 24 px gutters, 1280 px container.
Mobile reference grid: four columns, 16 px gutters, 350 px content inside a
390 px frame. Two product cards are 167 px each in the supplied mobile design.
At 320 px, reduce to 136 px cards with 16 px page insets and a 16 px gutter.
Allow names to wrap; prices and controls remain visible. If large text needs
more room, move to one product column rather than clipping content.

Auth forms use a maximum width of 448 px; the desktop introduction and form
are divided by whitespace and one structural rule. Collapse the split below
1024 px. Product detail collapses gallery → product information → purchasing
controls → details → related items. Checkout puts its summary after all form
sections on mobile; keep a visible path to the final order action.

## Shape, depth, icons & motion

- Radius: 4 px for tiny states, 8 px for controls, 12 px for cards/dialogs,
  16 px for major feature panels, 999 px for pills and switch tracks.
- Borders: 1 px default; 2 px focus or selected option emphasis.
- Resting cards have no shadow. Elevated overlays may use
  `0 8px 24px rgb(0 0 0 / 12%)`.
- Icons: 24 px view box, approximately 1.65 px stroke, rounded caps/joins.
  Common output sizes are 16, 20 and 24 px. Give icon actions 44 × 44 hit areas.
- Motion: 120 ms colour feedback, 180 ms overlay opacity/transform,
  easing `(0.2, 0, 0, 1)`. No automatic hero animation. Remove optional motion
  under `prefers-reduced-motion`.
- Layers: base 0, sticky 20, dropdown 30, overlay 40, dialog 50, toast 60,
  skip link 100. An active modal must cover the sticky header.

## Accessibility & content contract

Black/white primary combinations have 21:1 contrast. Secondary text and control
boundaries were checked against the supplied surfaces; see
the imported design handoff. This is palette verification, not an accessibility
certification of a future implementation.

Give every field a persistent label; placeholders never replace labels.
Use 16 px input text, autocomplete, correct input types and useful error copy.
Focus the first invalid field on submission. Keep submit available until a
request starts, then preserve its label and show progress. Password reveal is
a labelled button, follows the disabled state and never submits the form.

Use real links for navigation and buttons for actions. Include a skip link,
one main landmark and a logical heading hierarchy. Dialogs contain focus and
restore it when closed. Menus and drawers support Escape. Announce async
feedback and completed actions; do not announce a countdown every second.

Use sentence case. Action names describe the result: “Add to cart”, “Save
changes”, “Verify email”. Avoid “Submit”. Errors say what to do next. Do not
present unavailable integrations as completed actions or invent delivery,
returns, price, stock, payment or seller claims from these sample screens.
