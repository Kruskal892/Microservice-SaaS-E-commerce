'use client';

import { AuthCard } from '@/components';
import { type SignUpFormValues, otpCodeSchema, signUpSchema } from '@/schemas';
import { zodResolver } from '@/utils/zod-resolver';
import {
  Button,
  Field,
  FieldDescription,
  FieldError,
  Input,
  Label,
  OtpInput,
} from '@packages/ui';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

export default function SignUpPage() {
  const [submitted, setSubmitted] = useState(false);
  const [otp, setOtp] = useState('');
  const [showOTP] = useState(true);
  const [resendIn, setResendIn] = useState(60);
  const [resendAttempt, setResendAttempt] = useState(0);
  // shortcut: OTP actions only show feedback, connect auth requests when registration is wired.
  const [otpMessage, setOtpMessage] = useState('');
  const isOtpComplete = otpCodeSchema.safeParse(otp).success;

  useEffect(() => {
    if (!showOTP) return;

    const deadline = Date.now() + 60_000;
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setResendIn(remaining);
      if (remaining === 0) window.clearInterval(interval);
    };
    const interval = window.setInterval(updateCountdown, 1000);
    document.addEventListener('visibilitychange', updateCountdown);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', updateCountdown);
    };
  }, [showOTP, resendAttempt]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  return (
    <AuthCard
      title="Create your account"
      description="Start with your name, email, and a password."
      footer={
        <>
          Already have an account?{' '}
          <Link
            href="/login"
            className="rounded-sm font-semibold text-action underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-focus dark:text-focus"
          >
            Sign in
          </Link>
        </>
      }
    >
      {!showOTP ? (
        <form
          onSubmit={handleSubmit(() => setSubmitted(true))}
          noValidate
          className="flex flex-col gap-5"
        >
          <Field className="font-roboto">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              placeholder="Your full name"
              autoComplete="name"
              required
              maxLength={100}
              className="h-12 rounded-lg font-roboto"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'name-error' : undefined}
              {...register('name')}
            />
            {errors.name && (
              <FieldError id="name-error">{errors.name.message}</FieldError>
            )}
          </Field>

          <Field className="font-roboto">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              maxLength={254}
              className="h-12 rounded-lg font-roboto"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
              {...register('email')}
            />
            {errors.email && (
              <FieldError id="email-error">{errors.email.message}</FieldError>
            )}
          </Field>

          <Field className="font-roboto">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
              autoComplete="new-password"
              required
              maxLength={128}
              className="h-12 rounded-lg font-roboto"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password
                  ? 'password-hint password-error'
                  : 'password-hint'
              }
              {...register('password')}
            />
            <FieldDescription id="password-hint" className="text-xs">
              Use between 8 and 128 characters.
            </FieldDescription>
            {errors.password && (
              <FieldError id="password-error">
                {errors.password.message}
              </FieldError>
            )}
          </Field>

          <Field className="font-roboto">
            <Label htmlFor="confirm-password">Confirm password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Repeat your password"
              autoComplete="new-password"
              required
              maxLength={128}
              className="h-12 rounded-lg font-roboto"
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={
                errors.confirmPassword ? 'confirm-password-error' : undefined
              }
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <FieldError id="confirm-password-error">
                {errors.confirmPassword.message}
              </FieldError>
            )}
          </Field>

          <Button
            type="submit"
            size="lg"
            className="w-full rounded-lg font-roboto font-semibold shadow-sm"
          >
            Create account
          </Button>
          {submitted && (
            <p
              role="status"
              className="rounded-lg bg-surface-alt p-3 text-sm text-muted"
            >
              Account creation is not available yet. Your details have not been
              sent.
            </p>
          )}
        </form>
      ) : (
        <form
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (!isOtpComplete) return;
            setOtpMessage(
              'Code verification is not connected yet. Your code has not been sent.',
            );
          }}
        >
          <Field className="items-center text-center font-roboto">
            <Label htmlFor="registration-otp">Enter verification code</Label>
            <FieldDescription id="registration-otp-help">
              Enter the four-digit code to continue.
            </FieldDescription>
            <OtpInput
              id="registration-otp"
              name="otp"
              length={4}
              value={otp}
              onValueChange={(value) => {
                setOtp(value);
                setOtpMessage('');
              }}
              required
              aria-describedby="registration-otp-help"
            />
          </Field>
          <Button
            type="submit"
            size="lg"
            disabled={!isOtpComplete}
            className="w-full rounded-lg font-roboto font-semibold shadow-sm"
          >
            Verify code
          </Button>
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm">
            <span className="text-muted">Didn&apos;t receive a code?</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={resendIn > 0}
              onClick={() => {
                if (resendIn > 0) return;
                setResendIn(60);
                setResendAttempt((attempt) => attempt + 1);
                setOtpMessage(
                  'Resending is not connected yet. No new code has been sent.',
                );
              }}
              className="font-roboto text-action hover:bg-transparent dark:text-focus"
            >
              {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
            </Button>
            <span className="sr-only" role="status">
              {resendIn === 0 ? 'You can request a new code now.' : ''}
            </span>
          </div>
          {otpMessage && (
            <p
              role="status"
              className="rounded-lg bg-surface-alt p-3 text-center text-sm text-muted"
            >
              {otpMessage}
            </p>
          )}
        </form>
      )}
    </AuthCard>
  );
}
