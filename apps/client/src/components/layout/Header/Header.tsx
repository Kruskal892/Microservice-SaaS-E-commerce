import { Input } from '@packages/ui';
import Link from 'next/link';
import { HeaderActions } from './HeaderActions';
import { HeaderBottom } from './HeaderBottom';

export default function Header() {
  return (
    <>
      <header className="w-full bg-surface text-text transition-colors duration-200 motion-reduce:transition-none">
        <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center gap-3 px-4 py-4 tablet:grid-cols-[auto_minmax(0,1fr)_auto] tablet:gap-6 tablet:px-6">
          <Link
            href="/"
            aria-label="Eshop home"
            className="rounded-sm font-poppins text-2xl font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-focus"
          >
            <span className="text-action dark:text-focus">E</span>shop
          </Link>

          <div className="order-last col-span-2 min-w-0 tablet:order-0 tablet:col-span-1 tablet:w-full tablet:max-w-sm tablet:justify-self-center">
            <Input
              iconPosition="start"
              type="search"
              aria-label="Search products"
              placeholder="Search products..."
              icon="SearchIcon"
              className="h-11 rounded-xl bg-surface-alt font-roboto has-focus-visible:bg-surface"
              inputClassName="pr-4 pl-0"
              iconClassName="size-5"
            />
          </div>

          <HeaderActions />
        </div>
      </header>
      <HeaderBottom />
    </>
  );
}
