'use client';

import { NAV_MENU } from '@/app/constants/navigation-menu';
import { Button, Icon } from '@packages/ui';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export const HeaderBottom = () => {
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsSticky(window.scrollY > 100);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="h-16">
      <div
        className={`w-full bg-surface ${isSticky ? 'fixed top-0 left-0 z-100 shadow-sm' : 'relative'}`}
      >
        <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 tablet:px-6 desktop:gap-6">
          <Button
            disabled
            title="Departments are not available yet"
            className="h-11 w-44 justify-between px-2 font-roboto desktop:w-56 desktop:px-4"
          >
            <span className="flex items-center gap-2">
              <Icon name="AlignLeftMenuIcon" />
              <span className="text-sm">All Departments</span>
            </span>
            <Icon name="ChevronDownIcon" />
          </Button>

          <nav
            aria-label="Main navigation"
            className="hidden min-w-0 items-center gap-1 tablet:flex desktop:gap-2"
          >
            {NAV_MENU.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-sm px-2 py-3 text-sm font-medium whitespace-nowrap hover:bg-surface-alt focus-visible:outline-2 focus-visible:outline-focus desktop:px-3 desktop:text-base"
              >
                {item.title}
              </Link>
            ))}
          </nav>

          <details className="tablet:hidden">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-sm px-3 py-2 text-sm font-medium hover:bg-surface-alt focus-visible:outline-2 focus-visible:outline-focus [&::-webkit-details-marker]:hidden">
              <Icon name="AlignLeftMenuIcon" />
              Menu
            </summary>
            <nav
              aria-label="Mobile navigation"
              className="absolute top-full right-4 left-4 z-10 rounded-sm border border-border bg-surface p-2 shadow-lg"
            >
              {NAV_MENU.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-sm px-3 py-3 text-sm font-medium hover:bg-surface-alt focus-visible:outline-2 focus-visible:outline-focus"
                >
                  {item.title}
                </Link>
              ))}
            </nav>
          </details>

          {isSticky && (
            <div className="hidden shrink-0 items-center gap-2 desktop:flex">
              <Link
                href="/login"
                aria-label="Log in"
                className="flex size-11 items-center justify-center rounded-full hover:bg-surface-alt"
              >
                <Icon name="ProfileIcon" />
              </Link>
              <Link
                href="/wishlist"
                aria-label="Wishlist, 0 items"
                className="relative flex size-11 items-center justify-center rounded-full hover:bg-surface-alt"
              >
                <Icon name="HeartIcon" className="size-6" />
                <span
                  aria-hidden="true"
                  className="absolute top-0 right-0 flex size-5 items-center justify-center rounded-full border-2 border-surface bg-danger text-xs text-on-action"
                >
                  0
                </span>
              </Link>
              <Link
                href="/cart"
                aria-label="Cart, 0 items"
                className="relative flex size-11 items-center justify-center rounded-full hover:bg-surface-alt"
              >
                <Icon name="CartIcon" className="size-6" />
                <span
                  aria-hidden="true"
                  className="absolute top-0 right-0 flex size-5 items-center justify-center rounded-full border-2 border-surface bg-danger text-xs text-on-action"
                >
                  0
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
