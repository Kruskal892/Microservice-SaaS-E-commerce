import * as React from 'react';
import { Icon, type IconName } from '../../icons';
import { cn } from '../../utils';

type InputProps = React.ComponentProps<'input'> & {
  inputClassName?: string;
  icon?: IconName | React.ReactElement | null;
  iconContainerClassName?: string;
  iconClassName?: string;
  iconPosition?: 'start' | 'end';
};

function Input({
  className,
  inputClassName,
  type,
  icon,
  iconContainerClassName,
  iconClassName,
  iconPosition = 'start',
  ...props
}: InputProps) {
  return (
    <div
      data-slot="input-wrapper"
      className={cn(
        'flex h-10 w-full min-w-0 items-stretch overflow-hidden rounded-sm border border-border bg-surface font-sans text-base text-text transition-colors has-focus-visible:border-focus has-focus-visible:ring-2 has-focus-visible:ring-focus/50 has-disabled:cursor-not-allowed has-disabled:bg-surface-alt has-disabled:opacity-50 has-aria-invalid:border-danger has-aria-invalid:ring-2 has-aria-invalid:ring-danger/20 motion-reduce:transition-none',
        className,
      )}
    >
      {icon != null && (
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none flex shrink-0 items-center justify-center px-3 text-muted [&>svg]:shrink-0',
            iconPosition === 'end' && 'order-last',
            iconContainerClassName,
          )}
          data-slot="input-icon"
        >
          {typeof icon === 'string' ? (
            <Icon name={icon} className={iconClassName} />
          ) : (
            icon
          )}
        </span>
      )}
      <input
        type={type}
        data-slot="input"
        className={cn(
          'h-full w-full min-w-0 flex-1 border-0 bg-transparent px-3 py-2 outline-none placeholder:text-muted disabled:cursor-not-allowed file:mr-3 file:inline-flex file:border-0 file:bg-transparent file:font-sans file:text-sm file:font-medium file:text-text',
          inputClassName,
        )}
        {...props}
      />
    </div>
  );
}

export { Input };
export type { InputProps };
