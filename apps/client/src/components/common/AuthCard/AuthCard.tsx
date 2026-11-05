import type { ReactNode } from 'react';
import { GoogleButton } from '../GoogleButton';

type AuthCardProps = {
  title: string;
  description: ReactNode;
  children: ReactNode;
  footer: ReactNode;
  showSocialSignIn?: boolean;
};

export function AuthCard({
  title,
  description,
  children,
  footer,
  showSocialSignIn = true,
}: AuthCardProps) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto grid min-h-[calc(100svh-8rem)] w-full max-w-304 content-start gap-12 px-4 py-12 mobile:px-5 tablet:px-8 desktop:grid-cols-[minmax(0,1fr)_minmax(0,536px)] desktop:px-12 desktop:py-24"
    >
      <div className="flex min-w-0 flex-col gap-28 desktop:pt-6">
        <div className="flex flex-col gap-6">
          <h1 className="text-mobile-h1 font-semibold text-balance wrap-break-word desktop:text-auth-display">
            {title}
          </h1>
          <p className="max-w-[40ch] text-base leading-7 wrap-break-word text-muted desktop:text-lg">
            {description}
          </p>
        </div>
        <p className="hidden text-callout leading-9.25 font-medium tracking-tight desktop:block">
          Considered finds.
          <br />A place to call yours.
        </p>
      </div>
      <div className="flex min-w-0 flex-col gap-8 desktop:border-l desktop:border-border desktop:pl-21.75">
        {showSocialSignIn && (
          <>
            <div className="flex flex-col gap-3">
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
                Google sign-in is coming soon.
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted">
              <span className="h-px flex-1 bg-border" aria-hidden="true" />
              <span>or</span>
              <span className="h-px flex-1 bg-border" aria-hidden="true" />
            </div>
          </>
        )}
        {children}
        <div className="text-center text-sm text-muted">{footer}</div>
      </div>
    </main>
  );
}
