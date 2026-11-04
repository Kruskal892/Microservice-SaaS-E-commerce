'use client';

import * as React from 'react';
import { Icon, type IconName } from '../../icons';
import { cn } from '../../utils';
import { Button } from '../Button';

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
  id,
  type,
  disabled,
  icon,
  iconContainerClassName,
  iconClassName,
  iconPosition = 'start',
  ...props
}: InputProps) {
  const generatedId = React.useId();
  const [passwordVisible, setPasswordVisible] = React.useState(false);
  const isPassword = type === 'password';
  const inputId = id ?? (isPassword ? generatedId : undefined);
  const visibilityLabel = passwordVisible ? 'Hide password' : 'Show password';

  return (
    <div
      data-slot="input-wrapper"
      className={cn(
        'flex h-12 w-full min-w-0 items-stretch overflow-hidden rounded-sm border border-control-border bg-surface font-sans text-base text-text transition-colors has-autofill:bg-surface-alt has-focus-visible:border-focus has-focus-visible:ring-2 has-focus-visible:ring-focus has-focus-visible:ring-offset-2 has-focus-visible:ring-offset-background has-disabled:cursor-not-allowed has-disabled:bg-surface-alt has-disabled:opacity-50 has-aria-invalid:border-danger has-aria-invalid:ring-2 has-aria-invalid:ring-danger/20 motion-reduce:transition-none',
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
        id={inputId}
        type={isPassword && passwordVisible ? 'text' : type}
        disabled={disabled}
        data-slot="input"
        className={cn(
          'h-full w-full min-w-0 flex-1 border-0 bg-transparent px-3.5 py-2 outline-none placeholder:text-muted disabled:cursor-not-allowed file:mr-3 file:inline-flex file:border-0 file:bg-transparent file:font-sans file:text-sm file:font-medium file:text-text',
          // Cover the browser's autofill fill so it matches the entire field.
          'autofill:shadow-[inset_0_0_0_1000px_var(--surface-alt)] autofill:[-webkit-text-fill-color:var(--text)] autofill:caret-text',
          isPassword && '[&::-ms-reveal]:hidden',
          inputClassName,
        )}
        {...props}
      />
      {isPassword && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          aria-label={visibilityLabel}
          title={visibilityLabel}
          aria-controls={inputId}
          onClick={() => setPasswordVisible((visible) => !visible)}
          className="order-last h-full w-11 rounded-none bg-transparent text-muted hover:bg-transparent hover:text-text focus-visible:ring-inset focus-visible:ring-offset-0 active:bg-transparent"
        >
          <Icon name={passwordVisible ? 'EyeOffIcon' : 'EyeIcon'} />
        </Button>
      )}
    </div>
  );
}

export { Input };
export type { InputProps };
