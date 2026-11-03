'use client';

import { Icon, Switch, type SwitchProps, cn } from '@packages/ui';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

type ThemeToggleProps = Omit<SwitchProps, 'checked' | 'defaultChecked'>;

export function ThemeToggle({
  className,
  thumbClassName,
  onCheckedChange,
  disabled,
  ...props
}: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className="flex h-10 shrink-0 items-center gap-1.5">
      <Icon
        name="SunIcon"
        className="size-4 text-warning-foreground dark:opacity-40"
      />
      <Switch
        aria-label="Dark mode"
        title="Dark mode"
        {...props}
        checked={mounted && resolvedTheme === 'dark'}
        disabled={!mounted || disabled}
        onCheckedChange={(checked) => {
          setTheme(checked ? 'dark' : 'light');
          onCheckedChange?.(checked);
        }}
        className={cn('h-7 w-12', className)}
        thumbClassName={cn('size-6', thumbClassName)}
      />
      <Icon
        name="MoonIcon"
        className="size-4 text-muted opacity-40 dark:text-focus dark:opacity-100"
      />
    </div>
  );
}

export type { ThemeToggleProps };
