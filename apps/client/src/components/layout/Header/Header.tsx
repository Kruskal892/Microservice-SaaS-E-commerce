import { Icon, Input } from '@packages/ui';
import Link from 'next/link';

const Header = () => {
  return (
    <div className="w-full bg-surface">
      <div className="w-4/5 py-5 m-auto flex items-center justify-between">
        <div className="">
          <Link href={'/'}>
            <span className="text-2xl font-semibold">Eshop</span>
          </Link>
        </div>
        <div className="w-1/2 relative">
          <div className="flex items-center gap-8">
            <Input
              iconPosition="end"
              type="search"
              aria-label="Search products"
              placeholder="Search for products"
              icon="SearchIcon"
              className="w-full font-medium border-2 border-brand-500 outline-none h-14 font-poppins"
              inputClassName="px-4"
              iconContainerClassName="w-10 cursor-pointer"
              iconClassName="size-5"
            />

            <div className="flex items-center gap-2">
              <Link
                href={'/login'}
                aria-label="Log in"
                className="border-2 size-12.5 flex items-center justify-center rounded-full border-brand-50"
              >
                <Icon name="ProfileIcon" />
              </Link>

              <Link href={'/login'}>
                <span className="block font-medium">Hello, </span>
                <span className="font-semibold">Sign In</span>
              </Link>
            </div>

            <div className="flex items-center gap-5">
              <Link href={'/wishlist'} className="relative">
                <Icon name="HeartIcon" className="size-7" />
                <div className="size-6 border-2 border-white bg-red-500 rounded-full flex items-center justify-center absolute -top-2.5 -right-2.5 ">
                  <span className="text-white font-medium text-sm">0</span>
                </div>
              </Link>

              <Link href={'/cart'} className="relative">
                <Icon name="CartIcon" className="size-7" />
                <div className="size-6 border-2 border-white bg-red-500 rounded-full flex items-center justify-center absolute -top-2.5 -right-2.5 ">
                  <span className="text-white font-medium text-sm">0</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-b-slate-200"></div>
    </div>
  );
};

export default Header;
