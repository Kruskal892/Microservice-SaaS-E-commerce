import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Icon, cn } from '@packages/ui';
import Link from 'next/link';

const actionClassName =
  'inline-flex size-11 shrink-0 touch-manipulation items-center justify-center rounded-sm text-text outline-none transition-colors hover:bg-surface-alt focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface motion-reduce:transition-none';

export function HeaderActions() {
  return (
    <div className="flex items-center gap-1 min-[64rem]:gap-3">
      <Link
        href="/login"
        aria-label="Sign in to your account"
        title="Your account"
        className={cn(actionClassName, 'hidden mobile:inline-flex')}
      >
        <Icon name="ProfileIcon" className="size-6" />
      </Link>
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
