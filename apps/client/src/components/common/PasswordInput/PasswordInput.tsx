'use client';

import { Button, Icon, Input, type InputProps, cn } from '@packages/ui';
import { useState } from 'react';

export function PasswordInput({
  inputClassName,
  disabled,
  ...props
}: Omit<InputProps, 'type'>) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? 'text' : 'password'}
        disabled={disabled}
        inputClassName={cn('pr-12 [&::-ms-reveal]:hidden', inputClassName)}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled}
        aria-label={visible ? 'Hide password' : 'Show password'}
        title={visible ? 'Hide password' : 'Show password'}
        aria-controls={props.id}
        onClick={() => setVisible(!visible)}
        className="absolute top-1/2 right-1 size-9 -translate-y-1/2 rounded-md text-muted hover:text-text"
      >
        <Icon name={visible ? 'EyeOffIcon' : 'EyeIcon'} className="size-5" />
      </Button>
    </div>
  );
}
