# Common components

[Design contract](../design/shared-ui-system.md) ·
[Storybook setup](../development/storybook.md) ·
[Existing Input/Icon API](shared-ui.md)

Import from `@packages/ui`. Each family also has a folder entry such as
`@packages/ui/common/Button`. Props include native/primitive attributes and refs;
`className` merges after defaults. Stateful composition belongs in a client
component in Next.js. The snippets below assume the referenced React state and
handlers are supplied by the consuming application.

## Button

```tsx
import { Button, Icon } from '@packages/ui';

<Button type="submit" loading={saving}>
  Save changes
</Button>;
<Button variant="secondary" onClick={cancel}>
  Cancel
</Button>;
<Button variant="danger" disabled={!canDelete}>
  Delete
</Button>;
<Button variant="ghost" size="sm">
  More details
</Button>;
<Button size="icon" aria-label="Search">
  <Icon name="SearchIcon" />
</Button>;
```

`variant`: primary (default), secondary, ghost, danger. `size`: sm, md (default),
lg, icon. `loading` sets native disabled and `aria-busy`; keep a meaningful
label. Icon-only loading hides the icon visually so the spinner fits without
overflow, while retaining the accessible label. Default `type` is button, so forms must explicitly use submit. Native
disabled, hover, focus-visible, active and `aria-pressed` states are styled.
For navigation use a link rather than nesting links inside Button.

## Fields and multiline input

```tsx
import {
  Field,
  Label,
  FieldDescription,
  FieldError,
  Textarea,
} from '@packages/ui';

<Field>
  <Label htmlFor="message">Message</Label>
  <Textarea
    id="message"
    name="message"
    required
    rows={4}
    aria-invalid={Boolean(error)}
    aria-describedby="message-help message-error"
  />
  <FieldDescription id="message-help">Include useful context.</FieldDescription>
  <FieldError id="message-error">{error}</FieldError>
</Field>;
```

Field does not infer IDs, clone children or validate. Use the same pattern with
Input. Native `disabled`, `readOnly`, `required`, form props and refs pass through.
Hide/remove the error description reference when omitting the error element.

## Checkbox and Switch

```tsx
import { Checkbox, Switch, Label } from '@packages/ui';

<div className="flex items-center gap-2">
  <Checkbox
    id="updates"
    name="updates"
    checked={updates}
    onCheckedChange={(value) => setUpdates(value === true)}
  />
  <Label htmlFor="updates">Receive updates</Label>
</div>;
<Switch
  aria-label="Notifications"
  checked={notifications}
  onCheckedChange={setNotifications}
/>;
```

Use `defaultChecked` for uncontrolled controls. Checkbox supports
`indicatorClassName`; Switch supports `thumbClassName`. They own their internal
children and do not expose `asChild`. Checkbox also accepts
`checked="indeterminate"`. Native form name/value, required, disabled and refs
are preserved through Radix. A Switch represents an on/off preference, not a
multi-option choice. Group related checkboxes with fieldset/legend.

## Select

```tsx
import {
  Field,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@packages/ui';

<Field>
  <Label htmlFor="language">Language</Label>
  <Select name="language" value={language} onValueChange={setLanguage}>
    <SelectTrigger id="language">
      <SelectValue placeholder="Choose language" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="en">English</SelectItem>
      <SelectItem value="vi">Vietnamese</SelectItem>
      <SelectItem value="fr" disabled>
        French (unavailable)
      </SelectItem>
    </SelectContent>
  </Select>
</Field>;
```

Root supports `defaultValue`, `required`, `disabled` and controlled open state.
Set `aria-invalid`/`aria-describedby` on SelectTrigger. Values are non-empty
strings; empty root value represents the placeholder. `SelectGroup`,
`SelectLabel` and `SelectSeparator` are available for grouped options. It is
single-select; it does not provide search or multiple selection.

## DropdownMenu

```tsx
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@packages/ui';

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="secondary">Actions</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onSelect={duplicate}>Duplicate</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem disabled>Archive</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>;
```

Use `onSelect`; prevent its event default to keep the menu open. For navigation,
use `DropdownMenuItem asChild` around a real link. Group/Label, CheckboxItem and
RadioGroup/RadioItem are exported for selection actions. CheckboxItem accepts
checked/onCheckedChange; RadioGroup accepts value/onValueChange. All triggers
using `asChild` need one ref/prop-forwarding child.

## Modal

```tsx
import {
  Button,
  Modal,
  ModalTrigger,
  ModalContent,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalClose,
} from '@packages/ui';

<Modal open={open} onOpenChange={setOpen}>
  <ModalTrigger asChild>
    <Button>Edit profile</Button>
  </ModalTrigger>
  <ModalContent>
    <ModalTitle>Edit profile</ModalTitle>
    <ModalDescription>Update your public display name.</ModalDescription>
    {formFields}
    <ModalFooter>
      <ModalClose asChild>
        <Button variant="secondary">Cancel</Button>
      </ModalClose>
      <Button loading={saving} onClick={save}>
        Save changes
      </Button>
    </ModalFooter>
  </ModalContent>
</Modal>;
```

Close from `save` only after a successful operation; retain errors and input
after failure. Omit open/onOpenChange for uncontrolled state. Radix handles focus
trap, Escape, outside dismissal and restoration. Give every modal a title and
visible close/cancel action. To omit the description intentionally, pass
`aria-describedby={undefined}` to ModalContent. Use `overlayClassName` for the
backdrop and `className` for the panel. This is not a destructive-confirmation
AlertDialog.

## Tabs and Tooltip

```tsx
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  Button,
} from '@packages/ui';

<Tabs defaultValue="overview">
  <TabsList aria-label="Account sections">
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="settings">Settings</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">Account summary</TabsContent>
  <TabsContent value="settings">Account settings</TabsContent>
</Tabs>;

<TooltipProvider delayDuration={300}>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="secondary">Export report</Button>
    </TooltipTrigger>
    <TooltipContent>Download as CSV</TooltipContent>
  </Tooltip>
</TooltipProvider>;
```

Tabs supports controlled value, disabled triggers, orientation and
`activationMode="manual"`. Place one TooltipProvider near the app root. Tooltips
must not contain required instructions or interactive elements.

## Badge and Card

```tsx
import {
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
} from '@packages/ui';

<Card>
  <CardHeader>
    <CardTitle>Workspace</CardTitle>
    <CardDescription>Manage team preferences.</CardDescription>
  </CardHeader>
  <CardContent>
    <Badge tone="success">Published</Badge>
  </CardContent>
  <CardFooter>
    <Button>Manage workspace</Button>
  </CardFooter>
</Card>;
```

Badge tones: neutral (default), success, warning, danger. Status text must convey
meaning without color. CardTitle is h2; choose appropriate surrounding headings.
Neither Badge nor Card adds clickable behavior or automatic announcements.

## Themes, portals and direction

Put `data-theme="dark"` or `.dark` on the document root. Portaled content uses
document tokens, not an isolated trigger subtree. ModalContent,
DropdownMenuContent, SelectContent and TooltipContent accept a `container` for
local theming or embedding. Keep it inside the intended modal/focus boundary.

For RTL, use document `dir="rtl"` and Radix's `Direction.Provider dir="rtl"`
or the primitive's `dir` prop for directional keyboard behavior. Storybook's
toolbar configures both. Changing visual classes must preserve focus visibility,
labels, state styles and reduced motion.
