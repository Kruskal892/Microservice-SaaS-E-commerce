# Shared UI design

**Status:** Implemented v1 source and Storybook configuration, 2026-10-27.
**Owners:** `packages/ui` owns React components and tokens; `packages/assets`
owns SVG source. Apps own business behavior, fonts, routing, data and forms.

[Usage and recipes](../reference/common-components.md) ·
[Storybook workflow](../development/storybook.md) ·
[Figma library](https://www.figma.com/design/SXjnKoIBg4Laj7RqjVgQHo?node-id=7-110)

## Purpose and scope

Provide reusable controls for forms, actions, overlays and common content. A
component must work without Next.js, application state, API clients or commerce
types. The existing Input and Icon APIs remain compatible.

| Family       | Public pieces                                                                              | States and behavior                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Button       | Button, ButtonProps                                                                        | Primary/secondary/ghost/danger; sm/md/lg/icon; hover, focus-visible, active, pressed, disabled, loading |
| Forms        | Input, InputProps, Textarea, Field, Label, FieldDescription, FieldError                    | Native props/refs; help/error relationships; disabled, read-only, invalid                               |
| Choices      | Checkbox, Switch                                                                           | Controlled/uncontrolled, keyboard, disabled; Checkbox supports indeterminate and invalid                |
| Select       | Select, Trigger, Value, Content, Item, Group, Label, Separator                             | Single selection, placeholder, disabled options, keyboard/typeahead, controlled state                   |
| DropdownMenu | Root, Trigger, Content, Item, Group, Label, Separator, CheckboxItem, RadioGroup, RadioItem | Action selection, checked/radio items, disabled, focus/highlight, collision handling                    |
| Modal        | Root, Trigger, Content, Title, Description, Footer, Close                                  | Controlled/uncontrolled, portal, focus trap/restore, Escape, bounded scrolling                          |
| Tabs         | Root, List, Trigger, Content                                                               | Active/inactive/disabled, automatic/manual activation, horizontal/vertical                              |
| Tooltip      | Provider, Root, Trigger, Content                                                           | Hover/focus, delayed open/close, collision handling                                                     |
| Presentation | Badge, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter               | Badge neutral/success/warning/danger; composable card layout                                            |

Public compound names include their family prefix, for example `ModalContent`
and `SelectTrigger`. `Modal` and `DropdownMenu` are the root components.

V1 deliberately excludes data tables, rich text, date pickers, file upload,
combobox/multi-select, toasts, pagination, form validation engines and destructive
confirmation dialogs. These need a concrete product requirement before choosing
their data and interaction contracts.

## Architecture and dependency decision

Use native React elements for Button, Input, Textarea, Field, Badge and Card.
Use the installed `radix-ui` primitives for stateful accessibility behavior. Radix
owns focus management, keyboard navigation, outside interaction, portals and
ARIA state; wrappers own the default visual language. See the
[Radix introduction](https://www.radix-ui.com/primitives/docs/overview/introduction)
and [composition contract](https://www.radix-ui.com/primitives/docs/guides/composition).

Use the existing `cn` (`clsx` + `tailwind-merge`) to merge caller classes after
defaults. Small typed maps handle Button variants/sizes and Badge tones; another
variant dependency is unnecessary. Static structure and behavior stay in JSX.
There is no new provider, theme engine or package manifest for the library.

Interactive primitive wrappers declare `use client`. Native presentation
components can render on the server. An application that adds handlers or
controlled React state owns the client boundary. Imports use `@packages/ui` or a
specific common component folder, never the infrastructure `@packages` barrel.

### Reuse contract

- Preserve native or Radix props, event handlers, ARIA attributes and React 19
  refs. Component types are inferred from the underlying element/primitive.
- Expose `className` on every styled piece. Checkbox and Switch also expose
  `indicatorClassName` and `thumbClassName`. Input retains its four existing
  styling hooks. Portaled content exposes `container`; Modal also exposes
  `overlayClassName`. Reuse parts rather than introducing configuration arrays
  or a monolithic component with product-specific flags.
- Owned-structure wrappers omit incompatible `asChild` props: Checkbox, Switch,
  SelectTrigger/Content/Item, TooltipContent and checked/radio menu items.
  Checkbox/Switch also own their children; style their indicator/thumb instead.
- `asChild` on Radix trigger/close parts accepts one child that forwards props
  and ref, such as Button. Button itself always renders a native button and
  does not pretend to be a link. Use a real link for navigation.
- Expose `value/defaultValue/onValueChange`, `checked/defaultChecked/
onCheckedChange`, or `open/defaultOpen/onOpenChange` through Radix. Do not
  switch an instance between controlled and uncontrolled while mounted.
- Form data, validation, asynchronous actions, errors and persistence remain
  application responsibilities. No component assumes React Hook Form or Zod.
- Shared controls use the shared Inter/system font preference. Client-only
  Roboto/Poppins utilities remain local overrides.

## Tokens and visual behavior

`packages/ui/theme.css` is the code source of truth. Import it once after
Tailwind and scan `packages/ui`. Existing palette, spacing, radius, breakpoints
and theme selectors remain available.

| Token                          | Light                             | Dark         | Purpose                              |
| ------------------------------ | --------------------------------- | ------------ | ------------------------------------ |
| action                         | `#4f46e5`                         | same         | Primary action and selected controls |
| action-hover                   | `#4338ca`                         | same         | Primary hover                        |
| action-active                  | `#3730a3`                         | same         | Primary active/pressed               |
| on-action                      | `#ffffff`                         | same         | Action labels and switch thumb       |
| danger-action / hover / active | `#b91c1c` / `#991b1b` / `#7f1d1d` | same         | Destructive button states            |
| success-foreground             | `#15803d`                         | `#4ade80`    | Readable success label               |
| warning-foreground             | `#92400e`                         | `#fbbf24`    | Readable warning label               |
| danger-foreground              | `#b91c1c`                         | `#f87171`    | Error and danger label               |
| overlay                        | slate 900 at 60%                  | black at 70% | Modal backdrop                       |

Foreground roles are separate from the existing status palette. Badge still
uses the status color at 10% for its surface and 30% for its border. Do not
communicate meaning through color alone.

Button heights are 32/40/48px; icon size is 40px. Radius `sm` is 8px and `md` is
12px. Small controls may need larger surrounding hit areas for touch contexts.
Focus is visible through `focus-visible` rings. Transitions and the loading
spinner respect reduced motion. Disabled/loading buttons use the native
disabled attribute, 50% opacity, and cannot activate. Loading sets `aria-busy`
without replacing the accessible label. Icon-only loading visually hides its
icon to keep the spinner within the fixed control size. Apps may announce long operations with
a separate live status region. Hover/active are CSS states, not component props.

Modals and menus use z-40/z-50. Portals default to `document.body`, so set the
theme and direction on the document root. With a locally themed subtree, supply
an appropriate portal container. Scrollable content is bounded by the viewport;
menus/selects use Radix available-height values.

## Accessibility responsibilities

Primitives are a foundation, not an accessibility certification. Consumers must:

- Label every input and icon-only button. Use `htmlFor/id`, `aria-describedby`
  and `aria-invalid` explicitly with Field; group controls with fieldset/legend.
- Include ModalTitle, a useful ModalDescription (or explicitly omit its ARIA
  description), and a visible close/cancel control. Keep the dialog open after
  failed async operations; close only on success. Modal is not an AlertDialog
  for irreversible confirmation.
- Use DropdownMenu for actions and Select for a single form value. SelectItem
  values must be non-empty. Use `onSelect` for menu actions so keyboard activation
  is handled. Prefer a native select when native mobile pickers are required.
- Give TabsList an accessible name. Use manual activation for expensive panels.
- Keep Tooltip text supplementary, non-interactive and available elsewhere when
  essential. Disabled controls cannot be tooltip keyboard triggers.
- Preserve semantic heading order; CardTitle renders an h2. Card and Badge have
  no implicit click behavior or live-announcement role.
- Use Radix Direction.Provider or primitive `dir` for RTL keyboard behavior;
  document `dir` controls native layout. Storybook demonstrates both together.

## Storybook and verification design

Storybook uses React/Vite instead of importing the Next.js app. It loads shared
CSS, transforms the existing SVG component imports, and documents components
independently of app routes or Google font downloads. Stories live beside their
components; application/library TypeScript projects exclude them. A separate
Storybook tsconfig checks configuration, components and stories without requiring
the shared composite declaration build.

Autodocs, controls, accessibility tools, theme/direction switches and CSS pseudo
states are configured. Button includes a variant/state matrix. Permanent play
checks cover disabled/loading activation, checkbox toggling, Select and Tabs
keyboard use, Modal focus/Escape restoration and menu selection. They are
authored examples/checks, not evidence that tests have run. Do not automatically
run lint, builds or tests; follow the repository's explicit-request policy.

## Figma contract

The linked Figma file is an editable draft following code tokens. The Components
page contains the component/state sheets. Start and Foundations pages are
reserved but empty; token collections are already populated. Starter-plan limits require separate Light
and Dark color collections instead of two modes in one collection. Semantic
colors alias primitives; scopes and CSS syntax are explicit. Component fills,
strokes, radii and spacing bind to variables; repeated text uses shared styles.

Button sizes are separate sets so each variant/state matrix stays below 30
variants. The medium state sheet shows all variants/states as instances; icon
buttons expose an instance-swap icon property. Component implementations live in `packages/ui/common/<Component>/`.  Usage descriptions are present on component families. Main components sit outside the
review sheets. Figma states describe appearance; runtime behavior belongs to
the actual component and its Storybook examples.

## Change policy

When changing a public prop, state, token or default, update its stories, this
contract, usage recipes and matching Figma objects together. Preserve current
Input callers. Add a new dependency only when it removes substantial behavior
code, and review its installation/lockfile impact. Publish Storybook or the
Figma library only through the team's normal release process; neither is
automatically published by this implementation.

### Figma completion boundary

The Starter account exhausted its MCP call quota after the component sheets and
visual corrections were saved. Button's review sheet was visually checked.
Forms, overlays and layout were checked and then corrected; their post-fix
screenshots remain pending. Icon-only loading was corrected in code after the
quota was exhausted; the matching Figma variant still needs its spinner update.
The cover and token specimen sheet could not be
created. The token collections and component sets exist; this is a draft, not a
fully validated or published library.

Code Connect is unavailable for the current plan/seat (it requires a Dev/Full
seat on Organization/Enterprise). No Code Connect bindings are configured. Continue the reserved
cover/specimen pages and pending visual verification when Figma access permits.
