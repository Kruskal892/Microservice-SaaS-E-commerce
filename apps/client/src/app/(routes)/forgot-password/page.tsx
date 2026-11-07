'use client';

import {
  forgotPasswordMutation,
  getApiErrorMessage,
  getApiErrorRetryAfterSeconds,
  resetPasswordMutation,
  verifyRecoveryOtpMutation,
} from '@/api/auth';
import { AuthCard } from '@/components';
import {
  type ForgotPasswordPayload,
  forgotPasswordSchema,
  otpCodeSchema,
  type ResetPasswordFormValues,
  resetPasswordSchema,
} from '@/schemas';
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
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'email' | 'otp' | 'password' | 'success'>(
    'email',
  );
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [authorization, setAuthorization] = useState<{
    resetToken: string;
    expiresAt: number;
  } | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resendAt, setResendAt] = useState(0);
  const [resendIn, setResendIn] = useState(0);
  const otpRef = useRef<HTMLInputElement>(null);
  const emailForm = useForm<ForgotPasswordPayload>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });
  const passwordForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const request = useMutation({
    ...forgotPasswordMutation,
    onSuccess: (data, values) => {
      setEmail(values.email);
      startCooldown(data.retryAfterSeconds);
      setOtp('');
      setMessage(data.message);
      setStep('otp');
      otpRef.current?.focus();
    },
    onError: (failure) => {
      const seconds = getApiErrorRetryAfterSeconds(failure);
      if (seconds !== undefined) startCooldown(seconds);
      setError(
        getApiErrorMessage(
          failure,
          'Unable to send a code. Please try again.',
          'Sending timed out. Check your email before requesting another code.',
        ),
      );
    },
  });
  const verify = useMutation({
    ...verifyRecoveryOtpMutation,
    onSuccess: (data) => {
      setAuthorization({
        resetToken: data.resetToken,
        expiresAt: Date.now() + data.expiresInSeconds * 1000,
      });
      setOtp('');
      setMessage('Email verified. Choose your new password.');
      setStep('password');
      verify.reset();
    },
    onError: (failure) => {
      setError(
        getApiErrorMessage(
          failure,
          'Unable to verify the code. Please try again.',
          'Verification timed out. Request a new code if this code no longer works.',
        ),
      );
      otpRef.current?.focus();
    },
  });
  const reset = useMutation({
    ...resetPasswordMutation,
    onSuccess: (data) => {
      setAuthorization(null);
      passwordForm.reset();
      reset.reset();
      setMessage(data.message);
      setStep('success');
    },
    onError: (failure) => {
      setAuthorization(null);
      setError(
        getApiErrorMessage(
          failure,
          'Unable to reset your password. Request a new code and try again.',
          'Password reset timed out. Try signing in with your new password before requesting another code.',
        ),
      );
    },
  });
  const busy = request.isPending || verify.isPending || reset.isPending;

  function startCooldown(seconds: number) {
    setResendAt(Date.now() + seconds * 1000);
    setResendIn(seconds);
  }

  function submitEmail(values: ForgotPasswordPayload) {
    if (busy) return;
    if (values.email === email && Date.now() < resendAt) {
      setError(
        `Please wait ${resendIn} seconds before requesting another code.`,
      );
      return;
    }
    setEmail(values.email);
    setError('');
    setMessage('');
    startCooldown(0);
    request.mutate(values);
  }

  function submitOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const result = otpCodeSchema.safeParse(otp);
    if (!result.success) {
      setError(result.error.issues[0].message);
      otpRef.current?.focus();
      return;
    }
    setError('');
    verify.mutate({ email, otp: result.data });
  }

  function submitPassword(values: ResetPasswordFormValues) {
    if (busy) return;
    if (!authorization || Date.now() >= authorization.expiresAt) {
      setAuthorization(null);
      setError('Your reset session expired. Request a new code.');
      return;
    }
    setError('');
    reset.mutate({
      email,
      resetToken: authorization.resetToken,
      newPassword: values.newPassword,
    });
  }

  function startOver() {
    if (busy) return;
    setStep('email');
    setAuthorization(null);
    setOtp('');
    setError('');
    setMessage('');
    passwordForm.reset();
    request.reset();
    verify.reset();
    reset.reset();
  }

  useEffect(() => {
    if (step === 'otp') otpRef.current?.focus();
    if (step === 'password') passwordForm.setFocus('newPassword');
    if (step === 'email') emailForm.setFocus('email');
  }, [step, emailForm.setFocus, passwordForm.setFocus]);

  useEffect(() => {
    if (!resendAt) return;
    const update = () =>
      setResendIn(Math.max(0, Math.ceil((resendAt - Date.now()) / 1000)));
    const interval = window.setInterval(update, 1000);
    document.addEventListener('visibilitychange', update);
    update();
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', update);
    };
  }, [resendAt]);

  return (
    <AuthCard
      showSocialSignIn={false}
      title={
        step === 'success'
          ? 'Password reset.'
          : step === 'password'
            ? 'Choose a new password.'
            : step === 'otp'
              ? 'Check your email.'
              : 'Forgot your password?'
      }
      description={
        step === 'email' ? (
          'Enter your email address to receive a verification code.'
        ) : step === 'success' ? (
          'You can now sign in with your new password.'
        ) : (
          <>
            Password recovery for <span className="break-all">{email}</span>.
          </>
        )
      }
      footer={
        <Link
          href="/login"
          className="rounded-xs font-medium text-text underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-focus"
        >
          {step === 'success' ? 'Sign in' : 'Back to sign in'}
        </Link>
      }
    >
      {step === 'email' && (
        <form
          noValidate
          className="flex flex-col gap-6"
          onSubmit={emailForm.handleSubmit(submitEmail)}
        >
          <Field>
            <Label htmlFor="recovery-email">Email address</Label>
            <Input
              id="recovery-email"
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              required
              maxLength={254}
              disabled={busy}
              aria-invalid={Boolean(emailForm.formState.errors.email)}
              aria-describedby={
                emailForm.formState.errors.email
                  ? 'recovery-email-error'
                  : undefined
              }
              {...emailForm.register('email')}
            />
            {emailForm.formState.errors.email && (
              <FieldError id="recovery-email-error">
                {emailForm.formState.errors.email.message}
              </FieldError>
            )}
          </Field>
          <Button
            type="submit"
            size="lg"
            loading={request.isPending}
            disabled={busy}
            className="w-full"
          >
            Send verification code
          </Button>
          {request.isError && email && (
            <Button
              variant="ghost"
              onClick={() => {
                setError('');
                setMessage('Enter the code from your latest recovery email.');
                setStep('otp');
              }}
            >
              I received a code
            </Button>
          )}
        </form>
      )}
      {step === 'otp' && (
        <form noValidate className="flex flex-col gap-6" onSubmit={submitOtp}>
          <Field>
            <Label htmlFor="recovery-otp">Verification code</Label>
            <OtpInput
              ref={otpRef}
              id="recovery-otp"
              name="otp"
              length={4}
              className="w-full justify-center"
              value={otp}
              disabled={busy}
              required
              onValueChange={(value) => {
                setOtp(value);
                setError('');
              }}
              aria-invalid={Boolean(error)}
              aria-describedby={
                error ? 'recovery-otp-help recovery-error' : 'recovery-otp-help'
              }
            />
            <FieldDescription id="recovery-otp-help">
              Use the four-digit code from your latest email. Codes expire after
              5 minutes.
            </FieldDescription>
          </Field>
          <Button
            type="submit"
            size="lg"
            loading={verify.isPending}
            disabled={busy}
            className="w-full"
          >
            Verify code
          </Button>
          <Button
            variant="ghost"
            loading={request.isPending}
            disabled={busy || resendIn > 0}
            onClick={() => {
              if (busy || Date.now() < resendAt) return;
              setError('');
              request.mutate({ email });
            }}
          >
            {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
          </Button>
          <Button variant="ghost" disabled={busy} onClick={startOver}>
            Change email address
          </Button>
        </form>
      )}
      {step === 'password' && (
        <form
          noValidate
          className="flex flex-col gap-6"
          onSubmit={passwordForm.handleSubmit(submitPassword)}
        >
          {(['newPassword', 'confirmPassword'] as const).map((name) => (
            <Field key={name}>
              <Label htmlFor={name}>
                {name === 'newPassword' ? 'New password' : 'Confirm password'}
              </Label>
              <Input
                id={name}
                type="password"
                autoComplete="new-password"
                required
                maxLength={128}
                disabled={busy}
                aria-invalid={Boolean(passwordForm.formState.errors[name])}
                aria-describedby={
                  passwordForm.formState.errors[name]
                    ? `${name}-error`
                    : undefined
                }
                {...passwordForm.register(name)}
              />
              {passwordForm.formState.errors[name] && (
                <FieldError id={`${name}-error`}>
                  {passwordForm.formState.errors[name]?.message}
                </FieldError>
              )}
            </Field>
          ))}
          <FieldDescription>
            Use between 8 and 128 characters. Your reset session expires after 5
            minutes.
          </FieldDescription>
          <Button
            type="submit"
            size="lg"
            loading={reset.isPending}
            disabled={busy || !authorization}
            className="w-full"
          >
            Reset password
          </Button>
          <Button variant="ghost" disabled={busy} onClick={startOver}>
            Request a new code
          </Button>
        </form>
      )}
      {message && (
        <p
          role="status"
          className="rounded-sm bg-surface-alt p-4 text-sm text-muted"
        >
          {message}
        </p>
      )}
      {error && (
        <FieldError id="recovery-error" role="alert">
          {error}
        </FieldError>
      )}
    </AuthCard>
  );
}
