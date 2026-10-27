import type { ComponentProps } from 'react';
import { cn } from '../../utils';

const variants = {
  primary:
    'bg-action text-on-action enabled:hover:bg-action-hover enabled:active:bg-action-active aria-pressed:bg-action-active',
  secondary:
    'border border-border bg-surface text-text enabled:hover:bg-surface-alt enabled:active:bg-border aria-pressed:bg-border',
  ghost:
    'text-text enabled:hover:bg-surface-alt enabled:active:bg-border aria-pressed:bg-border',
  danger:
    'bg-danger-action text-on-action enabled:hover:bg-danger-hover enabled:active:bg-danger-active aria-pressed:bg-danger-active',
};
const sizes = {
  sm: 'h-8 gap-2 px-3 text-sm',
  md: 'h-10 gap-2 px-4 text-base',
  lg: 'h-12 gap-2 px-6 text-base',
  icon: 'size-10 p-2',
};

type ButtonProps = ComponentProps<'button'> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
};

function Button({
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-slot="button"
      className={cn(
        'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-sm font-sans font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none [&_svg]:shrink-0',
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
        />
      )}
      {loading && size === 'icon' ? (
        <span className="sr-only">{children}</span>
      ) : (
        children
      )}
    </button>
  );
}

export { Button };
export type { ButtonProps };
