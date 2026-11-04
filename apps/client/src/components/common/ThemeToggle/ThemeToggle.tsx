'use client';

import { Button, Icon, type ButtonProps, cn } from '@packages/ui';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

type ThemeToggleProps = ButtonProps;

export function ThemeToggle({
  className,
  onClick,
  disabled,
  ...props
}: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === 'dark';

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Dark mode"
      title="Dark mode"
      {...props}
      aria-pressed={dark}
      disabled={!mounted || disabled}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) setTheme(dark ? 'light' : 'dark');
      }}
      className={cn('shrink-0', className)}
    >
      <Icon name={dark ? 'MoonIcon' : 'SunIcon'} className="size-6" />
    </Button>
  );
}

export type { ThemeToggleProps };
