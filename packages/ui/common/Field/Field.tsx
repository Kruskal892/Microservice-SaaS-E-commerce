import type { ComponentProps } from 'react';
import { cn } from '../../utils';

function Field({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      {...props}
      data-slot="field"
      className={cn('flex min-w-0 flex-col gap-2 font-sans', className)}
    />
  );
}
function Label({ className, ...props }: ComponentProps<'label'>) {
  return (
    <label
      {...props}
      data-slot="label"
      className={cn('text-sm font-medium text-text', className)}
    />
  );
}
function FieldDescription({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      {...props}
      data-slot="field-description"
      className={cn('text-sm leading-5 wrap-break-word text-muted', className)}
    />
  );
}
function FieldError({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      aria-live="polite"
      {...props}
      data-slot="field-error"
      className={cn(
        'text-sm leading-5 wrap-break-word text-danger-foreground',
        className,
      )}
    />
  );
}

export { Field, Label, FieldDescription, FieldError };
