'use client';

import { NAV_MENU } from '@/app/constants/navigation-menu';
import { Icon, cn } from '@packages/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { HeaderActions } from './HeaderActions';

export const HeaderBottom = () => {
  const pathname = usePathname();
  const navigationRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(
        (navigationRef.current?.getBoundingClientRect().top ?? 1) <= 0,
      );
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      ref={navigationRef}
      className={cn(
        'sticky top-0 z-50 border-y border-border bg-surface/95 text-text backdrop-blur-md transition-shadow motion-reduce:transition-none',
        isSticky && 'shadow-sm',
      )}
    >
      <div className="relative mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 tablet:px-6">
        <nav
          aria-label="Main navigation"
          className="hidden min-w-0 items-center gap-1 tablet:flex desktop:gap-2"
        >
          {NAV_MENU.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? 'page' : undefined}
              className="rounded-lg px-3 py-2.5 text-sm font-medium whitespace-nowrap text-muted transition-colors hover:bg-surface-alt hover:text-text focus-visible:outline-2 focus-visible:outline-focus aria-[current=page]:bg-surface-alt aria-[current=page]:text-text motion-reduce:transition-none"
            >
              {item.title}
            </Link>
          ))}
        </nav>

        <details className="tablet:hidden">
          <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-lg px-3 text-sm font-medium hover:bg-surface-alt focus-visible:outline-2 focus-visible:outline-focus [&::-webkit-details-marker]:hidden">
            <Icon name="AlignLeftMenuIcon" />
            Menu
          </summary>
          <nav
            aria-label="Mobile navigation"
            className="absolute top-full right-4 left-4 z-10 flex flex-col gap-1 rounded-xl border border-border bg-surface p-2 shadow-lg"
          >
            {NAV_MENU.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? 'page' : undefined}
                onClick={(event) =>
                  event.currentTarget
                    .closest('details')
                    ?.removeAttribute('open')
                }
                className="rounded-lg px-3 py-3 text-sm font-medium text-muted hover:bg-surface-alt hover:text-text focus-visible:outline-2 focus-visible:outline-focus aria-[current=page]:bg-surface-alt aria-[current=page]:text-text"
              >
                {item.title}
              </Link>
            ))}
            <Link
              href="/wishlist"
              onClick={(event) =>
                event.currentTarget.closest('details')?.removeAttribute('open')
              }
              className="flex items-center gap-2 rounded-lg border-t border-border px-3 py-3 text-sm font-medium text-muted hover:bg-surface-alt hover:text-text focus-visible:outline-2 focus-visible:outline-focus"
            >
              <Icon name="HeartIcon" />
              Wishlist
            </Link>
          </nav>
        </details>

        {isSticky && <HeaderActions compact />}
      </div>
    </div>
  );
};
