'use client';

import {
  getApiErrorMessage,
  getApiErrorRetryAfterSeconds,
  registrationMutation,
  verifyOtpMutation,
} from '@/api/auth';
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
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

export default function SignUpPage() {
  const router = useRouter();
  const [otp, setOtp] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [resendError, setResendError] = useState('');
  const [resendAvailableAt, setResendAvailableAt] = useState(0);
  const [resendIn, setResendIn] = useState(0);
  const otpRef = useRef<HTMLInputElement>(null);
  const [otpMessage, setOtpMessage] = useState('');
  const {
    register,
    handleSubmit,
    setFocus,
    setError,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const signUpMutation = useMutation({
    ...registrationMutation,
    onSuccess: (data) => {
      startResendCooldown(data.retryAfterSeconds);
      openOtpForm(data.message);
    },
    onError: (error) => {
      const retryAfter = getApiErrorRetryAfterSeconds(error);
      if (retryAfter !== undefined) startResendCooldown(retryAfter);
      setError('root.registration', {
        message: getApiErrorMessage(
          error,
          'Unable to request a verification code. Please try again.',
          'The registration request timed out. Check your email before trying again.',
        ),
      });
    },
  });

  const otpVerifyMutation = useMutation({
    ...verifyOtpMutation,
    onSuccess: (data) => {
      setOtpMessage(data.message);
      router.replace('/login');
    },
    onError: (error) => {
      setOtpError(
        getApiErrorMessage(
          error,
          'Unable to verify your email. Please try again.',
          'Verification timed out. Try signing in before submitting again.',
        ),
      );
    },
  });

  const resendMutation = useMutation({
    ...registrationMutation,
    onSuccess: (data) => {
      startResendCooldown(data.retryAfterSeconds);
      setOtp('');
      setOtpError('');
      setOtpMessage(
        'A new code has been sent. Use the code from your latest email.',
      );
    },
    onError: (error) => {
      const retryAfter = getApiErrorRetryAfterSeconds(error);
      if (retryAfter !== undefined) startResendCooldown(retryAfter);
      setResendError(
        getApiErrorMessage(
          error,
          'Unable to resend the code. Please try again.',
          'Resending timed out. Check your email and use the latest code before trying again.',
        ),
      );
    },
  });

  const otpBusy =
    resendMutation.isPending ||
    otpVerifyMutation.isPending ||
    otpVerifyMutation.isSuccess;

  function startResendCooldown(seconds: number) {
    setResendAvailableAt(Date.now() + seconds * 1000);
    setResendIn(seconds);
  }

  function openOtpForm(message: string) {
    setOtp('');
    setOtpError('');
    setResendError('');
    setOtpMessage(message);
    otpVerifyMutation.reset();
    setShowOTP(true);
  }

  function handleReceivedCode() {
    openOtpForm('If you received a code, enter it below to verify your email.');
  }

  function handleSignUpSubmit(data: SignUpFormValues) {
    if (signUpMutation.isPending) return;
    startResendCooldown(0);
    signUpMutation.mutate(data);
  }

  function handleResendOtp() {
    const registration = signUpMutation.variables;
    if (!registration || otpBusy || Date.now() < resendAvailableAt) return;
    setResendError('');
    resendMutation.mutate(registration);
  }

  function handleOtpSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const registration = signUpMutation.variables;
    if (!registration || otpBusy) return;

    const result = otpCodeSchema.safeParse(otp);
    if (!result.success) {
      setOtpError(result.error.issues[0].message);
      otpRef.current?.focus();
      return;
    }

    setOtpError('');
    const { name, email, password } = registration;
    otpVerifyMutation.mutate({ name, email, password, otp: result.data });
  }

  useEffect(() => {
    if (otpError && !otpVerifyMutation.isPending) otpRef.current?.focus();
  }, [otpError, otpVerifyMutation.isPending]);

  useEffect(() => {
    if (showOTP && !resendMutation.isPending) otpRef.current?.focus();
  }, [showOTP, resendMutation.isPending]);

  useEffect(() => {
    if (!showOTP || !resendAvailableAt) return;
    const updateCountdown = () => {
      const remaining = Math.max(
        0,
        Math.ceil((resendAvailableAt - Date.now()) / 1000),
      );
      setResendIn(remaining);
      if (remaining === 0) window.clearInterval(interval);
    };
    const interval = window.setInterval(updateCountdown, 1000);
    updateCountdown();
    document.addEventListener('visibilitychange', updateCountdown);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', updateCountdown);
    };
  }, [showOTP, resendAvailableAt]);

  return (
    <AuthCard
      title={showOTP ? 'Verify your email.' : 'Make it yours.'}
      description={
        showOTP ? (
          <>
            Code entry for{' '}
            <span className="break-all">{signUpMutation.variables?.email}</span>
            .
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
          onSubmit={handleSubmit(handleSignUpSubmit)}
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
            loading={signUpMutation.isPending}
            className="w-full"
          >
            Create account
          </Button>
          {errors.root?.registration?.message && (
            <FieldError role="alert">
              {errors.root.registration.message}
            </FieldError>
          )}
          {signUpMutation.isError && signUpMutation.variables && (
            <Button variant="ghost" onClick={handleReceivedCode}>
              I received a code
            </Button>
          )}
        </form>
      ) : (
        <form
          noValidate
          className="flex flex-col gap-6"
          onSubmit={handleOtpSubmit}
        >
          <Field>
            <Label htmlFor="registration-otp">Verification code</Label>
            <OtpInput
              ref={otpRef}
              id="registration-otp"
              className="w-full flex items-center justify-center"
              name="otp"
              length={4}
              value={otp}
              disabled={otpBusy}
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
              <FieldError id="registration-otp-error" role="alert">
                {otpError}
              </FieldError>
            )}
          </Field>
          <Button
            type="submit"
            size="lg"
            loading={otpVerifyMutation.isPending}
            disabled={resendMutation.isPending || otpVerifyMutation.isSuccess}
            className="w-full"
          >
            Verify email
          </Button>
          <div className="flex flex-col items-center gap-3 text-sm">
            <Button
              variant="ghost"
              size="sm"
              loading={resendMutation.isPending}
              disabled={
                resendIn > 0 ||
                otpVerifyMutation.isPending ||
                otpVerifyMutation.isSuccess
              }
              onClick={handleResendOtp}
              aria-describedby="registration-resend-help"
            >
              {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
            </Button>
            <p id="registration-resend-help" className="text-muted">
              Codes expire after 5 minutes. Use the code from your latest email.
            </p>
            <span className="sr-only" role="status">
              {resendIn === 0 && !otpBusy
                ? 'You can request a new code now.'
                : ''}
            </span>
            {resendError && <FieldError role="alert">{resendError}</FieldError>}
            <Button
              variant="ghost"
              disabled={otpBusy}
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
