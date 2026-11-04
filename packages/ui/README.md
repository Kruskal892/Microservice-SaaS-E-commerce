# Shared UI

Reusable React 19 components with monochrome Tailwind v4 tokens, bundled DM Sans
and Radix behavior. `theme.css` owns colours, font loading, spacing and shape.
The font and its licence live in `packages/assets/fonts/`.

```tsx
import { Button, Input, Field, Label } from '@packages/ui';

<Field>
  <Label htmlFor="email">Email</Label>
  <Input id="email" name="email" type="email" />
  <Button type="submit">Continue</Button>
</Field>;
```

Available families: Button, Input, OtpInput, Textarea, Field/Label, Checkbox, Switch,
Select, DropdownMenu, Modal, Tabs, Tooltip, Badge, Card and Icon. Each family
exports its composable pieces from the root UI entry and its own folder.

Import the shared theme after Tailwind and scan `packages/ui` for utility
classes. Consumers configure `@packages/*` and SVG component imports; use the
[shared setup guide](../../docs/reference/shared-ui.md). Keep Prisma/Redis root
barrels out of browser code. State and handlers belong to client components;
the library has no routing, fetching or validation engine.

`Input` provides an accessible eye/eye-off button automatically for
`type="password"`. The button participates in the flex layout, preserves native
input props/refs, and follows the field's disabled state. The component declares
its own client boundary for visibility state.

`OtpInput` uses `input-otp` to show one box per digit (four by default), with
active-digit styling and a caret. One accessible native control underlies the
boxes, preserving selection, keyboard editing, paste, leading zeros, and
`one-time-code` autocomplete. Use `value`/`onValueChange` or `defaultValue`.
`className` styles the group, `slotClassName` styles each box, and `inputClassName`
targets the underlying input. Native refs and form/ARIA attributes are forwarded.
Verification, resend requests, and timers stay in the consuming application.

The client owns `AuthCard`, `GoogleButton`, `ThemeToggle`, and
its `next-themes` provider. These compose the shared controls without adding
Next.js or form-validation dependencies to this library. See the
[client guide](../../apps/client/README.md) for application usage and limitations.

Run `npm run storybook` from the repository root, then open port 6006. Use the
theme/direction toolbar, controls, state stories and accessibility panel.

- [Monochrome design](../../docs/design/eshop-monochrome.md)
- [Component contracts](../../docs/design/common-ui.md)
- [Usage recipes](../../docs/reference/common-components.md)
- [Design and accessibility contract](../../docs/design/shared-ui-system.md)
- [Storybook workflow](../../docs/development/storybook.md)
- [Figma library](https://www.figma.com/design/SXjnKoIBg4Laj7RqjVgQHo?node-id=7-110)

Lint, builds and tests run only on explicit request. Authored stories and play
checks are permanent documentation; their presence does not mean they passed.
