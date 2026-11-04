import type { ComponentProps } from 'react';
import { cn } from '../../utils';

const variants = {
  primary:
    'bg-action text-on-action hover:bg-action-hover active:bg-action-active aria-pressed:bg-action-active',
  secondary:
    'border border-control-border bg-surface text-text hover:bg-surface-alt active:bg-border aria-pressed:bg-border',
  ghost:
    'text-text hover:bg-surface-alt active:bg-border aria-pressed:bg-border',
  danger:
    'bg-danger-action text-white hover:bg-danger-hover active:bg-danger-active aria-pressed:bg-danger-active',
};
const sizes = {
  sm: 'min-h-9 gap-2 px-3 py-2 text-sm',
  md: 'min-h-11 gap-2 px-4 py-3 text-sm',
  lg: 'min-h-12 gap-2 px-6 py-3.5 text-sm',
  icon: 'size-11 p-2.5',
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
      aria-busy={loading || props['aria-busy']}
      data-slot="button"
      className={cn(
        'inline-flex min-w-0 items-center justify-center whitespace-normal wrap-anywhere touch-manipulation rounded-sm font-sans font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none [&_svg]:shrink-0',
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
