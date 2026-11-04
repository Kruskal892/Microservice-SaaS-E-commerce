import { Input } from '@packages/ui';
import Link from 'next/link';
import { HeaderActions } from './HeaderActions';
import { HeaderBottom, MobileNavigation } from './HeaderBottom';

export default function Header() {
  return (
    <header className="sticky top-0 z-20 w-full border-b border-border bg-surface text-text">
      <div className="mx-auto grid max-w-360 grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 px-4 py-2.5 mobile:px-5 tablet:px-8 min-[64rem]:grid-cols-[1fr_minmax(0,540px)_1fr] min-[64rem]:gap-6 min-[64rem]:px-12 min-[64rem]:py-4 desktop:px-20">
        <Link
          href="/"
          aria-label="Eshop home"
          className="w-fit rounded-sm text-[28px] leading-10 font-bold tracking-[-0.055em] outline-none hover:text-muted focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface min-[64rem]:text-4xl"
        >
          MicroShop
        </Link>
        <form
          action="/products"
          role="search"
          aria-label="Product search"
          className="order-last col-span-2 min-w-0 min-[64rem]:order-0 min-[64rem]:col-span-1"
        >
          <Input
            name="q"
            type="search"
            aria-label="Search products and shops"
            placeholder="Search products and shops?"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            icon="SearchIcon"
            className="h-11 border-transparent bg-surface-alt has-focus-visible:bg-surface"
            inputClassName="pl-0 min-[64rem]:text-sm"
          />
        </form>
        <div className="flex items-center justify-self-end gap-1 min-[64rem]:gap-3">
          <MobileNavigation />
          <HeaderActions />
        </div>
      </div>
      <HeaderBottom />
    </header>
  );
}
