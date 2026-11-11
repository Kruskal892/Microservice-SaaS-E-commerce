'use client';

import { AuthCard } from '@/components';
import useUser from '@/hooks/useUser';
import { Button } from '@packages/ui';
import Link from 'next/link';

export default function Profile() {
  const { user, isLoading, isError, isFetching, refetchUser } = useUser();

  return (
    <AuthCard
      title="Your profile"
      description="Your MicroShop account details."
      showSocialSignIn={false}
      footer={
        <Link
          href="/"
          className="underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-focus"
        >
          Continue shopping
        </Link>
      }
    >
      {isLoading ? (
        <p role="status">Loading your profile…</p>
      ) : isError ? (
        <div className="flex flex-col items-start gap-4">
          <p role="alert">We couldn't load your profile. Please try again.</p>
          <Button loading={isFetching} onClick={() => void refetchUser()}>
            Try again
          </Button>
        </div>
      ) : user ? (
        <dl className="divide-y divide-border">
          <div className="flex flex-col gap-2 pb-6">
            <dt className="text-sm text-muted">Name</dt>
            <dd className="text-lg font-medium wrap-anywhere">{user.name}</dd>
          </div>
          <div className="flex flex-col gap-2 py-6">
            <dt className="text-sm text-muted">Email address</dt>
            <dd className="text-lg font-medium wrap-anywhere">{user.email}</dd>
          </div>
        </dl>
      ) : (
        <div className="flex flex-col items-start gap-4">
          <p>Sign in to view your profile.</p>
          <Link
            href="/login"
            className="font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-focus"
          >
            Sign in
          </Link>
        </div>
      )}
    </AuthCard>
  );
}
