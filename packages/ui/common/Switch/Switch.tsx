'use client';

import type { ComponentProps } from 'react';
import { Switch as Primitive } from 'radix-ui';
import { cn } from '../../utils';

type SwitchProps = Omit<
  ComponentProps<typeof Primitive.Root>,
  'asChild' | 'children'
> & { thumbClassName?: string };

function Switch({ className, thumbClassName, ...props }: SwitchProps) {
  return (
    <Primitive.Root
      {...props}
      data-slot="switch"
      className={cn(
        'inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent bg-muted outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-action motion-reduce:transition-none',
        className,
      )}
    >
      <Primitive.Thumb
        className={cn(
          'block size-5 rounded-full bg-on-action shadow-sm transition-transform data-[state=checked]:translate-x-5 rtl:data-[state=checked]:-translate-x-5 motion-reduce:transition-none',
          thumbClassName,
        )}
      />
    </Primitive.Root>
  );
}

export { Switch };
export type { SwitchProps };
