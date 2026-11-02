import { Button, type ButtonProps, Icon, cn } from '@packages/ui';

type GoogleButtonProps = Omit<ButtonProps, 'variant'> & {
  variant?: ButtonProps['variant'];
};

export function GoogleButton({
  className,
  variant = 'secondary',
  size = 'lg',
  children = 'Sign in with Google',
  ...props
}: GoogleButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      className={cn('w-full', className)}
      {...props}
    >
      <Icon name="GoogleIcon" />
      <span>{children}</span>
    </Button>
  );
}

export type { GoogleButtonProps };

