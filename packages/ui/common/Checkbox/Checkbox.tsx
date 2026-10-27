'use client';

import type { ComponentProps } from 'react';
import { Checkbox as Primitive } from 'radix-ui';
import { cn } from '../../utils';

type CheckboxProps = Omit<
  ComponentProps<typeof Primitive.Root>,
  'asChild' | 'children'
> & { indicatorClassName?: string };

function Checkbox({ className, indicatorClassName, ...props }: CheckboxProps) {
  return (
    <Primitive.Root
      {...props}
      data-slot="checkbox"
      className={cn(
        'inline-flex size-5 shrink-0 items-center justify-center rounded-sm border border-border bg-surface text-on-action outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger data-[state=checked]:border-action data-[state=checked]:bg-action data-[state=indeterminate]:border-action data-[state=indeterminate]:bg-action motion-reduce:transition-none',
        className,
      )}
    >
      <Primitive.Indicator
        className={cn(
          "text-sm leading-none data-[state=checked]:before:content-['✓'] data-[state=indeterminate]:before:content-['−']",
          indicatorClassName,
        )}
      />
    </Primitive.Root>
  );
}

export { Checkbox };
export type { CheckboxProps };
