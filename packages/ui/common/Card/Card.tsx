import type { ComponentProps } from 'react';
import { cn } from '../../utils';

function Card({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      {...props}
      data-slot="card"
      className={cn(
        'flex flex-col rounded-md border border-border bg-surface font-sans text-text',
        className,
      )}
    />
  );
}
function CardHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      {...props}
      data-slot="card-header"
      className={cn('flex flex-col gap-2 p-6', className)}
    />
  );
}
function CardTitle({ className, ...props }: ComponentProps<'h2'>) {
  return (
    <h2
      {...props}
      data-slot="card-title"
      className={cn('text-xl font-semibold', className)}
    />
  );
}
function CardDescription({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      {...props}
      data-slot="card-description"
      className={cn('text-sm text-muted', className)}
    />
  );
}
function CardContent({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      {...props}
      data-slot="card-content"
      className={cn('px-6 pb-6', className)}
    />
  );
}
function CardFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      {...props}
      data-slot="card-footer"
      className={cn('flex flex-wrap items-center gap-2 px-6 pb-6', className)}
    />
  );
}

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};
