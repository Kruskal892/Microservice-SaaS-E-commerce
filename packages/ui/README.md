# Shared UI

Reusable React 19 components with Tailwind v4 tokens and Radix behavior.

```tsx
import { Button, Input, Field, Label } from '@packages/ui';

<Field>
  <Label htmlFor="email">Email</Label>
  <Input id="email" name="email" type="email" />
  <Button type="submit">Continue</Button>
</Field>;
```

Available families: Button, Input, Textarea, Field/Label, Checkbox, Switch,
Select, DropdownMenu, Modal, Tabs, Tooltip, Badge, Card and Icon. Each family
exports its composable pieces from the root UI entry and its own folder.

Import the shared theme after Tailwind and scan `packages/ui` for utility
classes. Consumers configure `@packages/*` and SVG component imports; use the
[shared setup guide](../../docs/reference/shared-ui.md). Keep Prisma/Redis root
barrels out of browser code. State and handlers belong to client components;
the library has no routing, fetching or validation engine.

Run `npm run storybook` from the repository root, then open port 6006. Use the
theme/direction toolbar, controls, state stories and accessibility panel.

- [Usage recipes](../../docs/reference/common-components.md)
- [Design and accessibility contract](../../docs/design/shared-ui-system.md)
- [Storybook workflow](../../docs/development/storybook.md)
- [Figma library](https://www.figma.com/design/SXjnKoIBg4Laj7RqjVgQHo?node-id=7-110)

Lint, builds and tests run only on explicit request. Authored stories and play
checks are permanent documentation; their presence does not mean they passed.
