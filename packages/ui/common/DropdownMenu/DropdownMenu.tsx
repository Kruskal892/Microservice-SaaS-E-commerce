'use client';

import type { ComponentProps } from 'react';
import { DropdownMenu as Primitive } from 'radix-ui';
import { cn } from '../../utils';

const DropdownMenu = Primitive.Root;
const DropdownMenuTrigger = Primitive.Trigger;
const DropdownMenuGroup = Primitive.Group;
const DropdownMenuRadioGroup = Primitive.RadioGroup;

type DropdownMenuContentProps = ComponentProps<typeof Primitive.Content> & {
  container?: ComponentProps<typeof Primitive.Portal>['container'];
};
function DropdownMenuContent({
  className,
  sideOffset = 4,
  collisionPadding = 8,
  container,
  ...props
}: DropdownMenuContentProps) {
  return (
    <Primitive.Portal container={container}>
      <Primitive.Content
        {...props}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        data-slot="dropdown-menu-content"
        className={cn(
          'z-50 min-w-40 max-w-[calc(100vw-1rem)] max-h-(--radix-dropdown-menu-content-available-height) overflow-y-auto rounded-sm border border-border bg-surface p-1 font-sans text-sm text-text shadow-lg outline-none',
          className,
        )}
      />
    </Primitive.Portal>
  );
}
const itemClassName =
  'relative flex cursor-default select-none items-center gap-2 rounded-sm px-3 py-2 outline-none data-[highlighted]:bg-surface-alt data-[disabled]:pointer-events-none data-[disabled]:opacity-50';
function DropdownMenuItem({
  className,
  ...props
}: ComponentProps<typeof Primitive.Item>) {
  return <Primitive.Item {...props} className={cn(itemClassName, className)} />;
}
function DropdownMenuCheckboxItem({
  className,
  children,
  ...props
}: Omit<ComponentProps<typeof Primitive.CheckboxItem>, 'asChild'>) {
  return (
    <Primitive.CheckboxItem {...props} className={cn(itemClassName, className)}>
      <span
        className="flex size-4 items-center justify-center"
        aria-hidden="true"
      >
        <Primitive.ItemIndicator className="data-[state=checked]:before:content-['✓'] data-[state=indeterminate]:before:content-['−']" />
      </span>
      {children}
    </Primitive.CheckboxItem>
  );
}
function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: Omit<ComponentProps<typeof Primitive.RadioItem>, 'asChild'>) {
  return (
    <Primitive.RadioItem {...props} className={cn(itemClassName, className)}>
      <span
        className="flex size-4 items-center justify-center"
        aria-hidden="true"
      >
        <Primitive.ItemIndicator>●</Primitive.ItemIndicator>
      </span>
      {children}
    </Primitive.RadioItem>
  );
}
function DropdownMenuLabel({
  className,
  ...props
}: ComponentProps<typeof Primitive.Label>) {
  return (
    <Primitive.Label
      {...props}
      className={cn('px-3 py-2 text-xs font-semibold text-muted', className)}
    />
  );
}
function DropdownMenuSeparator({
  className,
  ...props
}: ComponentProps<typeof Primitive.Separator>) {
  return (
    <Primitive.Separator
      {...props}
      className={cn('my-1 h-px bg-border', className)}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
};
export type { DropdownMenuContentProps };
