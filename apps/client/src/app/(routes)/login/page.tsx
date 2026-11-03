'use client';

import { AuthCard, PasswordInput } from '@/components';
import { type LoginFormValues, loginSchema } from '@/schemas';
import { zodResolver } from '@/utils/zod-resolver';
import {
  Button,
  Checkbox,
  Field,
  FieldError,
  Input,
  Label,
} from '@packages/ui';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

export default function Login() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  return (
    <AuthCard
      title="Welcome back"
      description="Enter your details to sign in to your account."
      footer={
        <>
          New to Eshop?{' '}
          <Link
            href="/sign-up"
            className="rounded-sm font-semibold text-action underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-focus dark:text-focus"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form
        onSubmit={handleSubmit(() => setSubmitted(true))}
        noValidate
        className="flex flex-col gap-5"
      >
        <Field className="font-roboto">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
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
          <PasswordInput
            id="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            required
            className="h-12 rounded-lg font-roboto"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'password-error' : undefined}
            {...register('password')}
          />
          {errors.password && (
            <FieldError id="password-error">
              {errors.password.message}
            </FieldError>
          )}
        </Field>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Checkbox id="remember-me" name="rememberMe" />
            <Label htmlFor="remember-me" className="cursor-pointer font-normal">
              Remember me
            </Label>
          </div>
          <Link
            href="/forgot-password"
            className="rounded-sm font-medium text-action underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-focus dark:text-focus"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full rounded-lg font-roboto font-semibold shadow-sm"
        >
          Sign in
        </Button>
        {submitted && (
          <p
            role="status"
            className="rounded-lg bg-surface-alt p-3 text-sm text-muted"
          >
            Sign-in is not available yet. Your details have not been sent.
          </p>
        )}
      </form>
    </AuthCard>
  );
}
