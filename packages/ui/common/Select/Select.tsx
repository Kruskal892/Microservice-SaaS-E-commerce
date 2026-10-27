'use client';

import type { ComponentProps } from 'react';
import { Select as Primitive } from 'radix-ui';
import { cn } from '../../utils';

const Select = Primitive.Root;
const SelectValue = Primitive.Value;
const SelectGroup = Primitive.Group;

function SelectTrigger({
  className,
  children,
  ...props
}: Omit<ComponentProps<typeof Primitive.Trigger>, 'asChild'>) {
  return (
    <Primitive.Trigger
      {...props}
      data-slot="select-trigger"
      className={cn(
        'inline-flex h-10 w-full items-center justify-between gap-2 rounded-sm border border-border bg-surface px-3 font-sans text-base text-text outline-none focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger data-[placeholder]:text-muted',
        className,
      )}
    >
      {children}
      <Primitive.Icon aria-hidden="true">⌄</Primitive.Icon>
    </Primitive.Trigger>
  );
}
type SelectContentProps = Omit<
  ComponentProps<typeof Primitive.Content>,
  'asChild'
> & {
  container?: ComponentProps<typeof Primitive.Portal>['container'];
};
function SelectContent({
  className,
  children,
  position = 'popper',
  sideOffset = 4,
  collisionPadding = 8,
  container,
  ...props
}: SelectContentProps) {
  return (
    <Primitive.Portal container={container}>
      <Primitive.Content
        {...props}
        position={position}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        data-slot="select-content"
        className={cn(
          'z-50 min-w-(--radix-select-trigger-width) max-w-[calc(100vw-1rem)] max-h-(--radix-select-content-available-height) overflow-hidden rounded-sm border border-border bg-surface font-sans text-base text-text shadow-lg',
          className,
        )}
      >
        <Primitive.ScrollUpButton
          className="flex justify-center py-1"
          aria-hidden="true"
        >
          ⌃
        </Primitive.ScrollUpButton>
        <Primitive.Viewport className="p-1">{children}</Primitive.Viewport>
        <Primitive.ScrollDownButton
          className="flex justify-center py-1"
          aria-hidden="true"
        >
          ⌄
        </Primitive.ScrollDownButton>
      </Primitive.Content>
    </Primitive.Portal>
  );
}
function SelectItem({
  className,
  children,
  ...props
}: Omit<ComponentProps<typeof Primitive.Item>, 'asChild'>) {
  return (
    <Primitive.Item
      {...props}
      className={cn(
        'relative flex cursor-default select-none items-center gap-2 rounded-sm px-3 py-2 outline-none data-[highlighted]:bg-surface-alt data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
    >
      <span
        className="flex size-4 items-center justify-center"
        aria-hidden="true"
      >
        <Primitive.ItemIndicator>✓</Primitive.ItemIndicator>
      </span>
      <Primitive.ItemText>{children}</Primitive.ItemText>
    </Primitive.Item>
  );
}
function SelectLabel({
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
function SelectSeparator({
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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
};
export type { SelectContentProps };
