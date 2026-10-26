import { Input } from '@packages/ui';
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
          <Input
            type="search"
            aria-label="Search products"
            placeholder="Search for products"
            icon="searchIcon"
            className="w-full font-sans font-medium border-2 border-brand-500 outline-none h-14"
            inputClassName="pl-0"
            iconContainerClassName="w-10"
            iconClassName="size-5"
          />
        </div>
      </div>
    </div>
  );
};

export default Header;
