'use client';

import { OTPInput, REGEXP_ONLY_DIGITS } from 'input-otp';
import type { ComponentProps } from 'react';
import { cn } from '../../utils';

type OtpInputProps = Omit<
  ComponentProps<typeof OTPInput>,
  | 'type'
  | 'inputMode'
  | 'maxLength'
  | 'minLength'
  | 'pattern'
  | 'render'
  | 'children'
  | 'onChange'
  | 'containerClassName'
> & {
  length?: number;
  onValueChange?: (value: string) => void;
  inputClassName?: string;
  slotClassName?: string;
};

function OtpInput({
  length = 4,
  onValueChange,
  className,
  inputClassName,
  slotClassName,
  ...props
}: OtpInputProps) {
  return (
    <OTPInput
      {...props}
      type="text"
      inputMode="numeric"
      minLength={length}
      maxLength={length}
      pattern={REGEXP_ONLY_DIGITS}
      onChange={onValueChange}
      className={inputClassName}
      containerClassName={cn(
        'flex w-fit max-w-full items-center gap-2 has-disabled:cursor-not-allowed has-disabled:opacity-50',
        className,
      )}
      render={({ slots }) => (
        <>
          {slots.map((slot, index) => (
            <span
              key={index}
              aria-hidden="true"
              data-slot="otp-slot"
              data-active={slot.isActive}
              className={cn(
                'flex h-12 w-10 min-w-0 items-center justify-center rounded-md border border-border bg-surface font-mono text-xl font-semibold text-text transition-colors motion-reduce:transition-none tablet:w-12',
                slot.isActive &&
                  !props.readOnly &&
                  'border-focus ring-2 ring-focus/50',
                (props['aria-invalid'] === true ||
                  props['aria-invalid'] === 'true') &&
                  'border-danger',
                slotClassName,
              )}
            >
              {slot.char ??
                (slot.hasFakeCaret && !props.readOnly ? (
                  <span className="h-5 w-px animate-pulse bg-text motion-reduce:animate-none" />
                ) : (
                  <span className="text-muted">{slot.placeholderChar}</span>
                ))}
            </span>
          ))}
        </>
      )}
    />
  );
}

export { OtpInput };
export type { OtpInputProps };
