import {
  Badge,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@packages/ui';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { GoogleButton } from '../GoogleButton';

type AuthCardProps = {
  title: string;
  description: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  showSocialSignIn?: boolean;
};

const WORKSPACE_HIGHLIGHTS = [
  {
    title: 'Catalog & SKU control',
    detail:
      'Update pricing, variant stock counts, and product media across your storefront.',
  },
  {
    title: 'Order fulfillment queue',
    detail:
      'Review incoming customer purchases, confirm dispatches, and track delivery status.',
  },
  {
    title: 'Scheduled settlements',
    detail:
      'Reconcile completed order payouts and inspect itemized transaction statements.',
  },
];

export function AuthCard({
  title,
  description,
  children,
  footer,
  showSocialSignIn = true,
}: AuthCardProps) {
  return (
    <div className=" flex min-h-svh flex-col bg-surface-alt text-text">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 mobile:px-6">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xs outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <span className="text-lg font-bold tracking-tight">ESHOP</span>
            <Badge tone="neutral" className="rounded-xs px-2 py-0.5">
              Seller Center
            </Badge>
          </Link>
          <div className="text-sm text-muted">{footer}</div>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto grid w-full max-w-6xl flex-1 content-center gap-8 px-4 py-8 mobile:px-6 tablet:py-12 desktop:grid-cols-[minmax(0,448px)_minmax(0,1fr)] desktop:items-start desktop:gap-12"
      >
        <Card className="w-full max-w-md justify-self-center desktop:justify-self-start">
          <CardHeader className="gap-2 border-b border-border pb-5">
            <h1 className="text-2xl leading-8 font-semibold tracking-tight text-balance">
              {title}
            </h1>
            <p className="text-sm leading-6 text-muted">{description}</p>
          </CardHeader>

          <CardContent className="flex flex-col gap-6 pt-6">
            {children}

            {showSocialSignIn && (
              <>
                <div className="flex items-center gap-4 text-xs text-muted">
                  <span className="h-px flex-1 bg-border" aria-hidden="true" />
                  <span>or continue with</span>
                  <span className="h-px flex-1 bg-border" aria-hidden="true" />
                </div>
                <div className="flex flex-col gap-2">
                  <GoogleButton
                    disabled
                    aria-describedby="google-sign-in-status"
                    className="border-transparent bg-muted-surface text-muted disabled:opacity-100"
                  >
                    Continue with Google
                  </GoogleButton>
                  <p
                    id="google-sign-in-status"
                    className="text-center text-xs text-muted"
                  >
                    Google sign-in for merchant accounts is coming soon.
                  </p>
                </div>
              </>
            )}
          </CardContent>

          {footer && (
            <CardFooter className="justify-center border-t border-border pt-4 text-center text-sm text-muted">
              {footer}
            </CardFooter>
          )}
        </Card>

        <aside
          aria-label="Seller Center workspace overview"
          className="flex flex-col justify-between gap-8 rounded-md border border-border bg-surface p-6 tablet:p-8"
        >
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
              <div>
                <h2 className="text-lg font-semibold">
                  Merchant operations in one place
                </h2>
                <p className="text-sm text-muted">
                  Built for independent studios and storefronts on Eshop.
                </p>
              </div>
              <Badge tone="neutral">Merchant Portal</Badge>
            </div>

            <dl className="grid gap-4 tablet:grid-cols-3 desktop:grid-cols-1">
              {WORKSPACE_HIGHLIGHTS.map((item) => (
                <div
                  key={item.title}
                  className="rounded-sm border border-border bg-surface-alt p-4"
                >
                  <dt className="text-sm font-semibold text-text">
                    {item.title}
                  </dt>
                  <dd className="mt-1 text-sm leading-5 text-muted">
                    {item.detail}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4 text-xs text-muted">
            <span>Protected merchant session with HttpOnly credentials</span>
            <Link
              href="/forgot-password"
              className="rounded-xs font-medium text-text underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-focus"
            >
              Trouble signing in?
            </Link>
          </div>
        </aside>
      </main>
    </div>
  );
}
