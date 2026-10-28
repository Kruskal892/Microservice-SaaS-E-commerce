import { Icon, Input } from '@packages/ui';
import Link from 'next/link';
import { HeaderBottom } from './HeaderBottom';

const Header = () => {
  return (
    <div className="w-full bg-surface">
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center gap-4 px-4 py-4 tablet:grid-cols-[auto_minmax(0,1fr)_auto] tablet:gap-8 tablet:px-6">
        <div>
          <Link href={'/'}>
            <span className="text-2xl font-semibold">Eshop</span>
          </Link>
        </div>
        <div className="order-last col-span-2 min-w-0 tablet:order-0 tablet:col-span-1 tablet:w-full tablet:max-w-sm tablet:justify-self-center">
          <Input
            iconPosition="end"
            type="search"
            aria-label="Search products"
            placeholder="Search for products"
            icon="SearchIcon"
            className="h-12 w-full border-2 border-brand-500 font-medium font-poppins"
            inputClassName="px-4"
            iconContainerClassName="w-10 cursor-pointer"
            iconClassName="size-5"
          />
        </div>
        <div className="flex shrink-0 items-center gap-5 tablet:gap-6">
          <div className="flex items-center gap-2">
            <Link
              href={'/login'}
              aria-label="Log in"
              className="flex size-10 items-center justify-center rounded-full border border-border"
            >
              <Icon name="ProfileIcon" />
            </Link>

            <Link
              href={'/login'}
              className="hidden whitespace-nowrap tablet:block"
            >
              <span className="block text-xs text-muted">Hello, </span>
              <span className="text-sm font-semibold">Sign In</span>
            </Link>
          </div>

          <div className="flex items-center gap-5">
            <Link
              href={'/wishlist'}
              aria-label="Wishlist, 0 items"
              className="relative flex size-10 items-center justify-center"
            >
              <Icon name="HeartIcon" className="size-7" />
              <span
                aria-hidden="true"
                className="absolute top-0 right-0 flex size-5 items-center justify-center rounded-full border-2 border-surface bg-danger text-xs text-on-action"
              >
                0
              </span>
            </Link>

            <Link
              href={'/cart'}
              aria-label="Cart, 0 items"
              className="relative flex size-10 items-center justify-center"
            >
              <Icon name="CartIcon" className="size-7" />
              <span
                aria-hidden="true"
                className="absolute top-0 right-0 flex size-5 items-center justify-center rounded-full border-2 border-surface bg-danger text-xs text-on-action"
              >
                0
              </span>
            </Link>
          </div>
        </div>
      </div>

      <div className="border-b border-border" />
      <HeaderBottom />
    </div>
  );
};

export default Header;
