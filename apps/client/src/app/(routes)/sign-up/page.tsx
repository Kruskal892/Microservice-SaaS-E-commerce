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
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

export default function SignUpPage() {
  const [otp, setOtp] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [resendIn, setResendIn] = useState(60);
  const [resendAttempt, setResendAttempt] = useState(0);
  const otpRef = useRef<HTMLInputElement>(null);
  // shortcut: OTP verification and resend are previews; connect those requests before claiming account creation.
  const [otpMessage, setOtpMessage] = useState('');
  const {
    register,
    handleSubmit,
    getValues,
    setFocus,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const signUpMutation = useMutation({
    mutationFn: async (data: SignUpFormValues) => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/user-registration`,
        data,
        { timeout: 15_000 },
      );
      return response.data;
    },
    onSuccess: () => {
      setShowOTP(true);
      setResendIn(60);
      setOtp('');
      setOtpError('');
      setOtpMessage('');
    },
    onError: (error) => {
      const timedOut =
        axios.isAxiosError(error) &&
        (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT');
      const message = axios.isAxiosError<{ message?: unknown }>(error)
        ? error.response?.data?.message
        : undefined;
      setError('root.registration', {
        message:
          timedOut
            ? 'The registration request timed out. Check your email before trying again.'
            : typeof message === 'string' && message.trim()
              ? message
              : 'Unable to request a verification code. Please try again.',
      });
    },
  });

  const onSubmit = (data: SignUpFormValues) => {
    if (signUpMutation.isPending) return;
    signUpMutation.mutate(data);
  };

  useEffect(() => {
    if (showOTP) otpRef.current?.focus();
  }, [showOTP]);

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

  return (
    <AuthCard
      title={showOTP ? 'Verify your email.' : 'Make it yours.'}
      description={
        showOTP ? (
          <>
            Code entry for{' '}
            <span className="break-all">{getValues('email').trim()}</span>.
          </>
        ) : (
          <>
            Create an Eshop account.
            <br />A few details, then you&apos;re ready to explore.
          </>
        )
      }
      showSocialSignIn={!showOTP}
      footer={
        <>
          Already have an account?{' '}
          <Link
            href="/login"
            className="rounded-xs font-medium text-text underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-focus"
          >
            Sign in
          </Link>
        </>
      }
    >
      {!showOTP ? (
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col gap-6"
        >
          <Field>
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              placeholder="Alex Smith"
              autoComplete="name"
              required
              maxLength={100}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'name-error' : undefined}
              {...register('name')}
            />
            {errors.name && (
              <FieldError id="name-error">{errors.name.message}</FieldError>
            )}
          </Field>
          <Field>
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="alex@example.com"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              required
              maxLength={254}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
              {...register('email')}
            />
            {errors.email && (
              <FieldError id="email-error">{errors.email.message}</FieldError>
            )}
          </Field>
          <Field>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
              autoComplete="new-password"
              required
              maxLength={128}
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
          <Field>
            <Label htmlFor="confirm-password">Confirm password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Repeat your password"
              autoComplete="new-password"
              required
              maxLength={128}
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
            loading={isSubmitting || signUpMutation.isPending}
            className="w-full"
          >
            Create account
          </Button>
          {errors.root?.registration?.message && (
            <FieldError role="alert">
              {errors.root.registration.message}
            </FieldError>
          )}
        </form>
      ) : (
        <form
          noValidate
          className="flex flex-col gap-6"
          onSubmit={(event) => {
            event.preventDefault();
            const result = otpCodeSchema.safeParse(otp);
            if (!result.success) {
              setOtpError(result.error.issues[0].message);
              otpRef.current?.focus();
              return;
            }
            setOtpError('');
            setOtpMessage(
              'Code verification is not connected yet. Your account has not been created.',
            );
          }}
        >
          <Field>
            <Label htmlFor="registration-otp">Verification code</Label>
            <OtpInput
              ref={otpRef}
              id="registration-otp"
              name="otp"
              length={4}
              value={otp}
              onValueChange={(value) => {
                setOtp(value);
                setOtpError('');
              }}
              autoCapitalize="none"
              spellCheck={false}
              required
              aria-invalid={Boolean(otpError)}
              aria-describedby={
                otpError
                  ? 'registration-otp-help registration-otp-error'
                  : 'registration-otp-help'
              }
            />
            <FieldDescription id="registration-otp-help">
              Use the 4-digit code from your email.
            </FieldDescription>
            {otpError && (
              <FieldError id="registration-otp-error">{otpError}</FieldError>
            )}
          </Field>
          <Button type="submit" size="lg" className="w-full">
            Verify email
          </Button>
          <div className="flex flex-col items-center gap-3 text-sm">
            <Button
              variant="ghost"
              size="sm"
              disabled={resendIn > 0}
              onClick={() => {
                setResendIn(60);
                setResendAttempt((attempt) => attempt + 1);
                setOtpMessage(
                  'Resending is not available yet. No new code has been sent.',
                );
              }}
              className="min-h-11 tabular-nums"
            >
              {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
            </Button>
            <span className="sr-only" role="status">
              {resendIn === 0 ? 'You can request a new code now.' : ''}
            </span>
            <Button
              variant="ghost"
              onClick={() => {
                setShowOTP(false);
                requestAnimationFrame(() => setFocus('email'));
              }}
            >
              Change email address
            </Button>
          </div>
          <p
            role="status"
            className="rounded-sm bg-surface-alt p-4 text-sm text-muted"
          >
            {otpMessage}
          </p>
        </form>
      )}
    </AuthCard>
  );
}
