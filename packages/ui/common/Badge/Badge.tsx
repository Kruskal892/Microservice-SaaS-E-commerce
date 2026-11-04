import type { ComponentProps } from 'react';
import { cn } from '../../utils';

const tones = {
  neutral: 'border-border bg-surface-alt text-text',
  success: 'border-success/30 bg-success/10 text-success-foreground',
  warning: 'border-warning/30 bg-warning/10 text-warning-foreground',
  danger: 'border-danger/30 bg-danger/10 text-danger-foreground',
};

type BadgeProps = ComponentProps<'span'> & { tone?: keyof typeof tones };

function Badge({ className, tone = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      {...props}
      data-slot="badge"
      className={cn(
        'inline-flex max-w-full items-center gap-1 wrap-anywhere rounded-full border px-2 py-1 font-sans text-xs font-medium',
        tones[tone],
        className,
      )}
    />
  );
}

export { Badge };
export type { BadgeProps };
