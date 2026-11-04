import type { ComponentProps } from 'react';
import { cn } from '../../utils';

function Textarea({
  className,
  rows = 4,
  ...props
}: ComponentProps<'textarea'>) {
  return (
    <textarea
      {...props}
      rows={rows}
      data-slot="textarea"
      className={cn(
        'min-h-30 w-full min-w-0 resize-y rounded-sm border border-control-border bg-surface px-3.5 py-3 font-sans text-base text-text outline-none transition-colors placeholder:text-muted focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:bg-surface-alt disabled:opacity-50 aria-invalid:border-danger aria-invalid:ring-2 aria-invalid:ring-danger/20 motion-reduce:transition-none',
        className,
      )}
    />
  );
}

export { Textarea };
