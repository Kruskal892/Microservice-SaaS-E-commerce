'use client';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import useUser from '@/hooks/useUser';
import { Icon, cn } from '@packages/ui';
import Link from 'next/link';

const actionClassName =
  'inline-flex size-11 shrink-0 touch-manipulation items-center justify-center rounded-sm text-text outline-none transition-colors hover:bg-surface-alt focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface motion-reduce:transition-none';

export function HeaderActions() {
  const { user, isLoading, isError } = useUser();
  const accountLabel = user
    ? `${user.name}'s profile`
    : isError
      ? 'Your account'
      : 'Sign in to your account';

  return (
    <div className="flex items-center gap-1 min-[64rem]:gap-3">
      {isLoading ? (
        <span
          role="status"
          aria-label="Checking your account"
          className={cn(actionClassName, 'hidden mobile:inline-flex')}
        >
          <Icon name="ProfileIcon" className="size-6 text-muted" />
        </span>
      ) : (
        <Link
          href={user || isError ? '/profile' : '/login'}
          aria-label={accountLabel}
          title={accountLabel}
          className={cn(actionClassName, 'hidden mobile:inline-flex')}
        >
          {user ? (
            <span
              aria-hidden="true"
              className="flex size-8 items-center justify-center rounded-full bg-action text-sm font-semibold text-on-action"
            >
              {user.name.charAt(0).toUpperCase()}
            </span>
          ) : (
            <Icon name="ProfileIcon" className="size-6" />
          )}
        </Link>
      )}
      <Link
        href="/wishlist"
        aria-label="Wishlist"
        title="Wishlist"
        className={cn(actionClassName, 'hidden min-[64rem]:inline-flex')}
      >
        <Icon name="HeartIcon" className="size-6" />
      </Link>
      <Link
        href="/cart"
        aria-label="Cart"
        title="Cart"
        className={actionClassName}
      >
        <Icon name="CartIcon" className="size-6" />
      </Link>
      <ThemeToggle />
    </div>
  );
}
