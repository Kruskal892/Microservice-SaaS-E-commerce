'use client';

import type { ComponentProps } from 'react';
import { Tooltip as Primitive } from 'radix-ui';
import { cn } from '../../utils';

const TooltipProvider = Primitive.Provider;
const Tooltip = Primitive.Root;
const TooltipTrigger = Primitive.Trigger;

type TooltipContentProps = Omit<
  ComponentProps<typeof Primitive.Content>,
  'asChild'
> & {
  container?: ComponentProps<typeof Primitive.Portal>['container'];
};
function TooltipContent({
  className,
  children,
  sideOffset = 4,
  collisionPadding = 8,
  container,
  ...props
}: TooltipContentProps) {
  return (
    <Primitive.Portal container={container}>
      <Primitive.Content
        {...props}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        data-slot="tooltip-content"
        className={cn(
          'z-50 max-w-64 rounded-sm bg-text px-3 py-2 font-sans text-sm text-surface shadow-md',
          className,
        )}
      >
        {children}
        <Primitive.Arrow className="fill-text" />
      </Primitive.Content>
    </Primitive.Portal>
  );
}

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent };
export type { TooltipContentProps };
