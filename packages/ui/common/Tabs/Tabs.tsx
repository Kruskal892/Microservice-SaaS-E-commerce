'use client';

import type { ComponentProps } from 'react';
import { Tabs as Primitive } from 'radix-ui';
import { cn } from '../../utils';

function Tabs({ className, ...props }: ComponentProps<typeof Primitive.Root>) {
  return (
    <Primitive.Root
      {...props}
      data-slot="tabs"
      className={cn(
        'flex min-w-0 flex-col gap-4 font-sans text-text',
        className,
      )}
    />
  );
}
function TabsList({
  className,
  ...props
}: ComponentProps<typeof Primitive.List>) {
  return (
    <Primitive.List
      {...props}
      className={cn(
        'inline-flex w-fit max-w-full gap-1 overflow-x-auto overscroll-x-contain rounded-sm bg-surface-alt p-1 data-[orientation=vertical]:flex-col',
        className,
      )}
    />
  );
}
function TabsTrigger({
  className,
  ...props
}: ComponentProps<typeof Primitive.Trigger>) {
  return (
    <Primitive.Trigger
      {...props}
      className={cn(
        'inline-flex min-h-11 shrink-0 items-center justify-center rounded-sm px-4 py-2 text-sm whitespace-nowrap font-medium text-muted outline-none transition-colors enabled:hover:text-text focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50 data-[state=active]:bg-surface data-[state=active]:text-text motion-reduce:transition-none',
        className,
      )}
    />
  );
}
function TabsContent({
  className,
  ...props
}: ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Content
      {...props}
      className={cn(
        'min-w-0 break-words outline-none focus-visible:ring-2 focus-visible:ring-focus',
        className,
      )}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
