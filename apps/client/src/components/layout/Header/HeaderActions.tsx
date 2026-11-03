import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Icon, cn } from '@packages/ui';
import Link from 'next/link';

const actionClassName =
  'inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-alt hover:text-text focus-visible:outline-2 focus-visible:outline-focus motion-reduce:transition-none';

export function HeaderActions({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex shrink-0 items-center gap-1 tablet:gap-2">
      <Link
        href="/login"
        aria-label="Sign in to your account"
        title="Sign in to your account"
        className={cn(
          actionClassName,
          !compact && 'desktop:w-auto desktop:gap-2 desktop:px-3',
        )}
      >
        <Icon name="ProfileIcon" />
        {!compact && (
          <span className="hidden text-left desktop:block">
            <span className="block text-xs text-muted">Your account</span>
            <span className="block text-sm font-semibold text-text">
              Sign in
            </span>
          </span>
        )}
      </Link>
      <Link
        href="/wishlist"
        aria-label="Wishlist"
        title="Wishlist"
        className={cn(actionClassName, 'hidden tablet:inline-flex')}
      >
        <Icon name="HeartIcon" className="size-6" />
      </Link>
      <Link
        href="/cart"
        aria-label="Cart, 0 items"
        title="Cart"
        className={cn(
          actionClassName,
          !compact && 'desktop:w-auto desktop:gap-2 desktop:px-3',
        )}
      >
        <Icon name="CartIcon" className="size-6" />
        {!compact && (
          <span className="hidden text-sm font-medium desktop:inline">
            Cart
          </span>
        )}
      </Link>
      <div className="border-l border-border pl-2 tablet:pl-3">
        <ThemeToggle />
      </div>
    </div>
  );
}
