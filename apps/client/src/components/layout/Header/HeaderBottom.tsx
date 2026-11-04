'use client';

import { NAV_MENU } from '@/app/constants/navigation-menu';
import {
  Button,
  Icon,
  Modal,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalTitle,
  ModalTrigger,
} from '@packages/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const linkClassName =
  'flex min-h-11 items-center rounded-sm px-3 py-2 text-sm font-medium text-muted outline-none transition-colors hover:bg-surface-alt hover:text-text focus-visible:ring-2 focus-visible:ring-focus aria-[current=page]:text-text aria-[current=page]:underline aria-[current=page]:underline-offset-8 motion-reduce:transition-none';

export function HeaderBottom() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main navigation"
      className="mx-auto hidden min-h-12 max-w-[1440px] items-center gap-3 px-12 min-[64rem]:flex desktop:px-20"
    >
      {NAV_MENU.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={pathname === item.href ? 'page' : undefined}
          className={`${linkClassName} last:ml-auto`}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  );
}

export function MobileNavigation() {
  const pathname = usePathname();
  return (
    <Modal>
      <ModalTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open navigation"
          className="min-[64rem]:hidden"
        >
          <Icon name="AlignLeftMenuIcon" className="size-6" />
        </Button>
      </ModalTrigger>
      <ModalContent className="start-auto end-0 top-0 h-dvh max-h-dvh w-[min(24rem,100%)] max-w-none translate-x-0 translate-y-0 rounded-none border-y-0 border-e-0 rtl:translate-x-0">
        <div className="flex items-center justify-between gap-4">
          <ModalTitle>Menu</ModalTitle>
          <ModalClose asChild>
            <Button variant="ghost" size="icon" aria-label="Close navigation">
              <Icon name="CloseIcon" />
            </Button>
          </ModalClose>
        </div>
        <ModalDescription className="sr-only">
          Browse Eshop and your saved products.
        </ModalDescription>
        <nav aria-label="Mobile navigation" className="flex flex-col gap-2">
          {[
            ...NAV_MENU,
            { title: 'Your account', href: '/login' },
            { title: 'Wishlist', href: '/wishlist' },
          ].map((item) => (
            <ModalClose key={item.href} asChild>
              <Link
                href={item.href}
                aria-current={pathname === item.href ? 'page' : undefined}
                className={linkClassName}
              >
                {item.title}
              </Link>
            </ModalClose>
          ))}
        </nav>
      </ModalContent>
    </Modal>
  );
}
