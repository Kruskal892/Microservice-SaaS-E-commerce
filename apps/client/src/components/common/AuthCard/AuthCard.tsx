import { Card } from '@packages/ui';
import type { ReactNode } from 'react';
import { GoogleButton } from '../GoogleButton';

type AuthCardProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthCard({
  title,
  description,
  children,
  footer,
}: AuthCardProps) {
  return (
    <main className="flex min-h-[calc(100svh-14rem)] items-center justify-center px-4 py-10 tablet:py-16">
      <Card className="w-full max-w-md overflow-hidden rounded-2xl font-roboto shadow-xl shadow-black/5">
        <div className="flex flex-col gap-7 p-6 tablet:p-8">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold tracking-widest text-muted uppercase">
              Your Eshop account
            </p>
            <h1 className="font-poppins text-2xl font-semibold tracking-tight tablet:text-3xl">
              {title}
            </h1>
            <p className="text-sm leading-6 text-muted">{description}</p>
          </div>

          <div className="flex flex-col gap-2">
            <GoogleButton disabled className="rounded-lg font-roboto">
              Continue with Google
            </GoogleButton>
            <p className="text-center text-xs text-muted">
              Google sign-in is coming soon.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-border" aria-hidden="true" />
            <span>or continue with email</span>
            <span className="h-px flex-1 bg-border" aria-hidden="true" />
          </div>

          {children}
        </div>
        <div className="border-t border-border bg-surface-alt px-6 py-5 text-center text-sm text-muted tablet:px-8">
          {footer}
        </div>
      </Card>
    </main>
  );
}
