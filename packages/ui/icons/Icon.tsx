import type { ComponentProps } from 'react';
import * as icons from '../../assets/icons';
import { cn } from '../utils';

type IconName = keyof typeof icons;

function Icon({
  name,
  className,
  ...props
}: ComponentProps<'svg'> & { name: IconName }) {
  const Svg = icons[name];

  return (
    <Svg
      aria-hidden="true"
      focusable="false"
      className={cn('size-5', className)}
      {...props}
    />
  );
}

export { Icon };
export type { IconName };
